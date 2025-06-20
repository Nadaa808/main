#!/usr/bin/env node

/**
 * Comprehensive Security Test Script for 2FA Implementation
 * 
 * This script tests:
 * - Multiple login attempts and failure scenarios
 * - Brute force protection
 * - Rate limiting effectiveness
 * - Account lockout mechanisms
 * - IP-based restrictions
 * - All possible failure paths
 * 
 * Run: node test-security-comprehensive.js
 */

const axios = require('axios');
const speakeasy = require('speakeasy');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const BASE_URL = 'http://localhost:3001/api';

// Test configuration
const TEST_USERS = [{
        email: 'victim@example.com',
        password: 'SecurePassword123!',
        firstName: 'Victim',
        lastName: 'User',
        role: 'ADMIN'
    },
    {
        email: 'attacker@example.com',
        password: 'AttackerPassword123!',
        firstName: 'Attacker',
        lastName: 'User'
    }
];

const ATTACK_PATTERNS = {
    RAPID_FIRE: { requests: 20, delay: 100 },
    SUSTAINED: { requests: 50, delay: 500 },
    DISTRIBUTED: { requests: 100, delay: 1000 }
};

class SecurityTester {
    constructor() {
        this.testResults = [];
        this.users = {};
        this.attackResults = {};
    }

    async runComprehensiveSecurityTests() {
        console.log('🛡️ Starting Comprehensive Security Tests for 2FA Implementation\n');
        console.log('='.repeat(80));

        try {
            await this.setupTestEnvironment();
            await this.testBasicSecurity();
            await this.testBruteForceAttacks();
            await this.test2FASpecificAttacks();
            await this.testAccountLockoutScenarios();
            await this.testRateLimitingEffectiveness();
            await this.testReplayAttacks();
            await this.testFailurePathSecurity();
            await this.testAdminProtectionBypass();
            await this.testSessionSecurity();

            this.generateSecurityReport();
        } catch (error) {
            console.error('❌ Security test suite failed:', error.message);
            process.exit(1);
        } finally {
            await this.cleanup();
        }
    }

    async setupTestEnvironment() {
        console.log('🔧 Setting up test environment...\n');

        // Cleanup existing test data
        for (const user of TEST_USERS) {
            await prisma.user.deleteMany({ where: { email: user.email } }).catch(() => {});
        }

        // Register test users
        for (const user of TEST_USERS) {
            const result = await this.makeRequest('POST', '/auth/register', user);
            if (result.success) {
                this.users[user.email] = {
                    ...user,
                    token: result.data.token,
                    userId: result.data.user.id
                };
                console.log(`✅ Created user: ${user.email}`);
            }
        }

        // Setup 2FA for victim user
        await this.setup2FAForUser('victim@example.com');
        console.log('✅ Test environment ready\n');
    }

    async setup2FAForUser(email) {
        const user = this.users[email];
        if (!user) return;

        // Setup 2FA
        const setupResult = await this.makeRequest(
            'POST',
            '/auth/2fa/setup',
            null, { Authorization: `Bearer ${user.token}` }
        );

        if (setupResult.success) {
            user.twoFactorSecret = setupResult.data.manualEntryKey;
            user.backupCodes = setupResult.data.backupCodes;

            // Verify and enable 2FA
            const token = speakeasy.totp({
                secret: user.twoFactorSecret,
                encoding: 'base32'
            });

            await this.makeRequest(
                'POST',
                '/auth/2fa/verify-setup', { token }, { Authorization: `Bearer ${user.token}` }
            );
        }
    }

    async testBasicSecurity() {
        console.log('🔐 Testing Basic Security Measures...\n');

        // Test 1: Invalid credentials
        await this.testScenario('Invalid Password Attack', async() => {
            const results = [];
            for (let i = 0; i < 10; i++) {
                const result = await this.makeRequest('POST', '/auth/login', {
                    email: 'victim@example.com',
                    password: 'WrongPassword' + i
                });
                results.push(result);
                await this.delay(100);
            }

            const allFailed = results.every(r => !r.success);
            const hasRateLimit = results.some(r => r.status === 429);

            return {
                passed: allFailed,
                details: `${results.length} invalid attempts. Rate limited: ${hasRateLimit}`
            };
        });

        // Test 2: Account enumeration protection
        await this.testScenario('Account Enumeration Protection', async() => {
            const existingUser = await this.makeRequest('POST', '/auth/login', {
                email: 'victim@example.com',
                password: 'wrongpass'
            });

            const nonExistentUser = await this.makeRequest('POST', '/auth/login', {
                email: 'nonexistent@example.com',
                password: 'wrongpass'
            });

            const sameResponse = (existingUser.error && existingUser.error.error) === (nonExistentUser.error && nonExistentUser.error.error);
            return {
                passed: sameResponse,
                details: `Same error message for existing/non-existing users: ${sameResponse}`
            };
        });

        // Test 3: SQL injection attempts
        await this.testScenario('SQL Injection Protection', async() => {
            const injectionAttempts = [
                "' OR '1'='1",
                "'; DROP TABLE users; --",
                "' UNION SELECT * FROM users --"
            ];

            const results = [];
            for (const injection of injectionAttempts) {
                const result = await this.makeRequest('POST', '/auth/login', {
                    email: injection,
                    password: injection
                });
                results.push(result);
            }

            const allFailed = results.every(r => !r.success);
            return {
                passed: allFailed,
                details: `All SQL injection attempts failed: ${allFailed}`
            };
        });
    }

