const express = require('express');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, authorizeRoles, requireAdmin2FA } = require('../../middleware/auth');
const TwoFactorService = require('../../services/twoFactorService');

const router = express.Router();
const prisma = new PrismaClient();
const twoFactorService = new TwoFactorService();

// Apply authentication and admin authorization to all routes
router.use(authenticateToken);
router.use(authorizeRoles(['SUPER_ADMIN', 'ADMIN', 'COMPLIANCE_OFFICER']));

// ==================== ADMIN PROFILE MANAGEMENT ====================

/**
 * GET /api/admin/profile
 * Get comprehensive admin profile with settings and preferences
 */
router.get('/', async(req, res) => {
    try {
        const adminProfile = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                userType: true,
                countryOfResidency: true,
                isActive: true,
                twoFactorEnabled: true,
                createdAt: true,
                updatedAt: true,
                // Include admin-specific data
                walletAddress: true,
                didAddress: true
            }
        });

        if (!adminProfile) {
            return res.status(404).json({ error: 'Admin profile not found' });
        }

        // Get admin preferences (if exists)
        let adminPreferences = await prisma.adminPreferences.findUnique({
            where: { adminId: req.user.id }
        }).catch(() => null); // Table might not exist yet

        // Get admin activity stats
        const activityStats = await prisma.activityLog.groupBy({
            by: ['type'],
            where: { userId: req.user.id },
            _count: { type: true },
            orderBy: { _count: { type: 'desc' } },
            take: 10
        });

        // Get recent admin activities
        const recentActivities = await prisma.activityLog.findMany({
            where: { userId: req.user.id },
            orderBy: { createdAt: 'desc' },
            take: 20,
            select: {
                id: true,
                type: true,
                description: true,
                createdAt: true,
                metadata: true
            }
        });

        // Calculate admin metrics
        const adminMetrics = {
            totalActions: await prisma.activityLog.count({ where: { userId: req.user.id } }),
            actionsThisMonth: await prisma.activityLog.count({
                where: {
                    userId: req.user.id,
                    createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
                }
            }),
            lastLoginTime: (() => {
                const loginActivity = recentActivities.find(a => a.type === 'LOGIN_SUCCESS');
                return loginActivity ? loginActivity.createdAt : null;
            })(),
            criticalActionsCount: await prisma.activityLog.count({
                where: {
                    userId: req.user.id,
                    type: { in: ['ADMIN_USER_DISABLED', 'ADMIN_USER_ENABLED', 'ADMIN_VERIFICATION_UPDATE'] }
                }
            })
        };

        // Security status
        const securityStatus = {
            twoFactorEnabled: adminProfile.twoFactorEnabled,
            lastPasswordChange: adminProfile.updatedAt, // Approximate
            sessionCount: 1, // Current session
            hasWalletConnected: !!adminProfile.walletAddress,
            hasDIDConnected: !!adminProfile.didAddress
        };

        res.json({
            profile: adminProfile,
            preferences: adminPreferences || getDefaultAdminPreferences(),
            metrics: adminMetrics,
            security: securityStatus,
            activityStats,
            recentActivities
        });

    } catch (error) {
        console.error('Failed to fetch admin profile:', error);
        res.status(500).json({ error: 'Failed to fetch admin profile' });
    }
});

/**
 * PUT /api/admin/profile
 * Update admin profile information
 */
