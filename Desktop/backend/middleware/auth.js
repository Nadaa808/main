const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const TwoFactorService = require('../services/twoFactorService');

const prisma = new PrismaClient();
const twoFactorService = new TwoFactorService();

const authenticateToken = async(req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Get user from database to ensure they still exist and are active
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                isActive: true,
                twoFactorEnabled: true,
                twoFactorSecret: true,
                twoFactorBackupCodes: true,
                twoFactorLastUsed: true
            }
        });

        if (!user || !user.isActive) {
            return res.status(401).json({ error: 'Invalid or inactive user' });
        }

        req.user = user;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expired' });
        }
        return res.status(403).json({ error: 'Invalid token' });
    }
};

const authorizeRoles = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }

        next();
    };
};

/**
 * Middleware to enforce 2FA for sensitive operations
 * Checks if user has 2FA enabled and validates the 2FA token
 */
const require2FA = async(req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        // If user doesn't have 2FA enabled, require them to enable it for sensitive operations
        if (!req.user.twoFactorEnabled) {
            return res.status(403).json({
                error: '2FA_REQUIRED',
                message: 'Two-factor authentication is required for this operation',
                action: 'enable_2fa'
            });
        }

        // Check for 2FA token in headers or body
        const twoFactorToken = req.headers['x-2fa-token'] || req.body.twoFactorToken;

        if (!twoFactorToken) {
            return res.status(403).json({
                error: '2FA_TOKEN_REQUIRED',
                message: 'Two-factor authentication token is required'
            });
        }

        // Verify the 2FA token
        const verification = twoFactorService.verifyToken(
            twoFactorToken,
            req.user.twoFactorSecret,
            req.user.twoFactorLastUsed
        );

        if (!verification.valid) {
            return res.status(403).json({
                error: '2FA_INVALID',
                message: verification.error
            });
        }

        // Update last used timestamp
        await twoFactorService.updateLastUsed(req.user.id);

        next();
    } catch (error) {
        console.error('2FA middleware error:', error);
        return res.status(500).json({ error: 'Failed to verify 2FA' });
    }
};

/**
 * Middleware to enforce 2FA for admin operations
 * More strict - requires 2FA to be enabled and verified
 */
const requireAdmin2FA = (req, res, next) => {
    // Check if user has admin role
    if (!req.user.role || !['SUPER_ADMIN', 'ADMIN', 'COMPLIANCE_OFFICER'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Administrative privileges required' });
    }

    // Apply 2FA requirement
    return require2FA(req, res, next);
};

/**
 * Middleware for backup code verification (alternative to TOTP)
 */
const verifyBackupCode = async(req, res, next) => {
    try {
        if (!req.user || !req.user.twoFactorEnabled) {
            return res.status(403).json({ error: '2FA not enabled' });
        }

        const backupCode = req.body.backupCode;
        if (!backupCode) {
            return res.status(400).json({ error: 'Backup code required' });
        }

        const backupCodes = JSON.parse(req.user.twoFactorBackupCodes || '[]');
        const verification = twoFactorService.verifyBackupCode(backupCode, backupCodes);

        if (!verification.valid) {
            return res.status(403).json({ error: verification.error });
        }

        // Update backup codes (remove used code)
        await prisma.user.update({
            where: { id: req.user.id },
            data: {
                twoFactorBackupCodes: JSON.stringify(verification.remainingCodes),
                twoFactorLastUsed: new Date()
            }
        });

        // Log backup code usage
        await prisma.activityLog.create({
            data: {
                type: '2FA_BACKUP_CODE_USED',
                description: `Backup code used. ${verification.remainingCodes.length} codes remaining.`,
                userId: req.user.id
            }
        });

        req.backupCodeWarning = verification.warning;
        next();
    } catch (error) {
        console.error('Backup code verification error:', error);
        return res.status(500).json({ error: 'Failed to verify backup code' });
    }
};

module.exports = {
    authenticateToken,
    authorizeRoles,
    require2FA,
    requireAdmin2FA,
    verifyBackupCode
};