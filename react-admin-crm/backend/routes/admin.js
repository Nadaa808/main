const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Apply authentication to all admin routes
router.use(authenticateToken);

// GET all users with full data (KYC, KYB, Wallets, DIDs, etc.)
router.get('/users-full', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        kycProfile: true,
        kybProfile: true,
        wallets: true,
        didProfiles: true,
        verifiableCredentials: true,
        soulboundTokens: true,
        issuedAssets: {
          include: {
            investments: true
          }
        },
        investments: {
          include: {
            asset: true
          }
        }
      }
    });
    res.json(users);
  } catch (error) {
    console.error('Failed to fetch users with full data:', error);
    res.status(500).json({ error: 'Failed to fetch users data' });
  }
});

// GET KYC/KYB statistics
router.get('/kyc-stats', async (req, res) => {
  try {
    const kycStats = await prisma.kYCProfile.groupBy({
      by: ['verificationStatus'],
      _count: {
        verificationStatus: true
      }
    });

    const kybStats = await prisma.kYBProfile.groupBy({
      by: ['verificationStatus'],
      _count: {
        verificationStatus: true
      }
    });

    res.json({ kyc: kycStats, kyb: kybStats });
  } catch (error) {
    console.error('Failed to fetch KYC/KYB stats:', error);
    res.status(500).json({ error: 'Failed to fetch verification stats' });
  }
});

// GET wallet statistics
router.get('/wallet-stats', async (req, res) => {
  try {
    const walletStats = await prisma.wallet.groupBy({
      by: ['walletType', 'blockchain'],
      _count: {
        walletType: true
      }
    });

    const activeWallets = await prisma.wallet.count({
      where: { isActive: true }
    });

    res.json({ 
      distribution: walletStats, 
      activeCount: activeWallets 
    });
  } catch (error) {
    console.error('Failed to fetch wallet stats:', error);
    res.status(500).json({ error: 'Failed to fetch wallet stats' });
  }
});

// GET DID statistics
router.get('/did-stats', async (req, res) => {
  try {
    const didStats = await prisma.dIDProfile.groupBy({
      by: ['didMethod'],
      _count: {
        didMethod: true
      }
    });

    const activeDIDs = await prisma.dIDProfile.count({
      where: { isActive: true }
    });

    res.json({ 
      distribution: didStats, 
      activeCount: activeDIDs 
    });
  } catch (error) {
    console.error('Failed to fetch DID stats:', error);
    res.status(500).json({ error: 'Failed to fetch DID stats' });
  }
});

// GET asset statistics
router.get('/asset-stats', async (req, res) => {
  try {
    const assetStats = await prisma.asset.groupBy({
      by: ['assetType', 'status'],
      _count: {
        assetType: true
      }
    });

    const totalAssets = await prisma.asset.count();
    const totalInvestments = await prisma.investment.count();

    res.json({ 
      distribution: assetStats, 
      totalAssets,
      totalInvestments
    });
  } catch (error) {
    console.error('Failed to fetch asset stats:', error);
    res.status(500).json({ error: 'Failed to fetch asset stats' });
  }
});

// PUT update user verification status
router.put('/verify-user/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { type, status, verifiedBy } = req.body; // type: 'kyc' or 'kyb'

    const updateData = {
      verificationStatus: status,
      verifiedAt: status === 'APPROVED' ? new Date() : null,
      verifiedBy: verifiedBy || req.user.email
    };

    if (type === 'kyc') {
      await prisma.kYCProfile.update({
        where: { userId: parseInt(id) },
        data: updateData
      });
    } else if (type === 'kyb') {
      await prisma.kYBProfile.update({
        where: { userId: parseInt(id) },
        data: updateData
      });
    }

    res.json({ message: 'Verification status updated successfully' });
  } catch (error) {
    console.error('Failed to update verification status:', error);
    res.status(500).json({ error: 'Failed to update verification status' });
  }
});

// GET system health metrics
router.get('/system-health', async (req, res) => {
  try {
    const totalUsers = await prisma.user.count();
    const activeUsers = await prisma.user.count({ where: { isActive: true } });
    const totalWallets = await prisma.wallet.count();
    const totalDIDs = await prisma.dIDProfile.count();
    const totalAssets = await prisma.asset.count();
    const totalInvestments = await prisma.investment.count();
    
    // Recent activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentUsers = await prisma.user.count({
      where: { createdAt: { gte: thirtyDaysAgo } }
    });

    res.json({
      totalUsers,
      activeUsers,
      totalWallets,
      totalDIDs,
      totalAssets,
      totalInvestments,
      recentUsers,
      systemUptime: '98.5%',
      lastUpdate: new Date()
    });
  } catch (error) {
    console.error('Failed to fetch system health:', error);
    res.status(500).json({ error: 'Failed to fetch system health' });
  }
});

module.exports = router; 