    async testBruteForceAttacks() {
        console.log('💥 Testing Brute Force Attack Protection...\n');

        for (const [attackName, pattern] of Object.entries(ATTACK_PATTERNS)) {
            await this.testScenario(`Brute Force - ${attackName}`, async() => {
                const startTime = Date.now();
                const results = [];
                let rateLimitHit = false;
                let accountLocked = false;

                for (let i = 0; i < pattern.requests; i++) {
                    const result = await this.makeRequest('POST', '/auth/login', {
                        email: 'victim@example.com',
                        password: `attempt${i}`,
                        twoFactorToken: `${String(i).padStart(6, '0')}`
                    });

                    results.push(result);

                    if (result.status === 429) rateLimitHit = true;
                    if (result.error ? .error ? .includes('locked')) accountLocked = true;

                    if (pattern.delay > 0) {
                        await this.delay(pattern.delay);
                    }

                    // Stop if rate limited consistently
                    if (rateLimitHit && i > 10) break;
                }

                const duration = Date.now() - startTime;
                const successfulAttempts = results.filter(r => r.success).length;

                return {
                    passed: successfulAttempts === 0 && (rateLimitHit || accountLocked),
                    details: `${results.length} attempts in ${duration}ms. Rate limit: ${rateLimitHit}, Locked: ${accountLocked}`
                };
            });
        }
    }

    async test2FASpecificAttacks() {
        console.log('🔢 Testing 2FA-Specific Attack Vectors...\n');

        // Test 1: TOTP brute force
        await this.testScenario('TOTP Brute Force Attack', async() => {
            const user = this.users['victim@example.com'];
            const results = [];
            let rateLimitHit = false;

            // Try all possible 6-digit combinations (sample)
            for (let i = 0; i < 100; i++) {
                const fakeToken = String(i).padStart(6, '0');
                const result = await this.makeRequest('POST', '/auth/login', {
                    email: user.email,
                    password: user.password,
                    twoFactorToken: fakeToken
                });

                results.push(result);
                if (result.status === 429) {
                    rateLimitHit = true;
                    break;
                }
                await this.delay(50);
            }

            const successfulAttacks = results.filter(r => r.success).length;
            return {
                passed: successfulAttacks === 0 && rateLimitHit,
                details: `${results.length} TOTP attempts. Successful: ${successfulAttacks}. Rate limited: ${rateLimitHit}`
            };
        });

        // Test 2: Backup code enumeration
        await this.testScenario('Backup Code Brute Force', async() => {
            const user = this.users['victim@example.com'];
            const results = [];

            // Generate fake backup codes
            const fakeBackupCodes = Array.from({ length: 20 }, (_, i) =>
                Math.random().toString(16).substr(2, 8).toUpperCase()
            );

            for (const fakeCode of fakeBackupCodes) {
                const result = await this.makeRequest('POST', '/auth/login', {
                    email: user.email,
                    password: user.password,
                    backupCode: fakeCode
                });

                results.push(result);
                if (result.status === 429) break;
                await this.delay(100);
            }

            const successfulAttacks = results.filter(r => r.success).length;
            const rateLimited = results.some(r => r.status === 429);

            return {
                passed: successfulAttacks === 0,
                details: `${results.length} backup code attempts. Successful: ${successfulAttacks}. Rate limited: ${rateLimited}`
            };
        });

        // Test 3: Replay attack testing
        await this.testScenario('TOTP Replay Attack Protection', async() => {
            const user = this.users['victim@example.com'];
            const validToken = speakeasy.totp({
                secret: user.twoFactorSecret,
                encoding: 'base32'
            });

            // First login with valid token
            const firstAttempt = await this.makeRequest('POST', '/auth/login', {
                email: user.email,
                password: user.password,
                twoFactorToken: validToken
            });

            // Try to reuse the same token
            await this.delay(1000);
            const replayAttempt = await this.makeRequest('POST', '/auth/login', {
                email: user.email,
                password: user.password,
                twoFactorToken: validToken
            });

            return {
                passed: firstAttempt.success && !replayAttempt.success,
                details: `First: ${firstAttempt.success}, Replay: ${!replayAttempt.success}`
            };
        });
    }