router.put('/', async(req, res) => {
    try {
        const {
            firstName,
            lastName,
            countryOfResidency,
            walletAddress,
            didAddress
        } = req.body;

        // Validate wallet address format if provided
        if (walletAddress && !isValidEthereumAddress(walletAddress)) {
            return res.status(400).json({ error: 'Invalid wallet address format' });
        }

        // Validate DID format if provided
        if (didAddress && !isValidDID(didAddress)) {
            return res.status(400).json({ error: 'Invalid DID format' });
        }

        const updatedProfile = await prisma.user.update({
            where: { id: req.user.id },
            data: {
                firstName,
                lastName,
                countryOfResidency,
                walletAddress,
                didAddress
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                countryOfResidency: true,
                walletAddress: true,
                didAddress: true,
                updatedAt: true
            }
        });

        // Log profile update
        await prisma.activityLog.create({
            data: {
                type: 'ADMIN_PROFILE_UPDATED',
                description: `Admin profile updated: ${Object.keys(req.body).join(', ')}`,
                userId: req.user.id,
                metadata: JSON.stringify({
                    updatedFields: Object.keys(req.body),
                    timestamp: new Date().toISOString()
                })
            }
        });

        res.json({
            message: 'Admin profile updated successfully',
            profile: updatedProfile
        });

    } catch (error) {
        console.error('Failed to update admin profile:', error);
        res.status(500).json({ error: 'Failed to update admin profile' });
    }
});

/**
 * PUT /api/admin/profile/password
 * Change admin password with enhanced security
 */
router.put('/password', requireAdmin2FA, async(req, res) => {
    try {
        const { currentPassword, newPassword, confirmPassword } = req.body;

        // Validation
        if (!currentPassword || !newPassword || !confirmPassword) {
            return res.status(400).json({
                error: 'Current password, new password, and confirmation are required'
            });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({ error: 'New passwords do not match' });
        }

        if (newPassword.length < 12) {
            return res.status(400).json({
                error: 'New password must be at least 12 characters long'
            });
        }

        // Validate password strength for admins
        if (!isStrongPassword(newPassword)) {
            return res.status(400).json({
                error: 'Password must contain uppercase, lowercase, numbers, and special characters'
            });
        }

        // Get current user with password
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: { password: true }
        });

        // Verify current password
        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isCurrentPasswordValid) {
            return res.status(400).json({ error: 'Current password is incorrect' });
        }

        // Check if new password is different from current
        const isSamePassword = await bcrypt.compare(newPassword, user.password);
        if (isSamePassword) {
            return res.status(400).json({ error: 'New password must be different from current password' });
        }

        // Hash new password with high salt rounds for admins
        const saltRounds = 14; // Higher security for admin accounts
        const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

        // Update password
        await prisma.user.update({
            where: { id: req.user.id },
            data: { password: hashedNewPassword }
        });

        // Log critical security action
        await prisma.activityLog.create({
            data: {
                type: 'ADMIN_PASSWORD_CHANGED',
                description: 'Admin password changed successfully with 2FA verification',
                userId: req.user.id,
                metadata: JSON.stringify({
                    timestamp: new Date().toISOString(),
                    ipAddress: req.ip || req.connection.remoteAddress,
                    userAgent: req.get('User-Agent')
                })
            }
        });

        res.json({
            message: 'Password changed successfully',
            securityNote: 'All existing sessions will remain active. Consider logging out and back in.'
        });

    } catch (error) {
        console.error('Admin password change error:', error);
        res.status(500).json({ error: 'Failed to change password' });
    }
});

/**
 * GET /api/admin/profile/preferences
 * Get admin dashboard preferences and settings
 */
router.get('/preferences', async(req, res) => {
    try {
        let preferences = await prisma.adminPreferences.findUnique({
            where: { adminId: req.user.id }
        }).catch(() => null);

        if (!preferences) {
            // Create default preferences
            preferences = await createDefaultAdminPreferences(req.user.id);
        }

        res.json(preferences);

    } catch (error) {
        console.error('Failed to fetch admin preferences:', error);
        res.status(500).json({ error: 'Failed to fetch preferences' });
    }
});

/**
 * PUT /api/admin/profile/preferences
 * Update admin dashboard preferences
 */
