# 🔐 Admin Profile Settings System - Complete Guide

## 📋 Overview

The Admin Profile Settings System is a comprehensive solution designed for blockchain/Web3 tokenization platforms, providing enterprise-grade admin account management with advanced security features, customizable preferences, and detailed analytics.

## 🏗️ Architecture

### Core Components

```
routes/admin/profile.js       # Main profile management routes
prisma/schema.prisma         # AdminPreferences model
middleware/auth.js           # Enhanced authentication
services/twoFactorService.js # 2FA integration
```

### Database Schema

```sql
-- AdminPreferences Model
CREATE TABLE AdminPreferences (
    id INT PRIMARY KEY AUTO_INCREMENT,
    adminId INT UNIQUE NOT NULL,
    dashboardTheme VARCHAR(255) DEFAULT 'dark',
    language VARCHAR(255) DEFAULT 'en',
    timezone VARCHAR(255) DEFAULT 'UTC',
    notificationSettings JSON,
    dashboardLayout JSON,
    defaultFilters JSON,
    autoRefreshInterval INT DEFAULT 300,
    securityAlerts JSON,
    dataRetentionPreferences JSON,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## 🚀 API Endpoints

### Profile Management

#### GET `/api/admin/profile`
Retrieve comprehensive admin profile with metrics and preferences.

**Response:**
```json
{
  "profile": {
    "id": 1,
    "email": "admin@tokenization.com",
    "firstName": "Admin",
    "lastName": "User",
    "role": "SUPER_ADMIN",
    "twoFactorEnabled": true,
    "walletAddress": "0x742d35Cc6634C0532925a3b8D0d9b6e7C3c6C5e2",
    "didAddress": "did:ethr:0x742d35Cc6634C0532925a3b8D0d9b6e7C3c6C5e2"
  },
  "metrics": {
    "totalActions": 1250,
    "actionsThisMonth": 89,
    "criticalActionsCount": 12
  },
  "security": {
    "twoFactorEnabled": true,
    "hasWalletConnected": true,
    "hasDIDConnected": true
  },
  "preferences": { ... },
  "activityStats": [ ... ],
  "recentActivities": [ ... ]
}
```

#### PUT `/api/admin/profile`
Update admin profile information.

**Request Body:**
```json
{
  "firstName": "Updated Admin",
  "lastName": "Updated User",
  "countryOfResidency": "United States",
  "walletAddress": "0x742d35Cc6634C0532925a3b8D0d9b6e7C3c6C5e2",
  "didAddress": "did:ethr:0x742d35Cc6634C0532925a3b8D0d9b6e7C3c6C5e2"
}
```

**Validation:**
- Ethereum wallet address format validation
- DID format validation (did:method:identifier)
- Required field validation

### Password Management

#### PUT `/api/admin/profile/password` (🔒 2FA Required)
Change admin password with enhanced security.

**Request Body:**
```json
{
  "currentPassword": "current_password",
  "newPassword": "new_secure_password",
  "confirmPassword": "new_secure_password"
}
```

**Security Features:**
- Current password verification
- Strong password requirements (12+ chars, mixed case, numbers, symbols)
- Password history check (prevents reuse)
- Higher salt rounds (14) for admin accounts
- 2FA verification required
- Activity logging with metadata

### Preferences Management

#### GET `/api/admin/profile/preferences`
Retrieve admin dashboard preferences.

#### PUT `/api/admin/profile/preferences`
Update admin dashboard preferences.

**Request Body:**
```json
{
  "dashboardTheme": "dark",
  "language": "en",
  "timezone": "America/New_York",
  "notificationSettings": {
    "emailAlerts": true,
    "securityAlerts": true,
    "systemUpdates": false,
    "weeklyReports": true
  },
  "dashboardLayout": {
    "compactMode": false,
    "showAdvancedMetrics": true,
    "defaultView": "overview"
  },
  "defaultFilters": {
    "userStatus": "all",
    "verificationStatus": "all",
    "dateRange": "30d"
  },
  "autoRefreshInterval": 300,
  "securityAlerts": {
    "failedLogins": true,
    "suspiciousActivity": true,
    "newAdminActions": true
  }
}
```

### Security Management

#### GET `/api/admin/profile/security`
Get comprehensive security status and recommendations.

**Response:**
```json
{
  "twoFactorEnabled": true,
  "backupCodesRemaining": 6,
  "securityScore": 85,
  "securityActivities": [ ... ],
  "recommendations": [
    {
      "type": "warning",
      "title": "Update Password",
      "description": "Consider changing your password regularly",
      "action": "change_password"
    }
  ]
}
```

**Security Score Calculation:**
- 2FA enabled: 40 points
- Backup codes available: 20 points
- Recent password change: 20 points
- No security incidents: 20 points

### Activity Analytics

#### GET `/api/admin/profile/activity`
Get detailed admin activity analytics with filtering and pagination.

**Query Parameters:**
- `timeRange`: 7d, 30d, 90d, 1y
- `activityType`: Filter by specific activity type
- `page`: Page number for pagination
- `limit`: Results per page (max 100)

**Response:**
```json
{
  "activities": [ ... ],
  "statistics": [
    {
      "type": "ADMIN_VERIFICATION_UPDATE",
      "_count": { "type": 25 }
    }
  ],
  "insights": {
    "totalActivities": 150,
    "mostCommonActivity": {
      "type": "LOGIN_SUCCESS",
      "count": 45,
      "percentage": "30.0"
    },
    "activityTrend": "increasing",
    "securityEvents": 3
  },
  "pagination": {
    "page": 1,
    "limit": 50,
    "totalCount": 150,
    "totalPages": 3
  }
}
```

### Data Export

#### POST `/api/admin/profile/export` (🔒 2FA Required)
Export admin profile and activity data.

**Request Body:**
```json
{
  "exportType": "full",
  "dateRange": "30d",
  "includeMetadata": true
}
```

**Export Types:**
- `profile`: Admin profile data only
- `activities`: Activity logs only
- `full`: Complete data export

## 🔒 Security Features

### Authentication & Authorization
- JWT token-based authentication
- Role-based access control (SUPER_ADMIN, ADMIN, COMPLIANCE_OFFICER)
- Token expiration and refresh handling

### Two-Factor Authentication
- TOTP-based 2FA for sensitive operations
- Backup code support
- Replay attack prevention
- Progressive security enforcement

### Enhanced Security Measures
- Strong password requirements for admin accounts
- Higher bcrypt salt rounds (14 for admins vs 12 for users)
- Activity logging for all operations
- IP address and user agent tracking
- Suspicious activity detection

### Input Validation
- Ethereum wallet address validation
- DID format validation
- Password strength requirements
- Preference value validation
- SQL injection prevention

## 📊 Admin Metrics & Analytics

### Profile Metrics
- Total administrative actions
- Monthly activity count
- Critical actions performed
- Last login tracking

### Security Analytics
- Security score calculation
- Backup code status
- Recent security events
- Personalized recommendations

### Activity Insights
- Activity trend analysis
- Most common operations
- Security event detection
- Performance metrics

## 🎨 Customization Features

### Dashboard Preferences
- **Theme**: Light, Dark, Auto
- **Language**: Multi-language support (EN, ES, FR, DE, ZH, JA)
- **Timezone**: Global timezone support
- **Layout**: Compact mode, advanced metrics toggle
- **Auto-refresh**: Configurable intervals (60s - 3600s)

### Notification Settings
- Email alerts configuration
- Security alert preferences
- System update notifications
- Weekly report settings

### Default Filters
- User status filters
- Verification status preferences
- Default date ranges
- Custom filter presets

## 🔧 Implementation Guide

### 1. Database Setup
```bash
# Run the migration
npx prisma migrate dev --name add_admin_preferences

