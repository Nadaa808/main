import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  Avatar,
  Chip,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import {
  Business as BusinessIcon,
  VerifiedUser as VerifiedIcon,
  Warning as WarningIcon,
  TrendingUp as AssetsIcon,
  MonetizationOn as RevenueIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Block as SuspendIcon,
  CheckCircle as ApproveIcon
} from '@mui/icons-material';

const IssuerManagement = ({ users }) => {
  const [filter, setFilter] = useState('all');
  const [selectedIssuer, setSelectedIssuer] = useState(null);

  const issuers = users || [];
  
  const filteredIssuers = issuers.filter(issuer => {
    if (filter === 'verified') return issuer.kybProfile?.verificationStatus === 'APPROVED';
    if (filter === 'pending') return issuer.kybProfile?.verificationStatus === 'PENDING';
    if (filter === 'suspended') return !issuer.isActive;
    return true;
  });

  const getVerificationStatus = (issuer) => {
    if (!issuer.kybProfile) return { status: 'NO_KYB', color: 'error', label: 'No KYB' };
    const status = issuer.kybProfile.verificationStatus;
    const colors = {
      PENDING: 'warning',
      IN_REVIEW: 'info', 
      APPROVED: 'success',
      REJECTED: 'error'
    };
    return { status, color: colors[status] || 'default', label: status };
  };

  const handleStatusChange = (issuerId, newStatus) => {
    // TODO: Implement status change API call
    console.log(`Changing issuer ${issuerId} status to ${newStatus}`);
  };

  const getIssuerStats = (issuer) => {
    const assets = issuer.issuedAssets?.length || 0;
    const totalValue = issuer.issuedAssets?.reduce((sum, asset) => 
      sum + (parseFloat(asset.valuationAmount) || 0), 0) || 0;
    const investments = issuer.issuedAssets?.reduce((sum, asset) => 
      sum + (asset.investments?.length || 0), 0) || 0;
    
    return { assets, totalValue, investments };
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Issuer Management
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Manage asset issuers, approve tokenization requests, and monitor platform activity
      </Typography>

      {/* Issuer Statistics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: 'primary.main', mx: 'auto', mb: 2 }}>
                <BusinessIcon />
              </Avatar>
              <Typography variant="h4" fontWeight="bold">{issuers.length}</Typography>
              <Typography variant="body2" color="text.secondary">Total Issuers</Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: 'success.main', mx: 'auto', mb: 2 }}>
                <VerifiedIcon />
              </Avatar>
              <Typography variant="h4" fontWeight="bold">
                {issuers.filter(i => i.kybProfile?.verificationStatus === 'APPROVED').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">Verified Issuers</Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: 'warning.main', mx: 'auto', mb: 2 }}>
                <WarningIcon />
              </Avatar>
              <Typography variant="h4" fontWeight="bold">
                {issuers.filter(i => i.kybProfile?.verificationStatus === 'PENDING').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">Pending Review</Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: 'info.main', mx: 'auto', mb: 2 }}>
                <AssetsIcon />
              </Avatar>
              <Typography variant="h4" fontWeight="bold">
                {issuers.reduce((sum, i) => sum + (i.issuedAssets?.length || 0), 0)}
              </Typography>
              <Typography variant="body2" color="text.secondary">Total Assets</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters and Actions */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="between" alignItems="center">
            <Typography variant="h6">Issuer Directory</Typography>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Filter Issuers</InputLabel>
              <Select
                value={filter}
                label="Filter Issuers"
                onChange={(e) => setFilter(e.target.value)}
              >
                <MenuItem value="all">All Issuers</MenuItem>
                <MenuItem value="verified">Verified Only</MenuItem>
                <MenuItem value="pending">Pending Review</MenuItem>
                <MenuItem value="suspended">Suspended</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </CardContent>
      </Card>

      {/* Issuer Table */}
      <Card elevation={2}>
        <CardContent>
          <TableContainer component={Paper} elevation={0}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Issuer</TableCell>
                  <TableCell>Verification</TableCell>
                  <TableCell>Assets Issued</TableCell>
                  <TableCell>Total Value</TableCell>
                  <TableCell>Investments</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredIssuers.map((issuer) => {
                  const verification = getVerificationStatus(issuer);
                  const stats = getIssuerStats(issuer);
                  
                  return (
                    <TableRow key={issuer.id}>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <Avatar sx={{ mr: 2, bgcolor: 'primary.light' }}>
                            <BusinessIcon />
                          </Avatar>
                          <Box>
                            <Typography variant="body1" fontWeight="medium">
                              {issuer.kybProfile?.companyName || `${issuer.firstName} ${issuer.lastName}`}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {issuer.email}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              ID: {issuer.id} • Joined: {new Date(issuer.createdAt).toLocaleDateString()}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      
                      <TableCell>
                        <Chip
                          label={verification.label}
                          color={verification.color}
                          size="small"
                          icon={verification.status === 'APPROVED' ? <VerifiedIcon /> : <WarningIcon />}
                        />
                      </TableCell>
                      
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <AssetsIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                          <Typography variant="body2" fontWeight="medium">
                            {stats.assets}
                          </Typography>
                        </Box>
                      </TableCell>
                      
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <RevenueIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                          <Typography variant="body2" fontWeight="medium">
                            ${stats.totalValue.toLocaleString()}
                          </Typography>
                        </Box>
                      </TableCell>
                      
                      <TableCell>
                        <Typography variant="body2">
                          {stats.investments} investments
                        </Typography>
                      </TableCell>
                      
                      <TableCell>
                        <Chip
                          label={issuer.isActive ? 'Active' : 'Suspended'}
                          color={issuer.isActive ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                      
                      <TableCell>
                        <Box display="flex" gap={1}>
                          <Tooltip title="View Details">
                            <IconButton size="small" onClick={() => setSelectedIssuer(issuer)}>
                              <ViewIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          
                          {verification.status === 'PENDING' && (
                            <Tooltip title="Approve KYB">
                              <IconButton 
                                size="small" 
                                color="success"
                                onClick={() => handleStatusChange(issuer.id, 'APPROVED')}
                              >
                                <ApproveIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          
                          <Tooltip title="Edit Issuer">
                            <IconButton size="small" color="primary">
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          
                          <Tooltip title={issuer.isActive ? 'Suspend' : 'Activate'}>
                            <IconButton 
                              size="small" 
                              color={issuer.isActive ? 'error' : 'success'}
                              onClick={() => handleStatusChange(issuer.id, issuer.isActive ? 'SUSPEND' : 'ACTIVATE')}
                            >
                              <SuspendIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
          
          {filteredIssuers.length === 0 && (
            <Box textAlign="center" py={4}>
              <Typography color="text.secondary">
                No issuers found for the selected filter.
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default IssuerManagement; 