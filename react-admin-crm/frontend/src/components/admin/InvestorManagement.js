import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  Avatar,
  Chip,
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
  Person as PersonIcon,
  AccountBalance as PortfolioIcon,
  TrendingUp as InvestmentIcon,
  MonetizationOn as ValueIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  VerifiedUser as VerifiedIcon,
  Warning as WarningIcon
} from '@mui/icons-material';

const InvestorManagement = ({ users }) => {
  const [filter, setFilter] = useState('all');

  const investors = users || [];
  
  const filteredInvestors = investors.filter(investor => {
    if (filter === 'verified') return investor.kycProfile?.verificationStatus === 'APPROVED';
    if (filter === 'pending') return investor.kycProfile?.verificationStatus === 'PENDING';
    if (filter === 'active') return investor.investments?.length > 0;
    if (filter === 'inactive') return !investor.investments?.length;
    return true;
  });

  const getVerificationStatus = (investor) => {
    if (!investor.kycProfile) return { status: 'NO_KYC', color: 'error', label: 'No KYC' };
    const status = investor.kycProfile.verificationStatus;
    const colors = {
      PENDING: 'warning',
      IN_REVIEW: 'info',
      APPROVED: 'success', 
      REJECTED: 'error'
    };
    return { status, color: colors[status] || 'default', label: status };
  };

  const getInvestorStats = (investor) => {
    const investments = investor.investments?.length || 0;
    const totalInvested = investor.investments?.reduce((sum, inv) => 
      sum + (parseFloat(inv.amount) || 0), 0) || 0;
    const portfolioAssets = investor.investments?.reduce((assets, inv) => {
      if (!assets.includes(inv.assetId)) assets.push(inv.assetId);
      return assets;
    }, []).length || 0;
    
    return { investments, totalInvested, portfolioAssets };
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Investor Management
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Monitor investor activity, verify compliance, and track investment portfolios
      </Typography>

      {/* Investor Statistics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: 'success.main', mx: 'auto', mb: 2 }}>
                <PersonIcon />
              </Avatar>
              <Typography variant="h4" fontWeight="bold">{investors.length}</Typography>
              <Typography variant="body2" color="text.secondary">Total Investors</Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: 'primary.main', mx: 'auto', mb: 2 }}>
                <VerifiedIcon />
              </Avatar>
              <Typography variant="h4" fontWeight="bold">
                {investors.filter(i => i.kycProfile?.verificationStatus === 'APPROVED').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">Verified KYC</Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: 'info.main', mx: 'auto', mb: 2 }}>
                <InvestmentIcon />
              </Avatar>
              <Typography variant="h4" fontWeight="bold">
                {investors.filter(i => i.investments?.length > 0).length}
              </Typography>
              <Typography variant="body2" color="text.secondary">Active Investors</Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: 'secondary.main', mx: 'auto', mb: 2 }}>
                <ValueIcon />
              </Avatar>
              <Typography variant="h4" fontWeight="bold">
                ${investors.reduce((sum, i) => 
                  sum + (i.investments?.reduce((invSum, inv) => 
                    invSum + (parseFloat(inv.amount) || 0), 0) || 0), 0
                ).toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">Total Invested</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Investor Directory</Typography>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Filter Investors</InputLabel>
              <Select
                value={filter}
                label="Filter Investors"
                onChange={(e) => setFilter(e.target.value)}
              >
                <MenuItem value="all">All Investors</MenuItem>
                <MenuItem value="verified">Verified KYC</MenuItem>
                <MenuItem value="pending">Pending KYC</MenuItem>
                <MenuItem value="active">Active Investors</MenuItem>
                <MenuItem value="inactive">No Investments</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </CardContent>
      </Card>

      {/* Investor Table */}
      <Card elevation={2}>
        <CardContent>
          <TableContainer component={Paper} elevation={0}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Investor</TableCell>
                  <TableCell>KYC Status</TableCell>
                  <TableCell>Investments</TableCell>
                  <TableCell>Portfolio Value</TableCell>
                  <TableCell>Assets</TableCell>
                  <TableCell>Last Activity</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredInvestors.map((investor) => {
                  const verification = getVerificationStatus(investor);
                  const stats = getInvestorStats(investor);
                  const lastInvestment = investor.investments?.sort((a, b) => 
                    new Date(b.investedAt) - new Date(a.investedAt)
                  )?.[0];
                  
                  return (
                    <TableRow key={investor.id}>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <Avatar sx={{ mr: 2, bgcolor: 'success.light' }}>
                            <PersonIcon />
                          </Avatar>
                          <Box>
                            <Typography variant="body1" fontWeight="medium">
                              {investor.firstName} {investor.lastName}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {investor.email}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              ID: {investor.id} • Joined: {new Date(investor.createdAt).toLocaleDateString()}
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
                          <InvestmentIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                          <Typography variant="body2" fontWeight="medium">
                            {stats.investments}
                          </Typography>
                        </Box>
                      </TableCell>
                      
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <ValueIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                          <Typography variant="body2" fontWeight="medium">
                            ${stats.totalInvested.toLocaleString()}
                          </Typography>
                        </Box>
                      </TableCell>
                      
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <PortfolioIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                          <Typography variant="body2">
                            {stats.portfolioAssets} assets
                          </Typography>
                        </Box>
                      </TableCell>
                      
                      <TableCell>
                        <Typography variant="body2">
                          {lastInvestment 
                            ? new Date(lastInvestment.investedAt).toLocaleDateString()
                            : 'No activity'
                          }
                        </Typography>
                      </TableCell>
                      
                      <TableCell>
                        <Box display="flex" gap={1}>
                          <Tooltip title="View Portfolio">
                            <IconButton size="small">
                              <ViewIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          
                          <Tooltip title="Edit Investor">
                            <IconButton size="small" color="primary">
                              <EditIcon fontSize="small" />
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
          
          {filteredInvestors.length === 0 && (
            <Box textAlign="center" py={4}>
              <Typography color="text.secondary">
                No investors found for the selected filter.
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default InvestorManagement; 