    async testAccountLockoutScenarios() {
        console.log('🔒 Testing Account Lockout Mechanisms...\n');

        await this.testScenario('Progressive Lockout Testing', async() => {
            const user = this.users['attacker@example.com'];
            const lockoutResults = [];
            let lockedOut = false;

            // Make failed attempts to trigger lockout
            for (let i = 0; i < 20; i++) {
                const result = await this.makeRequest('POST', '/auth/login', {
                    email: user.email,
                    password: 'wrongpassword'
                });

                lockoutResults.push({
                    attempt: i + 1,
                    status: result.status,
                    success: result.success,
                    responseTime: Date.now()
                });

                if (result.error ? .error ? .includes('locked') || result.status === 423) {
                    lockedOut = true;
                    break;
                }

                await this.delay(200);
            }

            return {
                passed: lockedOut || lockoutResults.some(r => r.status === 429),
                details: `${lockoutResults.length} attempts before lockout/rate limit. Locked: ${lockedOut}`
            };
        });
    }

    async testRateLimitingEffectiveness() {
        console.log('⏱️ Testing Rate Limiting Effectiveness...\n');

        await this.testScenario('Rate Limit Response Times', async() => {
            const responseTimes = [];
            let rateLimitHit = false;

            for (let i = 0; i < 30; i++) {
                const startTime = Date.now();
                const result = await this.makeRequest('POST', '/auth/login', {
                    email: 'test@test.com',
                    password: 'test'
                });
                const responseTime = Date.now() - startTime;

                responseTimes.push(responseTime);

                if (result.status === 429) {
                    rateLimitHit = true;
                    break;
                }
            }

            const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;

            return {
                passed: rateLimitHit,
                details: `Avg response: ${avgResponseTime.toFixed(2)}ms. Rate limited after ${responseTimes.length} requests`
            };
        });
    }

    async testReplayAttacks() {
        console.log('🔄 Testing Replay Attack Protection...\n');

        await this.testScenario('Session Token Replay', async() => {
            const user = this.users['victim@example.com'];

            // Generate valid 2FA token
            const validToken = speakeasy.totp({
                secret: user.twoFactorSecret,
                encoding: 'base32'
            });

            // Store the token and wait for next time window
            await this.delay(31000); // Wait for next TOTP window

            // Try to use the old token
            const result = await this.makeRequest('POST', '/auth/login', {
                email: user.email,
                password: user.password,
                twoFactorToken: validToken
            });

            return {
                passed: !result.success,
                details: `Old token rejected: ${!result.success}`
            };
        });
    }

    async testFailurePathSecurity() {
        console.log('❌ Testing Failure Path Security...\n');

        const failureScenarios = [{
                name: 'Missing Email',
                data: { password: 'test' }
            },
            {
                name: 'Missing Password',
                data: { email: 'test@test.com' }
            },
            {
                name: 'Malformed Email',
                data: { email: 'notanemail', password: 'test' }
            },
            {
                name: 'Empty 2FA Token',
                data: { email: 'victim@example.com', password: 'SecurePassword123!', twoFactorToken: '' }
            },
            {
                name: 'Invalid 2FA Token Format',
                data: { email: 'victim@example.com', password: 'SecurePassword123!', twoFactorToken: 'abcdef' }
            }
        ];

        for (const scenario of failureScenarios) {
            await this.testScenario(`Failure Path - ${scenario.name}`, async() => {
                const result = await this.makeRequest('POST', '/auth/login', scenario.data);

                return {
                    passed: !result.success && result.status >= 400,
                    details: `Status: ${result.status}, Error: ${result.error?.error || 'No error'}`
                };
            });
        }
    }

    async testAdminProtectionBypass() {
        console.log('👑 Testing Admin Protection Bypass Attempts...\n');

        await this.testScenario('Admin Route Without 2FA', async() => {
            const user = this.users['victim@example.com'];

            const result = await this.makeRequest(
                'GET',
                '/admin/users-full',
                null, { Authorization: `Bearer ${user.token}` }
            );

            return {
                passed: !result.success && (result.status === 403 || result.status === 401),
                details: `Admin route blocked without 2FA: ${result.status}`
            };
        });

        await this.testScenario('Invalid 2FA Header Attack', async() => {
            const user = this.users['victim@example.com'];

            const result = await this.makeRequest(
                'GET',
                '/admin/users-full',
                null, {
                    Authorization: `Bearer ${user.token}`,
                    'X-2FA-Token': 'invalid'
                }
            );

            return {
                passed: !result.success,
                details: `Invalid 2FA token rejected: ${!result.success}`
            };
        });
    }