router.put('/preferences', async(req, res) => {
    try {
        const {
            dashboardTheme,
            language,
            timezone,
            notificationSettings,
            dashboardLayout,
            defaultFilters,
            autoRefreshInterval,
            securityAlerts,
            dataRetentionPreferences
        } = req.body;

        // Validate preferences
        const validatedPreferences = validateAdminPreferences({
            dashboardTheme,
            language,
            timezone,
            notificationSettings,
            dashboardLayout,
            defaultFilters,
            autoRefreshInterval,
            securityAlerts,
            dataRetentionPreferences
        });

        const updatedPreferences = await prisma.adminPreferences.upsert({
            where: { adminId: req.user.id },
            update: validatedPreferences,
            create: {
                adminId: req.user.id,
                ...validatedPreferences
            }
        });

        // Log preference update
        await prisma.activityLog.create({
            data: {
                type: 'ADMIN_PREFERENCES_UPDATED',
                description: 'Admin dashboard preferences updated',
                userId: req.user.id,
                metadata: JSON.stringify({
                    updatedFields: Object.keys(req.body),
                    timestamp: new Date().toISOString()
                })
            }
        });

        res.json({
            message: 'Preferences updated successfully',
            preferences: updatedPreferences
        });

    } catch (error) {
        console.error('Failed to update admin preferences:', error);
        res.status(500).json({ error: 'Failed to update preferences' });
    }
});

/**
 * GET /api/admin/profile/security
 * Get comprehensive security status and settings
 */
router.get('/security', async(req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: {
                twoFactorEnabled: true,
                twoFactorBackupCodes: true,
                twoFactorLastUsed: true,
                updatedAt: true
            }
        });

        // Get security-related activities
        const securityActivities = await prisma.activityLog.findMany({
            where: {
                userId: req.user.id,
                type: { in: [
                        'LOGIN_SUCCESS',
                        '2FA_ENABLED',
                        '2FA_DISABLED',
                        'ADMIN_PASSWORD_CHANGED',
                        'FAILED_LOGIN_ATTEMPT',
                        'SUSPICIOUS_ACTIVITY'
                    ]
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 10
        });

        // Calculate backup codes remaining
        let backupCodesRemaining = 0;
        if (user.twoFactorBackupCodes) {
            try {
                const codes = JSON.parse(user.twoFactorBackupCodes);
                backupCodesRemaining = codes.length;
            } catch (e) {
                backupCodesRemaining = 0;
            }
        }

        // Security score calculation
        const securityScore = calculateAdminSecurityScore({
            twoFactorEnabled: user.twoFactorEnabled,
            backupCodesRemaining,
            recentSecurityActivity: securityActivities,
            passwordLastChanged: user.updatedAt
        });

        res.json({
            twoFactorEnabled: user.twoFactorEnabled,
            twoFactorLastUsed: user.twoFactorLastUsed,
            backupCodesRemaining,
            securityScore,
            securityActivities,
            recommendations: getSecurityRecommendations(user, securityActivities)
        });

    } catch (error) {
        console.error('Failed to fetch security status:', error);
        res.status(500).json({ error: 'Failed to fetch security status' });
    }
});

/**
 * GET /api/admin/profile/activity
 * Get detailed admin activity analytics
 */
router.get('/activity', async(req, res) => {
    try {
        const { timeRange = '30d', activityType, page = 1, limit = 50 } = req.query;

        // Calculate date range
        const dateFilter = getDateRangeFilter(timeRange);

        // Build activity filter
        const activityFilter = {
            userId: req.user.id,
            ...(dateFilter && { createdAt: dateFilter }),
            ...(activityType && { type: activityType })
        };

        // Get paginated activities
        const activities = await prisma.activityLog.findMany({
            where: activityFilter,
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * limit,
            take: parseInt(limit)
        });

        // Get activity statistics
        const activityStats = await prisma.activityLog.groupBy({
            by: ['type'],
            where: activityFilter,
            _count: { type: true },
            orderBy: { _count: { type: 'desc' } }
        });

        // Get total count for pagination
        const totalCount = await prisma.activityLog.count({
            where: activityFilter
        });

        // Generate activity insights
        const insights = generateActivityInsights(activityStats, activities);

        res.json({
            activities,
            statistics: activityStats,
            insights,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                totalCount,
                totalPages: Math.ceil(totalCount / limit)
            }
        });

    } catch (error) {
        console.error('Failed to fetch admin activity:', error);
        res.status(500).json({ error: 'Failed to fetch activity data' });
    }
});

