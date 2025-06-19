const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Enhanced status mapping for multi-dimensional user classification
 */
function getClientStatus(user) {
    // Determine KYC requirement based on clientType
    const isKybRequired = user.clientType === 'COMMUNITY';
    const isKycRequired = user.clientType === 'INDIVIDUAL';

    // Get latest submission based on clientType - Compatible with all Node.js versions
    let relevantSubmission = null;
    if (user.kycSubmissions && Array.isArray(user.kycSubmissions)) {
        relevantSubmission = user.kycSubmissions.find(sub =>
            (isKybRequired && sub.submissionType === 'KYB') ||
            (isKycRequired && sub.submissionType === 'KYC')
        );
    }

    // Safe access to nested properties
    let kycStatus = null;
    if (relevantSubmission && relevantSubmission.status) {
        kycStatus = relevantSubmission.status;
    } else if (user.kycProfile && user.kycProfile.verificationStatus) {
        kycStatus = user.kycProfile.verificationStatus;
    } else if (user.kybProfile && user.kybProfile.verificationStatus) {
        kycStatus = user.kybProfile.verificationStatus;
    }

    if (!kycStatus) return 'REGISTERED';
    if (kycStatus === 'PENDING' || kycStatus === 'IN_REVIEW') return 'PENDING';
    if (kycStatus === 'APPROVED') return 'KYC APPROVED';
    if (kycStatus === 'REJECTED') return 'REJECTED';
    return 'REGISTERED';
}

/**
 * Get clients and leads with enhanced classification
 */
async function getClientsAndLeads(filters = {}) {
    try {
        const { status, userType, clientType, page = 1, limit = 20 } = filters;

        const where = {
            // Only clients (not staff)
            role: null,
            userType: { in: ['INVESTOR', 'ISSUER'] },
            isActive: true
        };

        // Add filters conditionally
        if (userType) {
            where.userType = userType;
        }
        if (clientType) {
            where.clientType = clientType;
        }

        const clients = await prisma.user.findMany({
            where,
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
                kycSubmissions: {
                    orderBy: { createdAt: 'desc' },
                    take: 2, // Get both KYC and KYB if available
                    select: { status: true, submissionType: true }
                },
                kycProfile: {
                    select: { verificationStatus: true }
                },
                kybProfile: {
                    select: { verificationStatus: true }
                }
            },
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { createdAt: 'desc' }
        });

        // Format response
        const formatted = clients.map(user => {
            const clientStatus = getClientStatus(user);

            return {
                clientId: String(user.id),
                email: user.email,
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                countryOfResidency: user.countryOfResidency || '',
                isVerified: clientStatus === 'KYC APPROVED',
                registeredDate: user.createdAt.toISOString(),
                status: clientStatus,
                clientType: user.userType, // INVESTOR or ISSUER
                entityType: user.clientType, // INDIVIDUAL or COMMUNITY
                kycRequired: user.clientType === 'INDIVIDUAL' ? 'KYC' : 'KYB'
            };
        });

        // Filter by status if requested
        const filteredResults = status && status !== 'ALL' ?
            formatted.filter(client => client.status === status) :
            formatted;

        // Get total count for pagination
        const totalCount = await prisma.user.count({ where });

        return {
            success: true,
            data: filteredResults,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: totalCount,
                totalPages: Math.ceil(totalCount / limit)
            }
        };
    } catch (error) {
        console.error('Error fetching clients and leads:', error);
        return {
            success: false,
            error: error.message || 'Failed to fetch clients and leads'
        };
    }
}

/**
 * Validation for user creation/update
 */
function validateUserClassification(userData) {
    const { role, userType, clientType } = userData;

    // Rule 1: Staff cannot have userType or clientType
    if (role && ['ADMIN', 'SUPER_ADMIN', 'COMPLIANCE_OFFICER'].includes(role)) {
        if (userType || clientType) {
            throw new Error('Staff users cannot have userType or clientType');
        }
    }

    // Rule 2: Clients must have both userType and clientType
    if (!role) {
        if (!userType || !['INVESTOR', 'ISSUER'].includes(userType)) {
            throw new Error('Clients must have a valid userType (INVESTOR or ISSUER)');
        }
        if (!clientType || !['INDIVIDUAL', 'COMMUNITY'].includes(clientType)) {
            throw new Error('Clients must have a valid clientType (INDIVIDUAL or COMMUNITY)');
        }
    }

    return true;
}

module.exports = {
    getClientsAndLeads,
    getClientStatus,
    validateUserClassification
};