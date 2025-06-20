const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

class TwoFactorService {
    constructor() {
        this.issuer = process.env.APP_NAME || 'RWA Tokenization Platform';
        this.window = 2; // Allow 2 time steps before/after current time
    }

    /**
     * Generate a new TOTP secret for a user
     * @param {string} userEmail - User's email for QR code label
     * @returns {Object} - Contains secret, backup codes, and QR code data URL
     */
    async generateSecret(userEmail) {
        try {
            // Generate TOTP secret
            const secret = speakeasy.generateSecret({
                name: userEmail,
                issuer: this.issuer,
                length: 32
            });

            // Generate backup codes (8 codes, 8 characters each)
            const backupCodes = this.generateBackupCodes();

            // Generate QR code
            const qrCodeDataURL = await QRCode.toDataURL(secret.otpauth_url);

            return {
                secret: secret.base32,
                qrCodeDataURL,
                backupCodes,
                manualEntryKey: secret.base32
            };
        } catch (error) {
            throw new Error(`Failed to generate 2FA secret: ${error.message}`);
        }
    }

    /**
     * Generate backup codes for account recovery
     * @returns {Array} - Array of 8 backup codes
     */
    generateBackupCodes() {
        const codes = [];
        for (let i = 0; i < 8; i++) {
            codes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
        }
        return codes;
    }

    /**
     * Verify TOTP token
     * @param {string} token - 6-digit TOTP token
     * @param {string} secret - Base32 encoded secret
     * @param {Date} lastUsed - Last time a token was used (prevent replay)
     * @returns {Object} - Verification result
     */
    verifyToken(token, secret, lastUsed = null) {
        try {
            // Verify the token
            const verified = speakeasy.totp.verify({
                secret,
                encoding: 'base32',
                token,
                window: this.window
            });

            if (!verified) {
                return { valid: false, error: 'Invalid 2FA token' };
            }

            // Check for replay attacks (optional but recommended)
            const currentWindow = Math.floor(Date.now() / 30000);
            if (lastUsed) {
                const lastUsedWindow = Math.floor(new Date(lastUsed).getTime() / 30000);
                if (currentWindow <= lastUsedWindow) {
                    return { valid: false, error: 'Token already used. Please wait for next token.' };
                }
            }

            return { valid: true };
        } catch (error) {
            return { valid: false, error: `Token verification failed: ${error.message}` };
        }
    }

    /**
     * Verify backup code
     * @param {string} code - Backup code entered by user
     * @param {Array} backupCodes - Array of valid backup codes
     * @returns {Object} - Verification result with remaining codes
     */
    verifyBackupCode(code, backupCodes) {
        try {
            const codeIndex = backupCodes.indexOf(code.toUpperCase());

            if (codeIndex === -1) {
                return { valid: false, error: 'Invalid backup code' };
            }

            // Remove used backup code
            const remainingCodes = backupCodes.filter((_, index) => index !== codeIndex);

            return {
                valid: true,
                remainingCodes,
                warning: remainingCodes.length <= 2 ? 'Running low on backup codes. Consider regenerating.' : null
            };
        } catch (error) {
            return { valid: false, error: `Backup code verification failed: ${error.message}` };
        }
    }

    /**
     * Enable 2FA for a user
     * @param {number} userId - User ID
     * @param {string} secret - Base32 encoded secret
     * @param {Array} backupCodes - Backup codes array
     * @returns {Object} - Operation result
     */
    async enable2FA(userId, secret, backupCodes) {
        try {
            await prisma.user.update({
                where: { id: userId },
                data: {
                    twoFactorEnabled: true,
                    twoFactorSecret: secret,
                    twoFactorBackupCodes: JSON.stringify(backupCodes),
                    twoFactorLastUsed: null
                }
            });

            // Log activity
            await prisma.activityLog.create({
                data: {
                    type: '2FA_ENABLED',
                    description: '2FA enabled for user account',
                    userId
                }
            });

            return { success: true };
        } catch (error) {
            throw new Error(`Failed to enable 2FA: ${error.message}`);
        }
    }

    /**
     * Disable 2FA for a user
     * @param {number} userId - User ID
     * @returns {Object} - Operation result
     */
    async disable2FA(userId) {
        try {
            await prisma.user.update({
                where: { id: userId },
                data: {
                    twoFactorEnabled: false,
                    twoFactorSecret: null,
                    twoFactorBackupCodes: null,
                    twoFactorLastUsed: null
                }
            });

            // Log activity
            await prisma.activityLog.create({
                data: {
                    type: '2FA_DISABLED',
                    description: '2FA disabled for user account',
                    userId
                }
            });

            return { success: true };
        } catch (error) {
            throw new Error(`Failed to disable 2FA: ${error.message}`);
        }
    }

    /**
     * Update last used timestamp to prevent replay attacks
     * @param {number} userId - User ID
     * @returns {Object} - Operation result
     */
    async updateLastUsed(userId) {
        try {
            await prisma.user.update({
                where: { id: userId },
                data: {
                    twoFactorLastUsed: new Date()
                }
            });
            return { success: true };
        } catch (error) {
            throw new Error(`Failed to update 2FA last used: ${error.message}`);
        }
    }

    /**
     * Regenerate backup codes
     * @param {number} userId - User ID
     * @returns {Object} - New backup codes
     */
    async regenerateBackupCodes(userId) {
        try {
            const newBackupCodes = this.generateBackupCodes();

            await prisma.user.update({
                where: { id: userId },
                data: {
                    twoFactorBackupCodes: JSON.stringify(newBackupCodes)
                }
            });

            // Log activity
            await prisma.activityLog.create({
                data: {
                    type: '2FA_BACKUP_CODES_REGENERATED',
                    description: 'Backup codes regenerated',
                    userId
                }
            });

            return { success: true, backupCodes: newBackupCodes };
        } catch (error) {
            throw new Error(`Failed to regenerate backup codes: ${error.message}`);
        }
    }
}

module.exports = TwoFactorService;