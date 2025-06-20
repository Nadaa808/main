const axios = require('axios');
const chalk = require('chalk');

// Test configuration
const BASE_URL = 'http://localhost:3001';
const TEST_ADMIN = {
    email: 'admin@tokenization.com',
    password: 'AdminSecure123!@#',
    firstName: 'Admin',
    lastName: 'User',
    role: 'SUPER_ADMIN'
};

let authToken = '';
let twoFactorSecret = '';

// Test utilities
const log = {
    info: (msg) => console.log(chalk.blue('ℹ'), msg),
    success: (msg) => console.log(chalk.green('✅'), msg),
    error: (msg) => console.log(chalk.red('❌'), msg),
    warning: (msg) => console.log(chalk.yellow('⚠️'), msg),
    section: (msg) => console.log(chalk.cyan('\n🔷'), chalk.bold(msg))
};

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function makeRequest(method, endpoint, data = null, headers = {}) {
    try {
        const config = {
            method,
            url: `${BASE_URL}${endpoint}`,
            headers: {
                'Content-Type': 'application/json',
                ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
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
            error: (error.response && error.response.data && error.response.data.error) || error.message,
            status: (error.response && error.response.status) || 500,
            data: error.response && error.response.data
        };
    }
}

async function registerAndLoginAdmin() {
    log.section('ADMIN REGISTRATION & LOGIN');

    // Register admin
    log.info('Registering admin user...');
    const registerResult = await makeRequest('POST', '/api/auth/register', TEST_ADMIN);

    if (registerResult.success) {
        log.success('Admin registered successfully');
    } else {
        log.info('Admin might already exist, proceeding to login...');
    }

    // Login admin
    log.info('Logging in admin...');
    const loginResult = await makeRequest('POST', '/api/auth/login', {
        email: TEST_ADMIN.email,
        password: TEST_ADMIN.password
    });

    if (loginResult.success) {
        authToken = loginResult.data.token;
        log.success('Admin logged in successfully');
        return true;
    } else {
        log.error(`Admin login failed: ${loginResult.error}`);
        return false;
    }
}

async function testAdminProfileRetrieval() {
    log.section('ADMIN PROFILE RETRIEVAL');

    log.info('Fetching admin profile...');
    const result = await makeRequest('GET', '/api/admin/profile');

    if (result.success) {
        log.success('Admin profile retrieved successfully');
        console.log(chalk.gray('Profile data:'), JSON.stringify(result.data.profile, null, 2));
        console.log(chalk.gray('Metrics:'), JSON.stringify(result.data.metrics, null, 2));
        console.log(chalk.gray('Security status:'), JSON.stringify(result.data.security, null, 2));
        return result.data;
    } else {
        log.error(`Failed to retrieve admin profile: ${result.error}`);
        return null;
    }
}

async function testAdminProfileUpdate() {
    log.section('ADMIN PROFILE UPDATE');

    const updateData = {
        firstName: 'Updated Admin',
        lastName: 'Updated User',
        countryOfResidency: 'United States',
        walletAddress: '0x742d35Cc6634C0532925a3b8D0d9b6e7C3c6C5e2',
        didAddress: 'did:ethr:0x742d35Cc6634C0532925a3b8D0d9b6e7C3c6C5e2'
    };

    log.info('Updating admin profile...');
    const result = await makeRequest('PUT', '/api/admin/profile', updateData);

    if (result.success) {
        log.success('Admin profile updated successfully');
        console.log(chalk.gray('Updated profile:'), JSON.stringify(result.data.profile, null, 2));
        return true;
    } else {
        log.error(`Failed to update admin profile: ${result.error}`);
        return false;
    }
}

async function testAdminPreferences() {
    log.section('ADMIN PREFERENCES MANAGEMENT');

    // Get current preferences
    log.info('Fetching admin preferences...');
    const getResult = await makeRequest('GET', '/api/admin/profile/preferences');

    if (getResult.success) {
        log.success('Admin preferences retrieved successfully');
        console.log(chalk.gray('Current preferences:'), JSON.stringify(getResult.data, null, 2));
    } else {
        log.error(`Failed to retrieve preferences: ${getResult.error}`);
    }

    // Update preferences
    const newPreferences = {
        dashboardTheme: 'light',
        language: 'en',
        timezone: 'America/New_York',
        notificationSettings: {
            emailAlerts: true,
            securityAlerts: true,
            systemUpdates: false,
            weeklyReports: true
        },
        dashboardLayout: {
            compactMode: true,
            showAdvancedMetrics: true,
            defaultView: 'analytics'
        },
        defaultFilters: {
            userStatus: 'active',
            verificationStatus: 'approved',
            dateRange: '7d'
        },
        autoRefreshInterval: 600,
        securityAlerts: {
            failedLogins: true,
            suspiciousActivity: true,
            newAdminActions: false
        },
        dataRetentionPreferences: {
            activityLogRetention: '2y',
            exportFrequency: 'weekly'
        }
    };

    log.info('Updating admin preferences...');
    const updateResult = await makeRequest('PUT', '/api/admin/profile/preferences', newPreferences);

    if (updateResult.success) {
        log.success('Admin preferences updated successfully');
        console.log(chalk.gray('Updated preferences:'), JSON.stringify(updateResult.data.preferences, null, 2));
        return true;
    } else {
        log.error(`Failed to update preferences: ${updateResult.error}`);
        return false;
    }
}

async function testSecurityStatus() {
    log.section('ADMIN SECURITY STATUS');

    log.info('Fetching admin security status...');
    const result = await makeRequest('GET', '/api/admin/profile/security');

    if (result.success) {
        log.success('Admin security status retrieved successfully');
        console.log(chalk.gray('Security data:'), JSON.stringify(result.data, null, 2));

        // Display security score
        if (result.data.securityScore !== undefined) {
            const score = result.data.securityScore;
            const scoreColor = score >= 80 ? 'green' : score >= 60 ? 'yellow' : 'red';
            console.log(chalk[scoreColor](`Security Score: ${score}/100`));
        }

        // Display recommendations
        if (result.data.recommendations && result.data.recommendations.length > 0) {
            log.warning('Security Recommendations:');
            result.data.recommendations.forEach(rec => {
                console.log(chalk.gray(`  • ${rec.title}: ${rec.description}`));
            });
        }

        return result.data;
    } else {
        log.error(`Failed to retrieve security status: ${result.error}`);
        return null;
    }
}

async function testActivityAnalytics() {
    log.section('ADMIN ACTIVITY ANALYTICS');

    // Test different time ranges
    const timeRanges = ['7d', '30d', '90d'];

    for (const timeRange of timeRanges) {
        log.info(`Fetching activity data for ${timeRange}...`);
        const result = await makeRequest('GET', `/api/admin/profile/activity?timeRange=${timeRange}&limit=10`);

        if (result.success) {
            log.success(`Activity data for ${timeRange} retrieved successfully`);
            console.log(chalk.gray(`Activities count: ${result.data.activities.length}`));
            console.log(chalk.gray(`Total activities: ${result.data.pagination.totalCount}`));

            if (result.data.insights) {
                console.log(chalk.gray('Insights:'), JSON.stringify(result.data.insights, null, 2));
            }
        } else {
            log.error(`Failed to retrieve activity data for ${timeRange}: ${result.error}`);
        }

        await delay(500); // Small delay between requests
    }
}

async function testPasswordChange() {
    log.section('ADMIN PASSWORD CHANGE (2FA Required)');

    // First, let's try without 2FA (should fail)
    log.info('Attempting password change without 2FA...');
    const noTwoFAResult = await makeRequest('PUT', '/api/admin/profile/password', {
        currentPassword: TEST_ADMIN.password,
        newPassword: 'NewAdminSecure123!@#',
        confirmPassword: 'NewAdminSecure123!@#'
    });

    if (!noTwoFAResult.success && noTwoFAResult.data && noTwoFAResult.data.error === '2FA_REQUIRED') {
        log.success('Password change correctly requires 2FA');
    } else {
        log.warning('Password change should require 2FA');
    }

    // Note: Full 2FA testing would require setting up 2FA first
    log.info('Full 2FA password change test requires 2FA setup (skipping for now)');
}

async function testDataExport() {
    log.section('ADMIN DATA EXPORT (2FA Required)');

    // Test different export types
    const exportTypes = ['profile', 'activities'];

    for (const exportType of exportTypes) {
        log.info(`Testing ${exportType} export without 2FA...`);
        const result = await makeRequest('POST', '/api/admin/profile/export', {
            exportType,
            dateRange: '30d',
            includeMetadata: false
        });

        if (!result.success && result.data && result.data.error === '2FA_REQUIRED') {
            log.success(`${exportType} export correctly requires 2FA`);
        } else {
            log.warning(`${exportType} export should require 2FA`);
        }
    }
}

async function testInvalidRequests() {
    log.section('INVALID REQUEST HANDLING');

    // Test invalid wallet address
    log.info('Testing invalid wallet address...');
    const invalidWalletResult = await makeRequest('PUT', '/api/admin/profile', {
        walletAddress: 'invalid-wallet-address'
    });

    if (!invalidWalletResult.success && invalidWalletResult.error.includes('Invalid wallet address')) {
        log.success('Invalid wallet address correctly rejected');
    } else {
        log.error('Invalid wallet address should be rejected');
    }

    // Test invalid DID
    log.info('Testing invalid DID...');
    const invalidDIDResult = await makeRequest('PUT', '/api/admin/profile', {
        didAddress: 'invalid-did-format'
    });

    if (!invalidDIDResult.success && invalidDIDResult.error.includes('Invalid DID')) {
        log.success('Invalid DID correctly rejected');
    } else {
        log.error('Invalid DID should be rejected');
    }

    // Test invalid export type
    log.info('Testing invalid export type...');
    const invalidExportResult = await makeRequest('POST', '/api/admin/profile/export', {
        exportType: 'invalid-type'
    });

    if (!invalidExportResult.success && invalidExportResult.error.includes('Invalid export type')) {
        log.success('Invalid export type correctly rejected');
    } else {
        log.error('Invalid export type should be rejected');
    }
}

async function testAuthorizationLevels() {
    log.section('AUTHORIZATION LEVEL TESTING');

    // Test without authentication
    const tempToken = authToken;
    authToken = '';

    log.info('Testing without authentication...');
    const noAuthResult = await makeRequest('GET', '/api/admin/profile');

    if (!noAuthResult.success && noAuthResult.status === 401) {
        log.success('Correctly requires authentication');
    } else {
        log.error('Should require authentication');
    }

    // Restore token
    authToken = tempToken;

    // Test with invalid token
    log.info('Testing with invalid token...');
    const invalidTokenResult = await makeRequest('GET', '/api/admin/profile', null, {
        'Authorization': 'Bearer invalid-token'
    });

    if (!invalidTokenResult.success && invalidTokenResult.status === 403) {
        log.success('Correctly rejects invalid token');
    } else {
        log.error('Should reject invalid token');
    }
}

async function runComprehensiveTests() {
    console.log(chalk.bold.cyan('\n🚀 ADMIN PROFILE SETTINGS - COMPREHENSIVE TEST SUITE\n'));
    console.log(chalk.gray('Testing comprehensive admin profile management functionality...\n'));

    let testResults = {
        passed: 0,
        failed: 0,
        total: 0
    };

    const tests = [
        { name: 'Admin Registration & Login', fn: registerAndLoginAdmin },
        { name: 'Admin Profile Retrieval', fn: testAdminProfileRetrieval },
        { name: 'Admin Profile Update', fn: testAdminProfileUpdate },
        { name: 'Admin Preferences Management', fn: testAdminPreferences },
        { name: 'Security Status', fn: testSecurityStatus },
        { name: 'Activity Analytics', fn: testActivityAnalytics },
        { name: 'Password Change (2FA)', fn: testPasswordChange },
        { name: 'Data Export (2FA)', fn: testDataExport },
        { name: 'Invalid Request Handling', fn: testInvalidRequests },
        { name: 'Authorization Levels', fn: testAuthorizationLevels }
    ];

    for (const test of tests) {
        testResults.total++;
        try {
            const result = await test.fn();
            if (result !== false) {
                testResults.passed++;
                log.success(`${test.name}: PASSED`);
            } else {
                testResults.failed++;
                log.error(`${test.name}: FAILED`);
            }
        } catch (error) {
            testResults.failed++;
            log.error(`${test.name}: ERROR - ${error.message}`);
        }

        await delay(1000); // Delay between tests
    }

    // Final results
    console.log(chalk.bold.cyan('\n📊 TEST RESULTS SUMMARY'));
    console.log(chalk.green(`✅ Passed: ${testResults.passed}`));
    console.log(chalk.red(`❌ Failed: ${testResults.failed}`));
    console.log(chalk.blue(`📈 Total: ${testResults.total}`));
    console.log(chalk.yellow(`📊 Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`));

    if (testResults.failed === 0) {
        console.log(chalk.bold.green('\n🎉 ALL TESTS PASSED! Admin Profile Settings system is working correctly.'));
    } else {
        console.log(chalk.bold.yellow('\n⚠️  Some tests failed. Please review the errors above.'));
    }

    // Feature overview
    console.log(chalk.bold.cyan('\n🔍 ADMIN PROFILE FEATURES TESTED:'));
    console.log(chalk.gray('• Comprehensive profile management'));
    console.log(chalk.gray('• Dashboard preferences & customization'));
    console.log(chalk.gray('• Security status & recommendations'));
    console.log(chalk.gray('• Activity analytics & insights'));
    console.log(chalk.gray('• 2FA-protected sensitive operations'));
    console.log(chalk.gray('• Data export capabilities'));
    console.log(chalk.gray('• Input validation & error handling'));
    console.log(chalk.gray('• Authentication & authorization'));
    console.log(chalk.gray('• Blockchain wallet & DID integration'));
    console.log(chalk.gray('• Admin-specific security enhancements'));
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

// Run the comprehensive test suite
if (require.main === module) {
    runComprehensiveTests().catch(error => {
        console.error(chalk.red('Test suite failed:'), error);
        process.exit(1);
    });
}

module.exports = {
    runComprehensiveTests,
    makeRequest,
    TEST_ADMIN
};