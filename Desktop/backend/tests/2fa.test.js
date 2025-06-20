const request = require('supertest');
const app = require('../index');
const { PrismaClient } = require('@prisma/client');
const TwoFactorService = require('../services/twoFactorService');
const speakeasy = require('speakeasy');

const prisma = new PrismaClient();
const twoFactorService = new TwoFactorService();

describe('2FA Integration Tests', () => {
    let testUser;
    let authToken;
    let twoFactorSecret;

    beforeAll(async() => {
        // Clean up any existing test data
        await prisma.user.deleteMany({
            where: { email: 'test2fa@example.com' }
        });

        // Create test user
        const response = await request(app)
            .post('/api/auth/register')
            .send({
                email: 'test2fa@example.com',
                password: 'TestPassword123!',
                firstName: 'Test',
                lastName: 'User',
                role: 'ADMIN'
            });

        testUser = response.body.user;
        authToken = response.body.token;
    });

    afterAll(async() => {
        // Clean up test data
        await prisma.user.deleteMany({
            where: { email: 'test2fa@example.com' }
        });
        await prisma.$disconnect();
    });

    describe('2FA Setup Flow', () => {
        test('should generate 2FA setup data', async() => {
            const response = await request(app)
                .post('/api/auth/2fa/setup')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('qrCodeDataURL');
            expect(response.body).toHaveProperty('manualEntryKey');
            expect(response.body).toHaveProperty('backupCodes');
            expect(response.body.backupCodes).toHaveLength(8);
            expect(response.body).toHaveProperty('instructions');
            expect(response.body.qrCodeDataURL).toMatch(/^data:image\/png;base64,/);
        });

        test('should not allow 2FA setup if already enabled', async() => {
            // First enable 2FA
            const setupResponse = await request(app)
                .post('/api/auth/2fa/setup')
                .set('Authorization', `Bearer ${authToken}`);

            const secret = setupResponse.body.manualEntryKey;
            const token = speakeasy.totp({
                secret: secret,
                encoding: 'base32'
            });

            await request(app)
                .post('/api/auth/2fa/verify-setup')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ token });

            // Try to setup again
            const response = await request(app)
                .post('/api/auth/2fa/setup')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(400);

            expect(response.body.error).toBe('2FA is already enabled');
        });
    });

    describe('2FA Verification', () => {
        beforeEach(async() => {
            // Reset user 2FA status
            await prisma.user.update({
                where: { id: testUser.id },
                data: {
                    twoFactorEnabled: false,
                    twoFactorSecret: null,
                    twoFactorBackupCodes: null,
                    twoFactorLastUsed: null
                }
            });
        });

        test('should verify valid TOTP token and enable 2FA', async() => {
            const setupResponse = await request(app)
                .post('/api/auth/2fa/setup')
                .set('Authorization', `Bearer ${authToken}`);

            const secret = setupResponse.body.manualEntryKey;
            twoFactorSecret = secret;

            const token = speakeasy.totp({
                secret: secret,
                encoding: 'base32'
            });

            const response = await request(app)
                .post('/api/auth/2fa/verify-setup')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ token })
                .expect(200);

            expect(response.body.message).toBe('2FA enabled successfully');
            expect(response.body.backupCodes).toHaveLength(8);

            // Verify database state
            const updatedUser = await prisma.user.findUnique({
                where: { id: testUser.id }
            });
            expect(updatedUser.twoFactorEnabled).toBe(true);
            expect(updatedUser.twoFactorSecret).toBeTruthy();
        });

        test('should reject invalid TOTP token', async() => {
            const setupResponse = await request(app)
                .post('/api/auth/2fa/setup')
                .set('Authorization', `Bearer ${authToken}`);

            const response = await request(app)
                .post('/api/auth/2fa/verify-setup')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ token: '000000' })
                .expect(400);

            expect(response.body.error).toContain('Invalid');
        });
    });

    describe('Enhanced Login with 2FA', () => {
        beforeEach(async() => {
            // Enable 2FA for user
            const setupResponse = await request(app)
                .post('/api/auth/2fa/setup')
                .set('Authorization', `Bearer ${authToken}`);

            const secret = setupResponse.body.manualEntryKey;
            twoFactorSecret = secret;

            const token = speakeasy.totp({
                secret: secret,
                encoding: 'base32'
            });

            await request(app)
                .post('/api/auth/2fa/verify-setup')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ token });
        });

        test('should require 2FA token for users with 2FA enabled', async() => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test2fa@example.com',
                    password: 'TestPassword123!'
                })
                .expect(202);

            expect(response.body.message).toBe('2FA_REQUIRED');
            expect(response.body.requires2FA).toBe(true);
        });

        test('should login successfully with valid 2FA token', async() => {
            const token = speakeasy.totp({
                secret: twoFactorSecret,
                encoding: 'base32'
            });

            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test2fa@example.com',
                    password: 'TestPassword123!',
                    twoFactorToken: token
                })
                .expect(200);

            expect(response.body.message).toBe('Login successful');
            expect(response.body.token).toBeTruthy();
            expect(response.body.user.twoFactorEnabled).toBe(true);
        });

        test('should login successfully with backup code', async() => {
            // Get backup codes
            const user = await prisma.user.findUnique({
                where: { id: testUser.id }
            });
            const backupCodes = JSON.parse(user.twoFactorBackupCodes);
            const backupCode = backupCodes[0];

            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test2fa@example.com',
                    password: 'TestPassword123!',
                    backupCode: backupCode
                })
                .expect(200);

            expect(response.body.message).toBe('Login successful');
            expect(response.body.token).toBeTruthy();

            // Verify backup code was consumed
            const updatedUser = await prisma.user.findUnique({
                where: { id: testUser.id }
            });
            const remainingCodes = JSON.parse(updatedUser.twoFactorBackupCodes);
            expect(remainingCodes).toHaveLength(7);
        });

        test('should reject invalid 2FA token', async() => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test2fa@example.com',
                    password: 'TestPassword123!',
                    twoFactorToken: '000000'
                })
                .expect(401);

            expect(response.body.error).toContain('Invalid');
        });
    });

    describe('2FA Status and Management', () => {
        beforeEach(async() => {
            // Enable 2FA
            const setupResponse = await request(app)
                .post('/api/auth/2fa/setup')
                .set('Authorization', `Bearer ${authToken}`);

            const secret = setupResponse.body.manualEntryKey;
            twoFactorSecret = secret;

            const token = speakeasy.totp({
                secret: secret,
                encoding: 'base32'
            });

            await request(app)
                .post('/api/auth/2fa/verify-setup')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ token });
        });

        test('should return 2FA status', async() => {
            const response = await request(app)
                .get('/api/auth/2fa/status')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.enabled).toBe(true);
            expect(response.body.backupCodesRemaining).toBe(8);
            expect(response.body.recommendEnable).toBe(false);
        });

        test('should regenerate backup codes with 2FA verification', async() => {
            const token = speakeasy.totp({
                secret: twoFactorSecret,
                encoding: 'base32'
            });

            const response = await request(app)
                .post('/api/auth/2fa/regenerate-backup-codes')
                .set('Authorization', `Bearer ${authToken}`)
                .set('X-2FA-Token', token)
                .expect(200);

            expect(response.body.message).toBe('Backup codes regenerated successfully');
            expect(response.body.backupCodes).toHaveLength(8);
        });

        test('should disable 2FA with verification', async() => {
            const token = speakeasy.totp({
                secret: twoFactorSecret,
                encoding: 'base32'
            });

            const response = await request(app)
                .post('/api/auth/2fa/disable')
                .set('Authorization', `Bearer ${authToken}`)
                .set('X-2FA-Token', token)
                .expect(200);

            expect(response.body.message).toBe('2FA disabled successfully');

            // Verify database state
            const updatedUser = await prisma.user.findUnique({
                where: { id: testUser.id }
            });
            expect(updatedUser.twoFactorEnabled).toBe(false);
        });
    });

    describe('Admin Routes Protection', () => {
        beforeEach(async() => {
            // Enable 2FA for admin user
            const setupResponse = await request(app)
                .post('/api/auth/2fa/setup')
                .set('Authorization', `Bearer ${authToken}`);

            const secret = setupResponse.body.manualEntryKey;
            twoFactorSecret = secret;

            const token = speakeasy.totp({
                secret: secret,
                encoding: 'base32'
            });

            await request(app)
                .post('/api/auth/2fa/verify-setup')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ token });
        });

        test('should require 2FA for sensitive admin operations', async() => {
            const response = await request(app)
                .get('/api/admin/users-full')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(403);

            expect(response.body.error).toBe('2FA_TOKEN_REQUIRED');
        });

        test('should allow access with valid 2FA token', async() => {
            const token = speakeasy.totp({
                secret: twoFactorSecret,
                encoding: 'base32'
            });

            const response = await request(app)
                .get('/api/admin/users-full')
                .set('Authorization', `Bearer ${authToken}`)
                .set('X-2FA-Token', token)
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);
        });
    });
});

