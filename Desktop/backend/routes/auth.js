const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, require2FA, verifyBackupCode } = require('../middleware/auth');
const { validateUserClassification } = require('../utils/clientsAndLeads');
const TwoFactorService = require('../services/twoFactorService');
const {
    enhancedLoginSecurity,
    enhanced2FASecurity,
    trackFailedAttempts,
    clearFailedAttempts,
    detectSuspiciousActivity
} = require('../middleware/authSecurity');

const router = express.Router();
const prisma = new PrismaClient();
const twoFactorService = new TwoFactorService();

// Register
router.post('/register', async(req, res) => {
    try {
        const { email, password, firstName, lastName, role, userType, clientType } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Set defaults based on user type
        let finalRole = role;
        let finalUserType = userType;
        let finalClientType = clientType;

        // If no role specified, this is a client registration
        if (!role) {
            finalRole = null;
            finalUserType = userType || 'INVESTOR';
            finalClientType = clientType || 'INDIVIDUAL';
        } else {
            // This is staff registration
            finalRole = role;
            finalUserType = null;
            finalClientType = null;
        }

        // Validate user classification
        try {
            validateUserClassification({
                role: finalRole,
                userType: finalUserType,
                clientType: finalClientType
            });
        } catch (validationError) {
            return res.status(400).json({ error: validationError.message });
        }

        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Hash password
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Create user
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                firstName,
                lastName,
                role: finalRole,
                userType: finalUserType,
                clientType: finalClientType
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                userType: true,
                clientType: true,
                createdAt: true
            }
        });

        // Activity Log
        await prisma.activityLog.create({
            data: {
                type: 'SIGNUP',
                description: `New user signup (${user.email})`,
                userId: user.id
            }
        });

        // Generate JWT token
        const token = jwt.sign({ userId: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET || 'default-secret-key', { expiresIn: '24h' }
        );

        res.status(201).json({
            message: 'User created successfully',
            user,
            token,
            recommendEnable2FA: ['SUPER_ADMIN', 'ADMIN', 'COMPLIANCE_OFFICER'].includes(user.role)
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Failed to create user' });
    }
});

