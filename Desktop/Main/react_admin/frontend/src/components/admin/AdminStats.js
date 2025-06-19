import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  Avatar,
  LinearProgress,
  Chip,
  Paper,
  useTheme,
  alpha
} from '@mui/material';
import {
  TrendingUp,
  People,
  VerifiedUser,
  AccountBalanceWallet,
  Security,
  Token,
  TrendingDown,
  AttachMoney,
  Assessment,
  Business,
  PersonPin,
  Gavel
} from '@mui/icons-material';

const AdminStats = ({ stats, users }) => {
  const theme = useTheme();

  const getGradient = (color1, color2) => 
    `linear-gradient(135deg, ${color1} 0%, ${color2} 100%)`;

  const cardStyle = {
    background: 'rgba(255, 255, 255, 0.9)',
    backdropFilter: 'blur(20px)',
    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
    borderRadius: 3,
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    '&:hover': {
      transform: 'translateY(-8px)',
      boxShadow: theme.shadows[20],
      background: 'rgba(255, 255, 255, 0.95)',
    }
  };

  const gradientCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: <People />,
      gradient: getGradient('#667eea', '#764ba2'),
      growth: '+12%',
      subtitle: 'Active platform members'
    },
    {
      title: 'Verified Users',
      value: stats.totalKYC,
      icon: <VerifiedUser />,
      gradient: getGradient('#f093fb', '#f5576c'),
      growth: '+8%',
      subtitle: 'KYC/KYB verified'
    },
    {
      title: 'Active Wallets',
      value: stats.totalWallets,
      icon: <AccountBalanceWallet />,
      gradient: getGradient('#4facfe', '#00f2fe'),
      growth: '+15%',
      subtitle: 'Connected wallets'
    },
    {
      title: 'Digital Identities',
      value: stats.totalDIDs,
      icon: <Security />,
      gradient: getGradient('#43e97b', '#38f9d7'),
      growth: '+22%',
      subtitle: 'DID profiles created'
    }
  ];

  const assetMetrics = [
    {
      title: 'Total Assets',
      value: stats.totalAssets,
      icon: <Token />,
      color: 'primary',
      description: 'Tokenized assets'
    },
    {
      title: 'Active Investments',
      value: stats.totalInvestments,
      icon: <TrendingUp />,
      color: 'success',
      description: 'Investment positions'
    },
    {
      title: 'Platform Revenue',
      value: `$${(stats.totalInvestments * 1250).toLocaleString()}`,
      icon: <AttachMoney />,
      color: 'warning',
      description: 'Total earnings'
    },
    {
      title: 'Compliance Rate',
      value: `${Math.round((stats.totalKYC / stats.totalUsers) * 100)}%`,
      icon: <Gavel />,
      color: 'info',
      description: 'Regulatory compliance'
    }
  ];

  const userBreakdown = {
    issuers: users.filter(u => u.userType === 'ISSUER').length,
    investors: users.filter(u => u.userType === 'INVESTOR').length,
    admins: users.filter(u => u.role === 'ADMIN').length
  };

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography 
          variant="h3" 
          fontWeight="800" 
          sx={{ 
            background: getGradient('#667eea', '#764ba2'),
            backgroundClip: 'text',
            textFillColor: 'transparent',
            mb: 1
          }}
        >
          Platform Analytics
        </Typography>
        <Typography variant="h6" color="text.secondary" fontWeight="300">
          Real-time insights into your RWA tokenization platform
        </Typography>
      </Box>

      {/* Main Metrics - Gradient Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {gradientCards.map((card, index) => (
          <Grid item xs={12} sm={6} lg={3} key={card.title}>
            <Card sx={{ ...cardStyle, position: 'relative', overflow: 'visible' }}>
              <Box
                sx={{
                  position: 'absolute',
                  top: -20,
                  left: 20,
                  width: 60,
                  height: 60,
                  borderRadius: 3,
                  background: card.gradient,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  boxShadow: theme.shadows[8]
                }}
              >
                {card.icon}
              </Box>
              <CardContent sx={{ pt: 5, pb: 3 }}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                  <Box>
                    <Typography variant="h3" fontWeight="700" color="text.primary">
                      {card.value.toLocaleString()}
                    </Typography>
                    <Typography variant="h6" fontWeight="600" color="text.primary" gutterBottom>
                      {card.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {card.subtitle}
                    </Typography>
                  </Box>
                  <Chip
                    label={card.growth}
                    size="small"
                    sx={{
                      background: getGradient('#43e97b', '#38f9d7'),
                      color: 'white',
                      fontWeight: 'bold'
                    }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Secondary Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {assetMetrics.map((metric, index) => (
          <Grid item xs={12} sm={6} md={3} key={metric.title}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 3,
                background: `linear-gradient(135deg, ${alpha(theme.palette[metric.color].main, 0.1)} 0%, ${alpha(theme.palette[metric.color].main, 0.05)} 100%)`,
                border: `1px solid ${alpha(theme.palette[metric.color].main, 0.2)}`,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  background: `linear-gradient(135deg, ${alpha(theme.palette[metric.color].main, 0.15)} 0%, ${alpha(theme.palette[metric.color].main, 0.08)} 100%)`,
                }
              }}
            >
              <Box display="flex" alignItems="center" sx={{ mb: 2 }}>
                <Avatar
                  sx={{
                    bgcolor: theme.palette[metric.color].main,
                    mr: 2,
                    width: 48,
                    height: 48
                  }}
                >
                  {metric.icon}
                </Avatar>
                <Box>
                  <Typography variant="h5" fontWeight="700">
                    {metric.value}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {metric.description}
                  </Typography>
                </Box>
              </Box>
              <Typography variant="h6" fontWeight="600" color={`${metric.color}.main`}>
                {metric.title}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* User Type Breakdown */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card sx={cardStyle}>
            <CardContent>
              <Box display="flex" alignItems="center" sx={{ mb: 3 }}>
                <Avatar
                  sx={{
                    background: getGradient('#667eea', '#764ba2'),
                    mr: 2,
                    width: 56,
                    height: 56
                  }}
                >
                  <Assessment />
                </Avatar>
                <Box>
                  <Typography variant="h5" fontWeight="700">
                    User Distribution
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Platform user type breakdown
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                  <Box display="flex" alignItems="center">
                    <Business sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="body1" fontWeight="600">Issuers</Typography>
                  </Box>
                  <Typography variant="h6" fontWeight="700" color="primary.main">
                    {userBreakdown.issuers}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={(userBreakdown.issuers / stats.totalUsers) * 100}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 4,
                      background: getGradient('#667eea', '#764ba2')
                    }
                  }}
                />
              </Box>

              <Box sx={{ mb: 2 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                  <Box display="flex" alignItems="center">
                    <PersonPin sx={{ mr: 1, color: 'success.main' }} />
                    <Typography variant="body1" fontWeight="600">Investors</Typography>
                  </Box>
                  <Typography variant="h6" fontWeight="700" color="success.main">
                    {userBreakdown.investors}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={(userBreakdown.investors / stats.totalUsers) * 100}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    bgcolor: alpha(theme.palette.success.main, 0.1),
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 4,
                      background: getGradient('#43e97b', '#38f9d7')
                    }
                  }}
                />
              </Box>

              <Box>
                <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                  <Box display="flex" alignItems="center">
                    <Security sx={{ mr: 1, color: 'warning.main' }} />
                    <Typography variant="body1" fontWeight="600">Administrators</Typography>
                  </Box>
                  <Typography variant="h6" fontWeight="700" color="warning.main">
                    {userBreakdown.admins}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={(userBreakdown.admins / stats.totalUsers) * 100}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    bgcolor: alpha(theme.palette.warning.main, 0.1),
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 4,
                      background: getGradient('#f093fb', '#f5576c')
                    }
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={cardStyle}>
            <CardContent>
              <Box display="flex" alignItems="center" sx={{ mb: 3 }}>
                <Avatar
                  sx={{
                    background: getGradient('#4facfe', '#00f2fe'),
                    mr: 2,
                    width: 56,
                    height: 56
                  }}
                >
                  <TrendingUp />
                </Avatar>
                <Box>
                  <Typography variant="h5" fontWeight="700">
                    Platform Health
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    System performance metrics
                  </Typography>
                </Box>
              </Box>

              <Box display="flex" flexDirection="column" gap={2}>
                <Box>
                  <Typography variant="body1" fontWeight="600" gutterBottom>
                    System Uptime
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={99.5}
                    sx={{
                      height: 6,
                      borderRadius: 3,
                      bgcolor: alpha(theme.palette.success.main, 0.1),
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 3,
                        bgcolor: 'success.main'
                      }
                    }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    99.5% uptime
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="body1" fontWeight="600" gutterBottom>
                    Security Score
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={95}
                    sx={{
                      height: 6,
                      borderRadius: 3,
                      bgcolor: alpha(theme.palette.info.main, 0.1),
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 3,
                        bgcolor: 'info.main'
                      }
                    }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    95% security rating
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="body1" fontWeight="600" gutterBottom>
                    Compliance Rating
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={98}
                    sx={{
                      height: 6,
                      borderRadius: 3,
                      bgcolor: alpha(theme.palette.warning.main, 0.1),
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 3,
                        bgcolor: 'warning.main'
                      }
                    }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    98% compliance score
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminStats; 