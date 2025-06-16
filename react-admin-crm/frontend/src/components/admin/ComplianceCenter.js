import React from 'react';
import { Card, CardContent, Typography, Box, Grid, Avatar, Chip } from '@mui/material';
import { Gavel, Security, Warning, CheckCircle } from '@mui/icons-material';

const ComplianceCenter = ({ users }) => {
  const complianceMetrics = {
    totalUsers: users.length,
    compliantUsers: users.filter(u => 
      u.kycProfile?.verificationStatus === 'APPROVED' || 
      u.kybProfile?.verificationStatus === 'APPROVED'
    ).length,
    pendingReview: users.filter(u => 
      u.kycProfile?.verificationStatus === 'PENDING' || 
      u.kybProfile?.verificationStatus === 'PENDING'
    ).length,
    riskFlags: users.filter(u => 
      u.kycProfile?.verificationStatus === 'REJECTED' || 
      u.kybProfile?.verificationStatus === 'REJECTED'
    ).length
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Compliance Center
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Monitor regulatory compliance, AML/KYC status, and risk management
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: 'success.main', mx: 'auto', mb: 2 }}>
                <CheckCircle />
              </Avatar>
              <Typography variant="h4" fontWeight="bold">{complianceMetrics.compliantUsers}</Typography>
              <Typography variant="body2" color="text.secondary">Compliant Users</Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: 'warning.main', mx: 'auto', mb: 2 }}>
                <Warning />
              </Avatar>
              <Typography variant="h4" fontWeight="bold">{complianceMetrics.pendingReview}</Typography>
              <Typography variant="body2" color="text.secondary">Pending Review</Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: 'error.main', mx: 'auto', mb: 2 }}>
                <Security />
              </Avatar>
              <Typography variant="h4" fontWeight="bold">{complianceMetrics.riskFlags}</Typography>
              <Typography variant="body2" color="text.secondary">Risk Flags</Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: 'primary.main', mx: 'auto', mb: 2 }}>
                <Gavel />
              </Avatar>
              <Typography variant="h4" fontWeight="bold">
                {((complianceMetrics.compliantUsers / complianceMetrics.totalUsers) * 100).toFixed(1)}%
              </Typography>
              <Typography variant="body2" color="text.secondary">Compliance Rate</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mt: 3 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>AML/KYC Compliance</Typography>
              <Box display="flex" gap={2} flexWrap="wrap">
                <Chip label="SOX Compliant" color="success" />
                <Chip label="GDPR Ready" color="success" />
                <Chip label="SEC Registered" color="info" />
                <Chip label="FINRA Approved" color="primary" />
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Platform maintains full regulatory compliance with financial and data protection standards.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Risk Management</Typography>
              <Typography variant="body2" color="text.secondary">
                Advanced risk assessment tools for monitoring suspicious activities, 
                transaction patterns, and compliance violations across the platform.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ComplianceCenter; 