// Login (Enhanced with 2FA support and advanced security)
router.post('/login', enhancedLoginSecurity, async(req, res) => {
    try {
        const { email, password, twoFactorToken, backupCode } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Find user
        const user = await prisma.user.findUnique({
            where: { email },
            select: {
                id: true,
                email: true,
                password: true,
                firstName: true,
                lastName: true,
                role: true,
                userType: true,
                clientType: true,
                isActive: true,
                twoFactorEnabled: true,
                twoFactorSecret: true,
                twoFactorBackupCodes: true,
                twoFactorLastUsed: true,
                createdAt: true,
                updatedAt: true
            }
        });

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        if (!user.isActive) {
            return res.status(401).json({ error: 'Account is deactivated' });
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        const ip = req.ip || req.connection.remoteAddress;
        const userAgent = req.get('User-Agent');

        if (!isPasswordValid) {
            // Track failed attempt and detect suspicious activity
            await trackFailedAttempts(email, ip, 'login');
            await detectSuspiciousActivity(email, ip, userAgent);
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Check if 2FA is enabled
        if (user.twoFactorEnabled) {
            // If 2FA is enabled, require either TOTP token or backup code
            if (!twoFactorToken && !backupCode) {
                return res.status(202).json({
                    message: '2FA_REQUIRED',
                    requires2FA: true,
                    userId: user.id // Frontend can use this for subsequent 2FA verification
                });
            }

            // Verify 2FA token or backup code
            let verification = { valid: false };
            let usedBackupCode = false;

            if (twoFactorToken) {
                verification = twoFactorService.verifyToken(
                    twoFactorToken,
                    user.twoFactorSecret,
                    user.twoFactorLastUsed
                );
            } else if (backupCode) {
                const backupCodes = JSON.parse(user.twoFactorBackupCodes || '[]');
                verification = twoFactorService.verifyBackupCode(backupCode, backupCodes);
                usedBackupCode = true;
            }

            if (!verification.valid) {
                // Track failed 2FA attempt
                await trackFailedAttempts(email, ip, '2fa');
                await detectSuspiciousActivity(email, ip, userAgent);
                return res.status(401).json({ error: verification.error });
            }

            // Update last used timestamp and backup codes if used
            const updateData = { twoFactorLastUsed: new Date() };
            if (usedBackupCode) {
                updateData.twoFactorBackupCodes = JSON.stringify(verification.remainingCodes);
            }

            await prisma.user.update({
                where: { id: user.id },
                data: updateData
            });

            // Log successful 2FA login
            await prisma.activityLog.create({
                data: {
                    type: usedBackupCode ? '2FA_LOGIN_BACKUP' : '2FA_LOGIN_SUCCESS',
                    description: usedBackupCode ?
                        `Login with backup code. ${verification.remainingCodes?.length || 0} codes remaining.` : 'Successful 2FA login',
                    userId: user.id
                }
            });
        }

        // Clear failed attempts on successful login
        clearFailedAttempts(email, ip);

        // Generate JWT token
        const token = jwt.sign({ userId: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET || 'default-secret-key', { expiresIn: '24h' }
        );

        // Log successful login
        await prisma.activityLog.create({
            data: {
                type: 'LOGIN_SUCCESS',
                description: `Successful login from IP ${ip}`,
                userId: user.id,
                metadata: JSON.stringify({ ip, userAgent, has2FA: user.twoFactorEnabled })
            }
        });

        // Return user info (without password and 2FA secrets)
        const { password: userPassword, twoFactorSecret: userTwoFactorSecret, twoFactorBackupCodes: userTwoFactorBackupCodes, ...userWithoutSecrets } = user;

        res.json({
            message: 'Login successful',
            user: userWithoutSecrets,
            token,
            backupCodeWarning: verification && verification.warning ? verification.warning : null
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Failed to login' });
    }
});

// ==================== 2FA ROUTES ====================

// Setup 2FA - Generate QR code and secret
router.post('/2fa/setup', authenticateToken, async(req, res) => {
    try {
        // Check if 2FA is already enabled
        if (req.user.twoFactorEnabled) {
            return res.status(400).json({ error: '2FA is already enabled' });
        }

        // Generate secret and QR code
        const setup = await twoFactorService.generateSecret(req.user.email);

        res.json({
            message: 'Scan the QR code with Google Authenticator',
            qrCodeDataURL: setup.qrCodeDataURL,
            manualEntryKey: setup.manualEntryKey,
            backupCodes: setup.backupCodes,
            instructions: [
                '1. Open Google Authenticator app',
                '2. Tap the + button',
                '3. Scan the QR code or enter the manual key',
                '4. Enter the 6-digit code from the app to verify'
            ]
        });

        // Store temporary secret (not activated until verified)
        req.session = req.session || {};
        req.session.tempTwoFactorSecret = setup.secret;
        req.session.tempBackupCodes = setup.backupCodes;

    } catch (error) {
        console.error('2FA setup error:', error);
        res.status(500).json({ error: 'Failed to setup 2FA' });
    }
});

// Verify and enable 2FA
router.post('/2fa/verify-setup', enhanced2FASecurity, authenticateToken, async(req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({ error: '2FA token is required' });
        }

        // Get temporary secret from session (in production, use Redis or similar)
        const tempSecret = req.session && req.session.tempTwoFactorSecret ? req.session.tempTwoFactorSecret : null;
        const tempBackupCodes = req.session && req.session.tempBackupCodes ? req.session.tempBackupCodes : null;

        if (!tempSecret) {
            return res.status(400).json({ error: 'No 2FA setup in progress. Please start setup again.' });
        }

        // Verify the token
        const verification = twoFactorService.verifyToken(token, tempSecret);

        if (!verification.valid) {
            return res.status(400).json({ error: verification.error });
        }

        // Enable 2FA for the user
        await twoFactorService.enable2FA(req.user.id, tempSecret, tempBackupCodes);

        // Clear session
        delete req.session.tempTwoFactorSecret;
        delete req.session.tempBackupCodes;

        res.json({
            message: '2FA enabled successfully',
            backupCodes: tempBackupCodes,
            warning: 'Save these backup codes in a secure location. You will not see them again.'
        });

    } catch (error) {
        console.error('2FA verification error:', error);
        res.status(500).json({ error: 'Failed to verify 2FA setup' });
    }
});

// Disable 2FA (requires current 2FA verification)
router.post('/2fa/disable', authenticateToken, require2FA, async(req, res) => {
    try {
        await twoFactorService.disable2FA(req.user.id);

        res.json({
            message: '2FA disabled successfully',
            warning: 'Your account is now less secure. Consider re-enabling 2FA.'
        });

    } catch (error) {
        console.error('2FA disable error:', error);
        res.status(500).json({ error: 'Failed to disable 2FA' });
    }
});

// Regenerate backup codes
router.post('/2fa/regenerate-backup-codes', authenticateToken, require2FA, async(req, res) => {
    try {
        const result = await twoFactorService.regenerateBackupCodes(req.user.id);

        res.json({
            message: 'Backup codes regenerated successfully',
            backupCodes: result.backupCodes,
            warning: 'Save these new backup codes. Old backup codes are no longer valid.'
        });

    } catch (error) {
        console.error('Backup code regeneration error:', error);
        res.status(500).json({ error: 'Failed to regenerate backup codes' });
    }
});

// Get 2FA status
router.get('/2fa/status', authenticateToken, async(req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: {
                twoFactorEnabled: true,
                twoFactorBackupCodes: true
            }
        });

        const backupCodes = user.twoFactorBackupCodes ? JSON.parse(user.twoFactorBackupCodes) : [];

        res.json({
            enabled: user.twoFactorEnabled,
            backupCodesRemaining: backupCodes.length,
            recommendEnable: !user.twoFactorEnabled && ['SUPER_ADMIN', 'ADMIN', 'COMPLIANCE_OFFICER'].includes(req.user.role)
        });

    } catch (error) {
        console.error('2FA status error:', error);
        res.status(500).json({ error: 'Failed to get 2FA status' });
    }
});