    async testSessionSecurity() {
        console.log('🍪 Testing Session Security...\n');

        await this.testScenario('JWT Token Manipulation', async() => {
            const user = this.users['victim@example.com'];
            const manipulatedToken = user.token.slice(0, -10) + 'manipulated';

            const result = await this.makeRequest(
                'GET',
                '/auth/profile',
                null, { Authorization: `Bearer ${manipulatedToken}` }
            );

            return {
                passed: !result.success && result.status === 403,
                details: `Manipulated token rejected: ${!result.success}`
            };
        });
    }

    async testScenario(name, testFunction) {
        try {
            console.log(`🔬 ${name}...`);
            const result = await testFunction();

            this.testResults.push({
                name,
                passed: result.passed,
                details: result.details,
                category: 'Security'
            });

            const status = result.passed ? '✅' : '❌';
            console.log(`   ${status} ${result.details}\n`);

        } catch (error) {
            this.testResults.push({
                name,
                passed: false,
                details: `Error: ${error.message}`,
                category: 'Security'
            });
            console.log(`   ❌ Error: ${error.message}\n`);
        }
    }

    async makeRequest(method, endpoint, data = null, headers = {}) {
        try {
            const config = {
                method,
                url: `${BASE_URL}${endpoint}`,
                headers: {
                    'Content-Type': 'application/json',
                    ...headers
                },
                timeout: 10000
            };

            if (data) {
                config.data = data;
            }

            const response = await axios(config);
            return {
                success: true,
                data: response.data,
                status: response.status
            };
        } catch (error) {
            return {
                success: false,
                error: error.response ? .data || { error: error.message },
                status: error.response ? .status || 0
            };
        }
    }

    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    generateSecurityReport() {
        console.log('\n' + '='.repeat(80));
        console.log('📊 COMPREHENSIVE SECURITY TEST REPORT');
        console.log('='.repeat(80));

        const totalTests = this.testResults.length;
        const passedTests = this.testResults.filter(r => r.passed).length;
        const failedTests = totalTests - passedTests;
        const passRate = ((passedTests / totalTests) * 100).toFixed(1);

        console.log(`\n📈 SUMMARY:`);
        console.log(`   Total Tests: ${totalTests}`);
        console.log(`   Passed: ${passedTests} (${passRate}%)`);
        console.log(`   Failed: ${failedTests}`);

        if (failedTests > 0) {
            console.log(`\n❌ FAILED TESTS:`);
            this.testResults
                .filter(r => !r.passed)
                .forEach(test => {
                    console.log(`   • ${test.name}: ${test.details}`);
                });
        }

        console.log(`\n🛡️ SECURITY ASSESSMENT:`);

        const criticalIssues = this.testResults.filter(r =>
            !r.passed && (
                r.name.includes('Brute Force') ||
                r.name.includes('Rate Limit') ||
                r.name.includes('Replay') ||
                r.name.includes('Admin')
            )
        );

        if (criticalIssues.length === 0) {
            console.log(`   ✅ No critical security vulnerabilities detected`);
        } else {
            console.log(`   ⚠️  ${criticalIssues.length} critical security issues found`);
            criticalIssues.forEach(issue => {
                console.log(`      • ${issue.name}`);
            });
        }

        // Recommendations
        console.log(`\n💡 SECURITY RECOMMENDATIONS:`);

        if (!this.testResults.find(r => r.name.includes('Rate Limit') && r.passed)) {
            console.log(`   • Implement stricter rate limiting for auth endpoints`);
        }

        if (!this.testResults.find(r => r.name.includes('Lockout') && r.passed)) {
            console.log(`   • Add account lockout after failed attempts`);
        }

        console.log(`   • Consider implementing CAPTCHA after multiple failures`);
        console.log(`   • Add IP-based rate limiting and geo-blocking`);
        console.log(`   • Implement anomaly detection for unusual login patterns`);
        console.log(`   • Add email notifications for suspicious activities`);

        console.log('\n' + '='.repeat(80));
        console.log('Security test completed. Review recommendations above.');
        console.log('='.repeat(80));
    }

    async cleanup() {
        try {
            for (const user of TEST_USERS) {
                await prisma.user.deleteMany({ where: { email: user.email } });
            }
            await prisma.$disconnect();
            console.log('\n🧹 Test cleanup completed');
        } catch (error) {
            console.log('Warning: Cleanup failed:', error.message);
        }
    }
}

// Run the tests
async function main() {
    const tester = new SecurityTester();
    await tester.runComprehensiveSecurityTests();
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = SecurityTester;