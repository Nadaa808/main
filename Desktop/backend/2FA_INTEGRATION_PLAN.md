# 2FA Integration Plan - Google Authenticator

## Overview

This document outlines the comprehensive implementation of Two-Factor Authentication (2FA) using Google Authenticator for the RWA Tokenization Platform backend. The implementation provides enterprise-grade security with proper backup mechanisms and admin controls.

## Architecture

### Database Schema Changes

```sql
-- User table additions for 2FA support
ALTER TABLE User ADD COLUMN twoFactorEnabled BOOLEAN DEFAULT FALSE;
ALTER TABLE User ADD COLUMN twoFactorSecret VARCHAR(191);
ALTER TABLE User ADD COLUMN twoFactorBackupCodes TEXT;
ALTER TABLE User ADD COLUMN twoFactorLastUsed DATETIME(3);
```

### Core Components

1. **TwoFactorService** (`services/twoFactorService.js`)
   - TOTP secret generation and verification
   - QR code generation for Google Authenticator
   - Backup codes management
   - Replay attack prevention

2. **Enhanced Authentication Middleware** (`middleware/auth.js`)
   - `require2FA` - Enforces 2FA for sensitive operations
   - `requireAdmin2FA` - Strict 2FA requirement for admin functions
   - `verifyBackupCode` - Alternative authentication via backup codes

3. **Updated Auth Routes** (`routes/auth.js`)
   - Complete 2FA setup workflow
   - Enhanced login with 2FA support
   - Backup code management

## API Endpoints

### Authentication & 2FA Setup

#### 1. Setup 2FA
```
POST /api/auth/2fa/setup
Authorization: Bearer <token>

Response:
{
  "message": "Scan the QR code with Google Authenticator",
  "qrCodeDataURL": "data:image/png;base64,...",
  "manualEntryKey": "JBSWY3DPEHPK3PXP",
  "backupCodes": ["AB12CD34", "EF56GH78", ...],
  "instructions": [...]
}
```

#### 2. Verify and Enable 2FA
```
POST /api/auth/2fa/verify-setup
Authorization: Bearer <token>
Content-Type: application/json

{
  "token": "123456"
}

Response:
{
  "message": "2FA enabled successfully",
  "backupCodes": ["AB12CD34", "EF56GH78", ...],
  "warning": "Save these backup codes in a secure location..."
}
```

#### 3. Enhanced Login with 2FA
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "userpassword",
  "twoFactorToken": "123456"  // Optional, required if 2FA enabled
}

// OR with backup code
{
  "email": "user@example.com", 
  "password": "userpassword",
  "backupCode": "AB12CD34"    // Alternative to twoFactorToken
}

Response:
{
  "message": "Login successful",
  "user": {...},
  "token": "jwt_token",
  "backupCodeWarning": "Running low on backup codes..." // If applicable
}
```

#### 4. Get 2FA Status
```
GET /api/auth/2fa/status
Authorization: Bearer <token>

Response:
{
  "enabled": true,
  "backupCodesRemaining": 6,
  "recommendEnable": false
}
```

#### 5. Disable 2FA
```
POST /api/auth/2fa/disable
Authorization: Bearer <token>
X-2FA-Token: 123456

Response:
{
  "message": "2FA disabled successfully",
  "warning": "Your account is now less secure..."
}
```

#### 6. Regenerate Backup Codes
```
POST /api/auth/2fa/regenerate-backup-codes
Authorization: Bearer <token>
X-2FA-Token: 123456

Response:
{
  "message": "Backup codes regenerated successfully",
  "backupCodes": ["NEW1234", "NEW5678", ...],
  "warning": "Save these new backup codes..."
}
```

### Protected Admin Operations

Admin operations requiring 2FA include:
- Access to full user data (`GET /api/admin/users-full`)
- User verification updates (`PUT /api/admin/verify-user/:id`)
- User account disable/enable (`POST /api/admin/disable-user/:id`)

Example protected request:
```
GET /api/admin/users-full
Authorization: Bearer <token>
X-2FA-Token: 123456
```

## Security Features

### 1. Time-based One-Time Passwords (TOTP)
- RFC 6238 compliant
- 30-second validity window
- 2-step tolerance for clock skew
- Base32 encoded secrets

### 2. Replay Attack Prevention
- Tracks last used timestamp
- Prevents reuse of tokens within same time window
- Comprehensive logging of authentication events

### 3. Backup Codes
- 8 single-use recovery codes
- Cryptographically secure generation
- Automatic depletion tracking
- Low-code-count warnings

### 4. Enhanced Logging
- All 2FA events logged to ActivityLog
- Admin actions with 2FA verification tracked
- Security event monitoring

### 5. Progressive Security Enforcement
- Optional for regular users
- Strongly recommended for admin roles
- Required for sensitive operations
- Graceful degradation for non-2FA users

## Implementation Phases

### Phase 1: Database Schema ✅
- [x] Added 2FA fields to User model
- [x] Created migration script
- [x] Updated Prisma schema

### Phase 2: Core Service ✅
- [x] TwoFactorService implementation
- [x] TOTP generation and verification
- [x] QR code generation
- [x] Backup code management

### Phase 3: Authentication Middleware ✅
- [x] Enhanced authenticateToken middleware
- [x] require2FA middleware
- [x] requireAdmin2FA middleware
- [x] verifyBackupCode middleware

### Phase 4: API Routes ✅
- [x] 2FA setup and verification endpoints
- [x] Enhanced login flow
- [x] Status and management endpoints
- [x] Protected admin routes

### Phase 5: Dependencies ✅
- [x] Install speakeasy for TOTP
- [x] Install qrcode for QR generation
- [x] Update package.json

## Configuration

### Environment Variables
```env
# Application name for TOTP issuer
APP_NAME=RWA Tokenization Platform