// ==================== EXISTING ROUTES ====================

// Get current user profile
router.get('/profile', authenticateToken, async(req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                userType: true,
                isActive: true,
                createdAt: true,
                updatedAt: true,
                twoFactorEnabled: true
            }
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        console.error('Profile fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});

// Update user profile
router.put('/profile', authenticateToken, async(req, res) => {
    try {
        const { firstName, lastName } = req.body;

        const updatedUser = await prisma.user.update({
            where: { id: req.user.id },
            data: {
                firstName,
                lastName
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                userType: true,
                updatedAt: true
            }
        });

        res.json({
            message: 'Profile updated successfully',
            user: updatedUser
        });
    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

// Change password
router.put('/change-password', authenticateToken, async(req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Current and new passwords are required' });
        }

        // Get current user with password
        const user = await prisma.user.findUnique({
            where: { id: req.user.id }
        });

        // Verify current password
        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);

        if (!isCurrentPasswordValid) {
            return res.status(400).json({ error: 'Current password is incorrect' });
        }

        // Hash new password
        const saltRounds = 12;
        const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

        // Update password
        await prisma.user.update({
            where: { id: req.user.id },
            data: { password: hashedNewPassword }
        });

        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        console.error('Password change error:', error);
        res.status(500).json({ error: 'Failed to change password' });
    }
});

// Refresh token
router.post('/refresh-token', authenticateToken, async(req, res) => {
    try {
        // Generate new token
        const token = jwt.sign({ userId: req.user.id, email: req.user.email, role: req.user.role },
            process.env.JWT_SECRET || 'default-secret-key', { expiresIn: '24h' }
        );

        res.json({ token });
    } catch (error) {
        console.error('Token refresh error:', error);
        res.status(500).json({ error: 'Failed to refresh token' });
    }
});

module.exports = router;