/**
 * POST /api/admin/profile/export
 * Export admin profile and activity data
 */
router.post('/export', requireAdmin2FA, async(req, res) => {
    try {
        const { exportType, dateRange, includeMetadata = false } = req.body;

        if (!['profile', 'activities', 'full'].includes(exportType)) {
            return res.status(400).json({ error: 'Invalid export type' });
        }

        const exportData = await generateAdminExport({
            adminId: req.user.id,
            exportType,
            dateRange,
            includeMetadata
        });

        // Log export action
        await prisma.activityLog.create({
            data: {
                type: 'ADMIN_DATA_EXPORTED',
                description: `Admin exported ${exportType} data`,
                userId: req.user.id,
                metadata: JSON.stringify({
                    exportType,
                    dateRange,
                    includeMetadata,
                    timestamp: new Date().toISOString()
                })
            }
        });

        res.json({
            message: 'Data exported successfully',
            exportData,
            generatedAt: new Date().toISOString()
        });

    } catch (error) {
        console.error('Failed to export admin data:', error);
        res.status(500).json({ error: 'Failed to export data' });
    }
});

// ==================== HELPER FUNCTIONS ====================

function getDefaultAdminPreferences() {
    return {
        dashboardTheme: 'dark',
        language: 'en',
        timezone: 'UTC',
        notificationSettings: {
            emailAlerts: true,
            securityAlerts: true,
            systemUpdates: true,
            weeklyReports: true
        },
        dashboardLayout: {
            compactMode: false,
            showAdvancedMetrics: true,
            defaultView: 'overview'
        },
        defaultFilters: {
            userStatus: 'all',
            verificationStatus: 'all',
            dateRange: '30d'
        },
        autoRefreshInterval: 300, // 5 minutes
        securityAlerts: {
            failedLogins: true,
            suspiciousActivity: true,
            newAdminActions: true
        },
        dataRetentionPreferences: {
            activityLogRetention: '1y',
            exportFrequency: 'monthly'
        }
    };
}

async function createDefaultAdminPreferences(adminId) {
    try {
        return await prisma.adminPreferences.create({
            data: {
                adminId,
                ...getDefaultAdminPreferences()
            }
        });
    } catch (error) {
        console.error('Failed to create default preferences:', error);
        return getDefaultAdminPreferences();
    }
}

function validateAdminPreferences(preferences) {
    const validThemes = ['light', 'dark', 'auto'];
    const validLanguages = ['en', 'es', 'fr', 'de', 'zh', 'ja'];

    return {
        dashboardTheme: validThemes.includes(preferences.dashboardTheme) ?
            preferences.dashboardTheme : 'dark',
        language: validLanguages.includes(preferences.language) ?
            preferences.language : 'en',
        timezone: preferences.timezone || 'UTC',
        notificationSettings: preferences.notificationSettings || {},
        dashboardLayout: preferences.dashboardLayout || {},
        defaultFilters: preferences.defaultFilters || {},
        autoRefreshInterval: Math.max(60, Math.min(3600, preferences.autoRefreshInterval || 300)),
        securityAlerts: preferences.securityAlerts || {},
        dataRetentionPreferences: preferences.dataRetentionPreferences || {}
    };
}

function isValidEthereumAddress(address) {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
}

function isValidDID(did) {
    return /^did:[a-z0-9]+:[a-zA-Z0-9.-_]+$/.test(did);
}

function isStrongPassword(password) {
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return hasUppercase && hasLowercase && hasNumbers && hasSpecialChar;
}

