const rateLimit = require('express-rate-limit');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Advanced Security Middleware for 2FA Implementation
 * Provides additional security layers beyond basic rate limiting
 */

// Store for tracking failed attempts (in production, use Redis)
const failedAttempts = new Map();
const lockedAccounts = new Map();

/**
 * Stricter rate limiting specifically for authentication endpoints
 */
const authRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 requests per windowMs for auth
    message: {
        error: 'Too many authentication attempts. Please try again later.',
        retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Skip successful requests
    skipSuccessfulRequests: true,
    // Custom key generator to include both IP and email
    keyGenerator: (req, res) => {
        const ip = req.ip || req.connection.remoteAddress;
        const email = req.body && req.body.email ? req.body.email : 'unknown';
        return `${ip}:${email}`;
    }
});

/**
 * Extremely strict rate limiting for 2FA token attempts
 */
const twoFactorRateLimit = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 3, // Only 3 attempts per 5 minutes
    message: {
        error: 'Too many 2FA attempts. Please wait 5 minutes before trying again.',
        retryAfter: '5 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req, res) => {
        const ip = req.ip || req.connection.remoteAddress;
        const email = (req.body && req.body.email) || (req.user && req.user.email) || 'unknown';
        return `2fa:${ip}:${email}`;
    }
});

/**
 * Account lockout mechanism after multiple failed attempts
 */
async function accountLockoutMiddleware(req, res, next) {
    const email = req.body && req.body.email ? req.body.email : null;
    const ip = req.ip || req.connection.remoteAddress;

    if (!email) {
        return next();
    }

    const lockKey = `lock:${email}`;
    const attemptKey = `attempts:${email}:${ip}`;

    // Check if account is currently locked
    if (lockedAccounts.has(lockKey)) {
        const lockInfo = lockedAccounts.get(lockKey);
        const now = Date.now();

        if (now < lockInfo.unlockAt) {
            const remainingTime = Math.ceil((lockInfo.unlockAt - now) / 1000 / 60);
            return res.status(423).json({
                error: 'Account temporarily locked due to multiple failed attempts',
                unlockIn: `${remainingTime} minutes`,
                attempt: lockInfo.attempts
            });
        } else {
            // Lock expired, remove it
            lockedAccounts.delete(lockKey);
            failedAttempts.delete(attemptKey);
        }
    }

    // Continue to next middleware
    next();
}

/**
 * Track failed login attempts and implement progressive penalties
 */
async function trackFailedAttempts(email, ip, attemptType = 'login') {
    const attemptKey = `attempts:${email}:${ip}`;
    const lockKey = `lock:${email}`;
    const now = Date.now();

    // Get current attempt count
    let attempts = failedAttempts.get(attemptKey) || { count: 0, firstAttempt: now, lastAttempt: now };
    attempts.count++;
    attempts.lastAttempt = now;

    // Reset counter if more than 1 hour has passed since first attempt
    if (now - attempts.firstAttempt > 60 * 60 * 1000) {
        attempts = { count: 1, firstAttempt: now, lastAttempt: now };
    }

    failedAttempts.set(attemptKey, attempts);

    // Log the failed attempt
    try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (user) {
            await prisma.activityLog.create({
                data: {
                    type: `FAILED_${attemptType.toUpperCase()}_ATTEMPT`,
                    description: `Failed ${attemptType} attempt #${attempts.count} from IP ${ip}`,
                    userId: user.id,
                    metadata: JSON.stringify({ ip, attemptCount: attempts.count })
                }
            });
        }
    } catch (error) {
        console.error('Failed to log attempt:', error);
    }

    // Implement progressive lockout
    let lockDuration = 0;
    if (attempts.count >= 10) {
        lockDuration = 60 * 60 * 1000; // 1 hour
    } else if (attempts.count >= 7) {
        lockDuration = 30 * 60 * 1000; // 30 minutes
    } else if (attempts.count >= 5) {
        lockDuration = 15 * 60 * 1000; // 15 minutes
    } else if (attempts.count >= 3) {
        lockDuration = 5 * 60 * 1000; // 5 minutes
    }

    if (lockDuration > 0) {
        const unlockAt = now + lockDuration;
        lockedAccounts.set(lockKey, {
            attempts: attempts.count,
            lockedAt: now,
            unlockAt: unlockAt,
            ip: ip
        });

        // Log account lockout
        try {
            const user = await prisma.user.findUnique({ where: { email } });
            if (user) {
                await prisma.activityLog.create({
                    data: {
                        type: 'ACCOUNT_LOCKED',
                        description: `Account locked for ${lockDuration / 1000 / 60} minutes after ${attempts.count} failed attempts`,
                        userId: user.id,
                        metadata: JSON.stringify({
                            ip,
                            attemptCount: attempts.count,
                            lockDuration: lockDuration,
                            unlockAt: new Date(unlockAt).toISOString()
                        })
                    }
                });
            }
        } catch (error) {
            console.error('Failed to log lockout:', error);
        }

        return {
            locked: true,
            duration: lockDuration,
            attempts: attempts.count,
            unlockAt: unlockAt
        };
    }

    return { locked: false, attempts: attempts.count };
}

