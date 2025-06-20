#!/usr/bin/env node

/**
 * 2FA Implementation Test Script
 * 
 * This script performs comprehensive testing of the 2FA implementation
 * to ensure all features work correctly in a production environment.
 */

const axios = require('axios');
const speakeasy = require('speakeasy');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const BASE_URL = 'http://localhost:3001/api';

// Test configuration
const TEST_USER = {
    email: 'test2fa@example.com',
    password: 'SecurePassword123!',
    firstName: 'Test',
    lastName: 'User',
    role: 'ADMIN'
};

class TwoFactorTester {
    constructor() {
        this.authToken = null;
        this.userId = null;
        this.twoFactorSecret = null;
        this.backupCodes = [];
        this.testResults = [];
    }

    async runAllTests() {
        console.log('🔐 Starting 2FA Implementation Tests...\n');

        try {
            await this.cleanup();
            await this.testUserRegistration();
            await this.test2FASetup();
            await this.test2FAVerification();
            await this.testEnhancedLogin();
            await this.testBackupCodeLogin();
            await this.test2FAStatus();
            await this.testAdminProtection();
            await this.test2FADisable();
            await this.testBackupCodeRegeneration();

            this.printResults();
        } catch (error) {
            console.error('❌ Test suite failed:', error.message);
            process.exit(1);
        } finally {
            await this.cleanup();
            await prisma.$disconnect();
        }
    }

    async cleanup() {
        try {
            await prisma.user.deleteMany({
                where: { email: TEST_USER.email }
            });
            console.log('🧹 Cleaned up test data');
        } catch (error) {
            // Ignore cleanup errors
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
                }
            };

            if (data) {
                config.data = data;
            }