# JWT secret (existing)
JWT_SECRET=your_jwt_secret_here

# Database URL (existing)
DATABASE_URL=mysql://user:password@localhost:3306/backend_db
```

### Security Recommendations

1. **Force 2FA for Admin Roles**
   - Consider making 2FA mandatory for SUPER_ADMIN, ADMIN, COMPLIANCE_OFFICER
   - Implement grace period for existing admins

2. **Session Management**
   - Current implementation uses in-memory session for 2FA setup
   - Production should use Redis or similar for scalability

3. **Rate Limiting**
   - Implement additional rate limiting for 2FA attempts
   - Consider temporary account lockout after multiple failures

4. **Backup Strategy**
   - Regular backup of user 2FA settings
   - Recovery process for lost authenticator devices

## Testing Strategy

### Unit Tests
```javascript
// Example test cases
describe('TwoFactorService', () => {
  test('should generate valid TOTP secret', () => {...});
  test('should verify valid TOTP token', () => {...});
  test('should reject expired tokens', () => {...});
  test('should prevent replay attacks', () => {...});
});
```

### Integration Tests
```javascript
describe('2FA Authentication Flow', () => {
  test('should setup 2FA for user', () => {...});
  test('should login with 2FA token', () => {...});
  test('should login with backup code', () => {...});
  test('should protect admin routes', () => {...});
});
```

## Frontend Integration Guide

### QR Code Display
```javascript
// Display QR code for user scanning
<img src={setupResponse.qrCodeDataURL} alt="2FA QR Code" />

// Manual entry option
<p>Manual Entry Key: {setupResponse.manualEntryKey}</p>
```

### 2FA Token Input
```javascript
// Add 2FA token field to login form
<input 
  type="text" 
  placeholder="6-digit code from authenticator app"
  maxLength="6"
  pattern="[0-9]{6}"
/>
```

### Error Handling
```javascript
// Handle 2FA requirements
if (error.code === '2FA_REQUIRED') {
  // Show 2FA setup prompt
} else if (error.code === '2FA_TOKEN_REQUIRED') {
  // Show 2FA token input
} else if (error.code === '2FA_INVALID') {
  // Show invalid token error
}
```

## Monitoring & Analytics

### Key Metrics to Track
- 2FA adoption rate across user types
- Failed authentication attempts
- Backup code usage frequency
- Admin compliance with 2FA requirements

### Activity Log Events
- `2FA_ENABLED` - User enables 2FA
- `2FA_DISABLED` - User disables 2FA
- `2FA_LOGIN_SUCCESS` - Successful 2FA login
- `2FA_LOGIN_BACKUP` - Login via backup code
- `2FA_BACKUP_CODES_REGENERATED` - New backup codes generated
- `ADMIN_ACCESS_USERS_FULL` - Admin accesses sensitive data
- `ADMIN_VERIFICATION_UPDATE` - Admin updates verification status

## Next Steps

1. **Frontend Implementation** - Build React components for 2FA setup and verification
2. **Enhanced Security** - Implement device fingerprinting and risk scoring
3. **Backup Recovery** - Admin tools for 2FA recovery assistance
4. **Mobile App Support** - Consider native mobile app authentication
5. **Hardware Keys** - Future support for FIDO2/WebAuthn

## Troubleshooting

### Common Issues

1. **Time Synchronization**
   - Ensure server time is synchronized
   - TOTP is time-sensitive (±30 seconds)

2. **Secret Storage**
   - Secrets are base32 encoded
   - Store securely, never log in plaintext

3. **Session Management**
   - Temporary secrets during setup
   - Clear sessions after setup completion

### Support Procedures

1. **Lost Authenticator Device**
   - User can use backup codes
   - Admin can disable 2FA with proper verification
   - Re-setup process available

2. **Backup Code Depletion**
   - Automatic warnings when ≤2 codes remain
   - Easy regeneration process
   - Admin can assist if needed

---

**Security Note**: This implementation follows industry best practices for 2FA. Regular security audits and updates are recommended to maintain the highest security standards. 