describe('TwoFactorService Unit Tests', () => {
    describe('Secret Generation', () => {
        test('should generate valid secret and QR code', async() => {
            const result = await twoFactorService.generateSecret('test@example.com');

            expect(result).toHaveProperty('secret');
            expect(result).toHaveProperty('qrCodeDataURL');
            expect(result).toHaveProperty('backupCodes');
            expect(result).toHaveProperty('manualEntryKey');

            expect(result.secret).toMatch(/^[A-Z2-7]+$/); // Base32 format
            expect(result.backupCodes).toHaveLength(8);
            expect(result.qrCodeDataURL).toMatch(/^data:image\/png;base64,/);
        });
    });

    describe('Token Verification', () => {
        let secret;

        beforeEach(async() => {
            const result = await twoFactorService.generateSecret('test@example.com');
            secret = result.secret;
        });

        test('should verify valid TOTP token', () => {
            const token = speakeasy.totp({
                secret: secret,
                encoding: 'base32'
            });

            const result = twoFactorService.verifyToken(token, secret);
            expect(result.valid).toBe(true);
        });

        test('should reject invalid TOTP token', () => {
            const result = twoFactorService.verifyToken('000000', secret);
            expect(result.valid).toBe(false);
            expect(result.error).toContain('Invalid');
        });

        test('should prevent replay attacks', () => {
            const token = speakeasy.totp({
                secret: secret,
                encoding: 'base32'
            });

            // First verification should succeed
            const result1 = twoFactorService.verifyToken(token, secret);
            expect(result1.valid).toBe(true);

            // Simulate same token used within same time window
            const lastUsed = new Date();
            const result2 = twoFactorService.verifyToken(token, secret, lastUsed);
            expect(result2.valid).toBe(false);
            expect(result2.error).toContain('already used');
        });
    });

    describe('Backup Code Management', () => {
        test('should generate 8 unique backup codes', () => {
            const codes = twoFactorService.generateBackupCodes();

            expect(codes).toHaveLength(8);
            expect(new Set(codes).size).toBe(8); // All unique
            codes.forEach(code => {
                expect(code).toMatch(/^[A-F0-9]{8}$/); // 8 hex characters
            });
        });

        test('should verify valid backup code', () => {
            const codes = ['ABC12345', 'DEF67890', 'GHI11111'];
            const result = twoFactorService.verifyBackupCode('ABC12345', codes);

            expect(result.valid).toBe(true);
            expect(result.remainingCodes).toHaveLength(2);
            expect(result.remainingCodes).not.toContain('ABC12345');
        });

        test('should reject invalid backup code', () => {
            const codes = ['ABC12345', 'DEF67890'];
            const result = twoFactorService.verifyBackupCode('INVALID1', codes);

            expect(result.valid).toBe(false);
            expect(result.error).toContain('Invalid');
        });

        test('should warn when backup codes are low', () => {
            const codes = ['ABC12345', 'DEF67890']; // Only 2 codes
            const result = twoFactorService.verifyBackupCode('ABC12345', codes);

            expect(result.valid).toBe(true);
            expect(result.remainingCodes).toHaveLength(1);
            expect(result.warning).toContain('Running low');
        });
    });
});

describe('Security Middleware Tests', () => {
    const { require2FA, verifyBackupCode } = require('../middleware/auth');

    test('should require 2FA when user has it enabled', async() => {
        const req = {
            user: {
                id: 1,
                twoFactorEnabled: true,
                twoFactorSecret: 'TESTSECRET',
                twoFactorLastUsed: null
            },
            headers: {},
            body: {}
        };

        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        const next = jest.fn();

        await require2FA(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({
            error: '2FA_TOKEN_REQUIRED',
            message: 'Two-factor authentication token is required'
        });
        expect(next).not.toHaveBeenCalled();
    });
});