# Generate Prisma client
npx prisma generate
```

### 2. Route Integration
```javascript
// In routes/admin.js
const profileRouter = require('./admin/profile');
router.use('/profile', profileRouter);
```

### 3. Frontend Integration
```javascript
// Example API calls
const adminProfile = await fetch('/api/admin/profile', {
  headers: { 'Authorization': `Bearer ${token}` }
});

const updatePreferences = await fetch('/api/admin/profile/preferences', {
  method: 'PUT',
  headers: { 
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(preferences)
});
```

## 🧪 Testing

### Comprehensive Test Suite
Run the complete test suite:
```bash
node test-admin-profile.js
```

### Test Coverage
- ✅ Profile retrieval and updates
- ✅ Preferences management
- ✅ Security status monitoring
- ✅ Activity analytics
- ✅ 2FA-protected operations
- ✅ Input validation
- ✅ Authentication & authorization
- ✅ Error handling

### Manual Testing Checklist
- [ ] Admin profile CRUD operations
- [ ] Preferences persistence
- [ ] Security score calculation
- [ ] Activity filtering and pagination
- [ ] 2FA requirement enforcement
- [ ] Wallet/DID validation
- [ ] Export functionality
- [ ] Error responses

## 🚨 Security Considerations

### Production Deployment
1. **Environment Variables**
   - Secure JWT secrets
   - Database credentials
   - 2FA encryption keys

2. **Rate Limiting**
   - Profile update limits
   - Export request throttling
   - Activity query restrictions

3. **Monitoring**
   - Failed authentication attempts
   - Suspicious activity patterns
   - Export usage tracking

4. **Backup & Recovery**
   - Admin preference backups
   - Activity log retention
   - Disaster recovery procedures

## 📈 Performance Optimization

### Database Indexing
```sql
-- Recommended indexes
CREATE INDEX idx_admin_preferences_admin_id ON AdminPreferences(adminId);
CREATE INDEX idx_activity_log_user_created ON ActivityLog(userId, createdAt);
CREATE INDEX idx_activity_log_type_created ON ActivityLog(type, createdAt);
```

### Caching Strategy
- Profile data caching (5-minute TTL)
- Preferences caching (10-minute TTL)
- Activity statistics caching (15-minute TTL)

### Query Optimization
- Paginated activity queries
- Selective field loading
- Aggregation pipeline optimization

## 🔮 Future Enhancements

### Planned Features
- [ ] Multi-admin collaboration tools
- [ ] Advanced analytics dashboard
- [ ] Custom notification channels
- [ ] Role-based preference templates
- [ ] Audit trail visualization
- [ ] Mobile app support
- [ ] SSO integration
- [ ] Advanced export formats

### Integration Roadmap
- [ ] Webhook notifications
- [ ] External identity providers
- [ ] Third-party analytics
- [ ] Compliance reporting
- [ ] Advanced threat detection

## 📞 Support & Maintenance

### Troubleshooting
1. **Profile not loading**: Check authentication token
2. **Preferences not saving**: Verify JSON format
3. **2FA failures**: Check time synchronization
4. **Export timeouts**: Reduce date range

### Monitoring Queries
```sql
-- Check admin activity
SELECT type, COUNT(*) as count 
FROM ActivityLog 
WHERE userId IN (SELECT id FROM User WHERE role IN ('SUPER_ADMIN', 'ADMIN')) 
GROUP BY type;

-- Security score distribution
SELECT 
  CASE 
    WHEN twoFactorEnabled = 1 THEN 'High Security'
    ELSE 'Standard Security'
  END as security_level,
  COUNT(*) as admin_count
FROM User 
WHERE role IN ('SUPER_ADMIN', 'ADMIN', 'COMPLIANCE_OFFICER')
GROUP BY twoFactorEnabled;
```

---

## 🎯 Conclusion

The Admin Profile Settings System provides a comprehensive, secure, and user-friendly solution for managing administrator accounts in blockchain tokenization platforms. With enterprise-grade security, extensive customization options, and detailed analytics, it ensures optimal administrative experience while maintaining the highest security standards.

**Key Benefits:**
- 🔒 Enterprise-grade security with 2FA
- 🎨 Fully customizable admin experience  
- 📊 Comprehensive analytics and insights
- 🚀 Scalable and performant architecture
- 🔧 Easy integration and maintenance

For technical support or feature requests, please refer to the development team or create an issue in the project repository.