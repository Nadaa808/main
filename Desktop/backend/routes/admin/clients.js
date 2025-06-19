const express = require('express');
const { authenticateToken, authorizeRoles } = require('../../middleware/auth');
const { getClientsAndLeads, validateUserClassification } = require('../../utils/clientsAndLeads');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// Apply authentication and authorization to all routes
router.use(authenticateToken);
router.use(authorizeRoles(['ADMIN', 'SUPER_ADMIN', 'COMPLIANCE_OFFICER']));

/**
 * GET /api/admin/clients
 * Get all clients and leads with filtering
 */
router.get('/', async(req, res) => {
    try {
        const {
            status, // ALL, PENDING, KYC APPROVED, REJECTED, REGISTERED
            userType, // INVESTOR, ISSUER
            clientType, // INDIVIDUAL, COMMUNITY
            page = 1,
            limit = 20,
            search
        } = req.query;

        // Build filters
        const filters = {
            status,
            userType,
            clientType,
            page: parseInt(page),
            limit: parseInt(limit)
        };

        // Get clients and leads
        const result = await getClientsAndLeads(filters);

        // Apply search filter if provided
        if (search && result.data) {
            const searchLower = search.toLowerCase();
            result.data = result.data.filter(client =>
                client.email.toLowerCase().includes(searchLower) ||
                (client.firstName && client.firstName.toLowerCase().includes(searchLower)) ||
                (client.lastName && client.lastName.toLowerCase().includes(searchLower))
            );
        }

        // Calculate summary statistics
        const stats = {
            total: result.data.length,
            byStatus: {},
            byClientType: {},
            byEntityType: {}
        };

        result.data.forEach(client => {
            // Status stats
            stats.byStatus[client.status] = (stats.byStatus[client.status] || 0) + 1;

            // Client type stats (INVESTOR/ISSUER)
            stats.byClientType[client.clientType] = (stats.byClientType[client.clientType] || 0) + 1;

            // Entity type stats (INDIVIDUAL/COMMUNITY)
            stats.byEntityType[client.entityType] = (stats.byEntityType[client.entityType] || 0) + 1;
        });

        res.json({
            success: true,
            data: result.data,
            pagination: result.pagination,
            stats,
            filters: {
                statusOptions: ['ALL', 'PENDING', 'KYC APPROVED', 'REJECTED', 'REGISTERED'],
                clientTypeOptions: ['INVESTOR', 'ISSUER'],
                entityTypeOptions: ['INDIVIDUAL', 'COMMUNITY']
            }
        });

    } catch (error) {
        console.error('Get clients error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch clients and leads'
        });
    }
});

/**
 * GET /api/admin/clients/:clientId
 * Get detailed client information
 */
router.get('/:clientId', async(req, res) => {
    try {
        const { clientId } = req.params;

        const client = await prisma.user.findUnique({
            where: {
                id: parseInt(clientId),
                role: null // Ensure it's a client, not staff
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                countryOfResidency: true,
                userType: true,
                clientType: true,
                isActive: true,
                createdAt: true,
                updatedAt: true,
                walletAddress: true,
                kycSubmissions: {
                    orderBy: { createdAt: 'desc' },
                    select: {
                        id: true,
                        status: true,
                        submissionType: true,
                        createdAt: true,
                        verifiedAt: true,
                        rejectionReason: true
                    }
                },
                kycProfile: true,
                kybProfile: true,
                investments: {
                    select: {
                        id: true,
                        amount: true,
                        currency: true,
                        status: true,
                        investedAt: true,
                        asset: {
                            select: {
                                name: true,
                                symbol: true
                            }
                        }
                    }
                },
                issuedAssets: {
                    select: {
                        id: true,
                        name: true,
                        symbol: true,
                        status: true,
                        totalSupply: true
                    }
                }
            }
        });

        if (!client) {
            return res.status(404).json({
                success: false,
                error: 'Client not found'
            });
        }

        res.json({
            success: true,
            data: client
        });

    } catch (error) {
        console.error('Get client details error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch client details'
        });
    }
});

/**
 * PUT /api/admin/clients/:clientId
 * Update client information (admin only)
 */
router.put('/:clientId', async(req, res) => {
    try {
        const { clientId } = req.params;
        const {
            firstName,
            lastName,
            countryOfResidency,
            userType,
            clientType,
            isActive
        } = req.body;

        // Validate the classification
        if (userType || clientType) {
            validateUserClassification({
                role: null, // This is a client
                userType,
                clientType
            });
        }

        const updatedClient = await prisma.user.update({
            where: {
                id: parseInt(clientId),
                role: null // Ensure it's a client
            },
            data: {
                ...(firstName !== undefined && { firstName }),
                ...(lastName !== undefined && { lastName }),
                ...(countryOfResidency !== undefined && { countryOfResidency }),
                ...(userType !== undefined && { userType }),
                ...(clientType !== undefined && { clientType }),
                ...(isActive !== undefined && { isActive })
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                countryOfResidency: true,
                userType: true,
                clientType: true,
                isActive: true,
                updatedAt: true
            }
        });

        res.json({
            success: true,
            data: updatedClient,
            message: 'Client updated successfully'
        });

    } catch (error) {
        console.error('Update client error:', error);
        if (error.message.includes('classification')) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        } else {
            res.status(500).json({
                success: false,
                error: 'Failed to update client'
            });
        }
    }
});

module.exports = router;