            const response = await axios(config);
            return { success: true, data: response.data, status: response.status };
        } catch (error) {
            return {
                success: false,
                error: error.response ? .data || error.message,
                status: error.response ? .status
            };
        }
    }

    addTestResult(testName, passed, details = '') {
            this.testResults.push({ testName, passed, details });
            const status = passed ? '✅' : '❌';
            console.log(`${status} ${testName}${details ? `: ${details}` : ''}`);
    }

    async testUserRegistration() {
        console.log('\n📝 Testing User Registration...');
        
        const result = await this.makeRequest('POST', '/auth/register', TEST_USER);
        
        if (result.success) {
            this.authToken = result.data.token;
            this.userId = result.data.user.id;
            this.addTestResult('User Registration', true, 'Admin user created successfully');
            this.addTestResult('2FA Recommendation', 
                result.data.recommendEnable2FA === true, 
                'Admin users should be recommended to enable 2FA'
            );
        } else {
            this.addTestResult('User Registration', false, result.error.error || 'Failed');
            throw new Error('User registration failed');
        }
    }

    async test2FASetup() {
        console.log('\n🔧 Testing 2FA Setup...');
        
        const result = await this.makeRequest(
            'POST', 
            '/auth/2fa/setup', 
            null, 
            { Authorization: `Bearer ${this.authToken}` }
        );
        
        if (result.success) {
            this.twoFactorSecret = result.data.manualEntryKey;
            this.backupCodes = result.data.backupCodes;
            
            this.addTestResult('2FA Setup - QR Code', 
                result.data.qrCodeDataURL && result.data.qrCodeDataURL.startsWith('data:image/png;base64,'),
                'QR code generated successfully'
            );
            
            this.addTestResult('2FA Setup - Manual Key', 
                this.twoFactorSecret && this.twoFactorSecret.length > 0,
                `Secret: ${this.twoFactorSecret.substring(0, 8)}...`
            );
            
            this.addTestResult('2FA Setup - Backup Codes', 
                this.backupCodes && this.backupCodes.length === 8,
                `Generated ${this.backupCodes.length} backup codes`
            );
            
            this.addTestResult('2FA Setup - Instructions', 
                result.data.instructions && Array.isArray(result.data.instructions),
                'Setup instructions provided'
            );
        } else {
            this.addTestResult('2FA Setup', false, result.error.error || 'Failed');
            throw new Error('2FA setup failed');
        }
    }

    async test2FAVerification() {
        console.log('\n✔️ Testing 2FA Verification...');
        
        // Generate TOTP token
        const token = speakeasy.totp({
            secret: this.twoFactorSecret,
            encoding: 'base32'
        });
        
        const result = await this.makeRequest(
            'POST', 
            '/auth/2fa/verify-setup', 
            { token }, 
            { Authorization: `Bearer ${this.authToken}` }
        );
        
        if (result.success) {
            this.addTestResult('2FA Verification', true, 'TOTP token verified and 2FA enabled');
            this.addTestResult('2FA Enable Confirmation', 
                result.data.message === '2FA enabled successfully',
                'Proper success message'
            );
        } else {
            this.addTestResult('2FA Verification', false, result.error.error || 'Failed');
            throw new Error('2FA verification failed');
        }
        
        // Test invalid token
        const invalidResult = await this.makeRequest(
            'POST', 
            '/auth/2fa/verify-setup', 
            { token: '000000' }, 
            { Authorization: `Bearer ${this.authToken}` }
        );
        
        this.addTestResult('2FA Invalid Token Rejection', 
            !invalidResult.success && invalidResult.status === 400,
            'Invalid tokens properly rejected'
        );
    }

    async testEnhancedLogin() {
        console.log('\n🔑 Testing Enhanced Login with 2FA...');
        
        // Test login without 2FA token (should require 2FA)
        const loginWithoutToken = await this.makeRequest('POST', '/auth/login', {
            email: TEST_USER.email,
            password: TEST_USER.password
        });
        
        this.addTestResult('Login 2FA Requirement', 
            !loginWithoutToken.success || loginWithoutToken.data.requires2FA === true,
            'Login properly requires 2FA when enabled'
        );
        
        // Test login with valid 2FA token
        const token = speakeasy.totp({
            secret: this.twoFactorSecret,
            encoding: 'base32'
        });
        
        const loginWithToken = await this.makeRequest('POST', '/auth/login', {
            email: TEST_USER.email,
            password: TEST_USER.password,
            twoFactorToken: token
        });
        
        if (loginWithToken.success) {
            this.addTestResult('Login with 2FA Token', true, 'Successfully logged in with TOTP');
            this.addTestResult('Login Response Structure', 
                loginWithToken.data.token && loginWithToken.data.user,
                'Proper response structure'
            );
        } else {
            this.addTestResult('Login with 2FA Token', false, loginWithToken.error.error || 'Failed');
        }
        
        // Test login with invalid 2FA token
        const loginInvalidToken = await this.makeRequest('POST', '/auth/login', {
            email: TEST_USER.email,
            password: TEST_USER.password,
            twoFactorToken: '000000'
        });
        
        this.addTestResult('Login Invalid Token Rejection', 
            !loginInvalidToken.success,
            'Invalid 2FA tokens properly rejected'
        );
    }

    async testBackupCodeLogin() {
        console.log('\n🔐 Testing Backup Code Login...');
        
        const backupCode = this.backupCodes[0];
        
        const result = await this.makeRequest('POST', '/auth/login', {
            email: TEST_USER.email,
            password: TEST_USER.password,
            backupCode: backupCode
        });
        
        if (result.success) {
            this.addTestResult('Backup Code Login', true, 'Successfully logged in with backup code');
            this.addTestResult('Backup Code Consumption', 
                result.data.user && !result.data.backupCodeWarning,
                'Backup code properly consumed'
            );
        } else {
            this.addTestResult('Backup Code Login', false, result.error.error || 'Failed');
        }
        
        // Try to use the same backup code again (should fail)
        const reusedResult = await this.makeRequest('POST', '/auth/login', {
            email: TEST_USER.email,
            password: TEST_USER.password,
            backupCode: backupCode
        });
        
        this.addTestResult('Backup Code Reuse Prevention', 
            !reusedResult.success,
            'Used backup codes cannot be reused'
        );
    }

    async test2FAStatus() {
        console.log('\n📊 Testing 2FA Status...');
        
        const result = await this.makeRequest(
            'GET', 
            '/auth/2fa/status', 
            null, 
            { Authorization: `Bearer ${this.authToken}` }
        );
        
        if (result.success) {
            this.addTestResult('2FA Status Enabled', 
                result.data.enabled === true,
                '2FA status correctly shows enabled'
            );
            
            this.addTestResult('2FA Backup Codes Count', 
                result.data.backupCodesRemaining === 7, // One used in previous test
                `${result.data.backupCodesRemaining} backup codes remaining`
            );
            
            this.addTestResult('2FA Admin Recommendation', 
                result.data.recommendEnable === false, // Already enabled
                'Recommendation logic working'
            );
        } else {
            this.addTestResult('2FA Status', false, result.error.error || 'Failed');
        }
    }

    async testAdminProtection() {
        console.log('\n🛡️ Testing Admin Route Protection...');
        
        // Test admin route without 2FA token
        const withoutToken = await this.makeRequest(
            'GET', 
            '/admin/users-full', 
            null, 
            { Authorization: `Bearer ${this.authToken}` }
        );
        
        this.addTestResult('Admin Route 2FA Requirement', 
            !withoutToken.success && withoutToken.error.error === '2FA_TOKEN_REQUIRED',
            'Admin routes properly require 2FA'
        );
        
        // Test admin route with valid 2FA token
        const token = speakeasy.totp({
            secret: this.twoFactorSecret,
            encoding: 'base32'
        });
        
        const withToken = await this.makeRequest(
            'GET', 
            '/admin/users-full', 
            null, 
            { 
                Authorization: `Bearer ${this.authToken}`,
                'X-2FA-Token': token
            }
        );
        
        this.addTestResult('Admin Route Access with 2FA', 
            withToken.success,
            'Admin routes accessible with valid 2FA'
        );
    }

    async test2FADisable() {
        console.log('\n🔓 Testing 2FA Disable...');
        
        const token = speakeasy.totp({
            secret: this.twoFactorSecret,
            encoding: 'base32'
        });
        
        const result = await this.makeRequest(
            'POST', 
            '/auth/2fa/disable', 
            null, 
            { 
                Authorization: `Bearer ${this.authToken}`,
                'X-2FA-Token': token
            }
        );
        
        if (result.success) {
            this.addTestResult('2FA Disable', true, '2FA successfully disabled');
            this.addTestResult('2FA Disable Warning', 
                result.data.warning && result.data.warning.includes('less secure'),
                'Security warning provided'
            );
        } else {
            this.addTestResult('2FA Disable', false, result.error.error || 'Failed');
        }
        
        // Verify 2FA is actually disabled
        const statusCheck = await this.makeRequest(
            'GET', 
            '/auth/2fa/status', 
            null, 
            { Authorization: `Bearer ${this.authToken}` }
        );
        
        this.addTestResult('2FA Disable Verification', 
            statusCheck.success && statusCheck.data.enabled === false,
            '2FA status correctly shows disabled'
        );
    }

    async testBackupCodeRegeneration() {
        console.log('\n🔄 Testing Backup Code Regeneration...');
        
        // Re-enable 2FA first
        await this.test2FASetup();
        
        const token = speakeasy.totp({
            secret: this.twoFactorSecret,
            encoding: 'base32'
        });
        
        await this.makeRequest(
            'POST', 
            '/auth/2fa/verify-setup', 
            { token }, 
            { Authorization: `Bearer ${this.authToken}` }
        );
        
        // Now test backup code regeneration
        const newToken = speakeasy.totp({
            secret: this.twoFactorSecret,
            encoding: 'base32'
        });
        
        const result = await this.makeRequest(
            'POST', 
            '/auth/2fa/regenerate-backup-codes', 
            null, 
            { 
                Authorization: `Bearer ${this.authToken}`,
                'X-2FA-Token': newToken
            }
        );
        
        if (result.success) {
            this.addTestResult('Backup Code Regeneration', true, 'New backup codes generated');
            this.addTestResult('Backup Code Count', 
                result.data.backupCodes && result.data.backupCodes.length === 8,
                'Correct number of backup codes generated'
            );
            this.addTestResult('Backup Code Warning', 
                result.data.warning && result.data.warning.includes('old backup codes'),
                'Warning about old codes provided'
            );
        } else {
            this.addTestResult('Backup Code Regeneration', false, result.error.error || 'Failed');
        }
    }

    printResults() {
        console.log('\n' + '='.repeat(60));
        console.log('📋 2FA IMPLEMENTATION TEST RESULTS');
        console.log('='.repeat(60));
        
        const passed = this.testResults.filter(r => r.passed).length;
        const total = this.testResults.length;
        const percentage = ((passed / total) * 100).toFixed(1);
        
        console.log(`\n📊 Overall Results: ${passed}/${total} tests passed (${percentage}%)\n`);
        
        // Group results by category
        const categories = {
            'Setup & Registration': [],
            'Authentication': [],
            'Security': [],
            'Admin Protection': [],
            'Management': []
        };
        
        this.testResults.forEach(result => {
            const { testName } = result;
            if (testName.includes('Registration') || testName.includes('Setup')) {
                categories['Setup & Registration'].push(result);
            } else if (testName.includes('Login') || testName.includes('Verification')) {
                categories['Authentication'].push(result);
            } else if (testName.includes('Protection') || testName.includes('Rejection') || testName.includes('Prevention')) {
                categories['Security'].push(result);
            } else if (testName.includes('Admin')) {
                categories['Admin Protection'].push(result);
            } else {
                categories['Management'].push(result);
            }
        });
        
        Object.entries(categories).forEach(([category, results]) => {
            if (results.length > 0) {
                console.log(`\n🏷️  ${category}:`);
                results.forEach(result => {
                    const status = result.passed ? '✅' : '❌';
                    console.log(`   ${status} ${result.testName}`);
                    if (result.details) {
                        console.log(`      └─ ${result.details}`);
                    }
                });
            }
        });
        
        console.log('\n' + '='.repeat(60));
        
        if (passed === total) {
            console.log('🎉 ALL TESTS PASSED! 2FA implementation is working correctly.');
        } else {
            console.log(`⚠️  ${total - passed} test(s) failed. Please review the implementation.`);
        }
        
        console.log('='.repeat(60));
    }
}

// Run the tests
if (require.main === module) {
    const tester = new TwoFactorTester();
    tester.runAllTests().catch(console.error);
}

module.exports = TwoFactorTester;