/**
 * Clear failed attempts on successful login
 */
function clearFailedAttempts(email, ip) {
    const attemptKey = `attempts:${email}:${ip}`;
    const lockKey = `lock:${email}`;

    failedAttempts.delete(attemptKey);
    lockedAccounts.delete(lockKey);
}

/**
 * Middleware to add progressive delay based on failed attempts
 */
async function progressiveDelayMiddleware(req, res, next) {
    const email = req.body && req.body.email ? req.body.email : null;
    const ip = req.ip || req.connection.remoteAddress;

    if (!email) {
        return next();
    }

    const attemptKey = `attempts:${email}:${ip}`;
    const attempts = failedAttempts.get(attemptKey);

    if (attempts && attempts.count > 1) {
        // Progressive delay: 1s, 2s, 4s, 8s, 16s, max 30s
        const delay = Math.min(Math.pow(2, attempts.count - 1) * 1000, 30000);

        console.log(`Adding ${delay}ms delay for ${email} (attempt ${attempts.count})`);

        await new Promise(resolve => setTimeout(resolve, delay));
    }

    next();
}

/**
 * Enhanced login middleware that combines all security features
 */
function enhancedLoginSecurity(req, res, next) {
    // Apply rate limiting first
    authRateLimit(req, res, (err) => {
        if (err) return res.status(429).json(err.message);

        // Then apply account lockout check
        accountLockoutMiddleware(req, res, (err) => {
            if (err) return res.status(500).json({ error: 'Security check failed' });

            // Finally apply progressive delay
            progressiveDelayMiddleware(req, res, next);
        });
    });
}

/**
 * Enhanced 2FA middleware that applies stricter limits
 */
function enhanced2FASecurity(req, res, next) {
    twoFactorRateLimit(req, res, (err) => {
        if (err) return res.status(429).json(err.message);

        accountLockoutMiddleware(req, res, (err) => {
            if (err) return res.status(500).json({ error: '2FA security check failed' });

            progressiveDelayMiddleware(req, res, next);
        });
    });
}

/**
 * Suspicious activity detection
 */
async function detectSuspiciousActivity(email, ip, userAgent) {
    // Check for rapid requests from same IP to different accounts
    const suspiciousPatterns = [];

    // Pattern 1: Multiple accounts from same IP
    let ipAttempts = 0;
    for (const [key] of failedAttempts) {
        if (key.includes(ip)) {
            ipAttempts++;
        }
    }

    if (ipAttempts > 5) {
        suspiciousPatterns.push('Multiple account targeting from same IP');
    }

    // Pattern 2: Unusual user agent
    if (userAgent && (userAgent.includes('bot') || userAgent.includes('script'))) {
        suspiciousPatterns.push('Automated tool detected');
    }

    // Pattern 3: Rapid succession attempts
    const attemptKey = `attempts:${email}:${ip}`;
    const attempts = failedAttempts.get(attemptKey);
    if (attempts && attempts.count > 3) {
        const timeDiff = attempts.lastAttempt - attempts.firstAttempt;
        if (timeDiff < 60000) { // Less than 1 minute for 3+ attempts
            suspiciousPatterns.push('Rapid succession attempts detected');
        }
    }

    if (suspiciousPatterns.length > 0) {
        // Log suspicious activity
        try {
            const user = await prisma.user.findUnique({ where: { email } });
            if (user) {
                await prisma.activityLog.create({
                    data: {
                        type: 'SUSPICIOUS_ACTIVITY',
                        description: `Suspicious activity detected: ${suspiciousPatterns.join(', ')}`,
                        userId: user.id,
                        metadata: JSON.stringify({
                            ip,
                            userAgent,
                            patterns: suspiciousPatterns,
                            ipAttempts
                        })
                    }
                });
            }
        } catch (error) {
            console.error('Failed to log suspicious activity:', error);
        }
    }

    return suspiciousPatterns;
}

/**
 * Get security status for an email/IP combination
 */
function getSecurityStatus(email, ip) {
    const attemptKey = `attempts:${email}:${ip}`;
    const lockKey = `lock:${email}`;

    const attempts = failedAttempts.get(attemptKey);
    const lockInfo = lockedAccounts.get(lockKey);

    return {
        isLocked: !!lockInfo,
        failedAttempts: attempts ? attempts.count : 0,
        lockInfo: lockInfo || null,
        nextDelay: attempts ? Math.min(Math.pow(2, attempts.count) * 1000, 30000) : 0
    };
}

module.exports = {
    authRateLimit,
    twoFactorRateLimit,
    accountLockoutMiddleware,
    trackFailedAttempts,
    clearFailedAttempts,
    progressiveDelayMiddleware,
    enhancedLoginSecurity,
    enhanced2FASecurity,
    detectSuspiciousActivity,
    getSecurityStatus
};