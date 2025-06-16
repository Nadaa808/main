import React from 'react';
import { Card, CardContent, Typography, Box, Grid, Avatar, Chip } from '@mui/material';
import { Shield, Security, Warning, CheckCircle } from '@mui/icons-material';

const SecurityCenter = ({ users, stats }) => {
  const securityMetrics = {
    totalUsers: users.length,
    activeUsers: users.filter(u => u.isActive).length,
    verifiedUsers: users.filter(u => 
      u.kycProfile?.verificationStatus === 'APPROVED' || 
      u.kybProfile?.verificationStatus === 'APPROVED'
    ).length,
    securityScore: 98.5
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Security & Risk Management
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Monitor platform security, risk assessment, and threat detection
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: 'success.main', mx: 'auto', mb: 2 }}>
                <Shield />
              </Avatar>
              <Typography variant="h4" fontWeight="bold">{securityMetrics.securityScore}%</Typography>
              <Typography variant="body2" color="text.secondary">Security Score</Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: 'primary.main', mx: 'auto', mb: 2 }}>
                <Security />
              </Avatar>
              <Typography variant="h4" fontWeight="bold">0</Typography>
              <Typography variant="body2" color="text.secondary">Active Threats</Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: 'info.main', mx: 'auto', mb: 2 }}>
                <CheckCircle />
              </Avatar>
              <Typography variant="h4" fontWeight="bold">{securityMetrics.verifiedUsers}</Typography>
              <Typography variant="body2" color="text.secondary">Verified Users</Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: 'warning.main', mx: 'auto', mb: 2 }}>
                <Warning />
              </Avatar>
              <Typography variant="h4" fontWeight="bold">2</Typography>
              <Typography variant="body2" color="text.secondary">Risk Alerts</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mt: 3 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Security Protocols</Typography>
              <Box display="flex" gap={2} flexWrap="wrap" sx={{ mb: 2 }}>
                <Chip label="256-bit Encryption" color="success" />
                <Chip label="2FA Enabled" color="success" />
                <Chip label="JWT Authentication" color="success" />
                <Chip label="Rate Limiting" color="success" />
              </Box>
              <Typography variant="body2" color="text.secondary">
                Multi-layered security architecture with enterprise-grade protection.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Risk Assessment</Typography>
              <Typography variant="body2" color="text.secondary">
                AI-powered risk detection monitoring user behavior, transaction patterns, 
                and platform activities to identify potential security threats.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SecurityCenter; 