function calculateAdminSecurityScore({ twoFactorEnabled, backupCodesRemaining, recentSecurityActivity, passwordLastChanged }) {
    let score = 0;

    // 2FA enabled (40 points)
    if (twoFactorEnabled) score += 40;

    // Backup codes available (20 points)
    if (backupCodesRemaining > 0) score += 20;

    // Recent password change (20 points)
    const daysSincePasswordChange = (Date.now() - new Date(passwordLastChanged)) / (1000 * 60 * 60 * 24);
    if (daysSincePasswordChange < 90) score += 20;

    // No recent security incidents (20 points)
    const hasRecentIncidents = recentSecurityActivity.some(activity => ['FAILED_LOGIN_ATTEMPT', 'SUSPICIOUS_ACTIVITY'].includes(activity.type));
    if (!hasRecentIncidents) score += 20;

    return Math.min(100, score);
}

function getSecurityRecommendations(user, securityActivities) {
    const recommendations = [];

    if (!user.twoFactorEnabled) {
        recommendations.push({
            type: 'critical',
            title: 'Enable Two-Factor Authentication',
            description: 'Secure your admin account with 2FA',
            action: 'enable_2fa'
        });
    }

    const daysSincePasswordChange = (Date.now() - new Date(user.updatedAt)) / (1000 * 60 * 60 * 24);
    if (daysSincePasswordChange > 90) {
        recommendations.push({
            type: 'warning',
            title: 'Update Password',
            description: 'Consider changing your password regularly',
            action: 'change_password'
        });
    }

    if (user.twoFactorBackupCodes) {
        const codes = JSON.parse(user.twoFactorBackupCodes);
        if (codes.length < 3) {
            recommendations.push({
                type: 'info',
                title: 'Regenerate Backup Codes',
                description: 'You have few backup codes remaining',
                action: 'regenerate_backup_codes'
            });
        }
    }

    return recommendations;
}

function getDateRangeFilter(timeRange) {
    const now = new Date();
    const ranges = {
        '7d': new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        '30d': new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        '90d': new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
        '1y': new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
    };

    return ranges[timeRange] ? { gte: ranges[timeRange] } : null;
}

function generateActivityInsights(activityStats, activities) {
    const totalActivities = activityStats.reduce((sum, stat) => sum + stat._count.type, 0);
    const mostCommonActivity = activityStats[0];

    return {
        totalActivities,
        mostCommonActivity: mostCommonActivity ? {
            type: mostCommonActivity.type,
            count: mostCommonActivity._count.type,
            percentage: ((mostCommonActivity._count.type / totalActivities) * 100).toFixed(1)
        } : null,
        activityTrend: calculateActivityTrend(activities),
        securityEvents: activityStats.filter(stat => ['FAILED_LOGIN_ATTEMPT', 'SUSPICIOUS_ACTIVITY', '2FA_ENABLED'].includes(stat.type)).length
    };
}

function calculateActivityTrend(activities) {
    if (activities.length < 2) return 'stable';

    const recentActivities = activities.slice(0, Math.floor(activities.length / 2));
    const olderActivities = activities.slice(Math.floor(activities.length / 2));

    const recentCount = recentActivities.length;
    const olderCount = olderActivities.length;

    if (recentCount > olderCount * 1.2) return 'increasing';
    if (recentCount < olderCount * 0.8) return 'decreasing';
    return 'stable';
}

async function generateAdminExport({ adminId, exportType, dateRange, includeMetadata }) {
    const dateFilter = getDateRangeFilter(dateRange);

    const exportData = {
        exportInfo: {
            adminId,
            exportType,
            generatedAt: new Date().toISOString(),
            dateRange
        }
    };

    if (['profile', 'full'].includes(exportType)) {
        exportData.profile = await prisma.user.findUnique({
            where: { id: adminId },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                createdAt: true,
                updatedAt: true,
                twoFactorEnabled: true
            }
        });
    }

    if (['activities', 'full'].includes(exportType)) {
        exportData.activities = await prisma.activityLog.findMany({
            where: {
                userId: adminId,
                ...(dateFilter && { createdAt: dateFilter })
            },
            orderBy: { createdAt: 'desc' },
            ...(includeMetadata ? {} : { select: { id: true, type: true, description: true, createdAt: true } })
        });
    }

    return exportData;
}

module.exports = router;