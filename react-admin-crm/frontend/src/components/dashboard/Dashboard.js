import React, { useState, useEffect } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Chip,
  CssBaseline,
  ThemeProvider,
  createTheme,
  useTheme,
  alpha,
  Switch,
  FormControlLabel,
  Tooltip
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  Logout as LogoutIcon,
  VerifiedUser as KYCIcon,
  AccountBalanceWallet as WalletIcon,
  Security as DIDIcon,
  Token as TokenIcon,
  TrendingUp as InvestmentIcon,
  Business as IssuerIcon,
  PersonPin as InvestorIcon,
  Gavel as ComplianceIcon,
  MonetizationOn as RevenueIcon,
  Assessment as AnalyticsIcon,
  Shield as SecurityIcon,
  Article as ReportIcon,
  SwapHoriz as TransactionIcon,
  AccountBalance as AssetIcon,
  LightMode as LightModeIcon,
  DarkMode as DarkModeIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import DashboardOverview from './DashboardOverview';
import AdminDashboard from '../admin/AdminDashboard';

const drawerWidth = 320;

const createAppTheme = (darkMode) => createTheme({
  palette: {
    mode: darkMode ? 'dark' : 'light',
    primary: {
      main: '#667eea',
      light: '#98a7f0',
      dark: '#4a5dc7'
    },
    secondary: {
      main: '#764ba2',
      light: '#9d7bc4',
      dark: '#5a3680'
    },
    background: {
      default: darkMode ? '#0a0e27' : '#f8fafc',
      paper: darkMode ? '#1a1f3a' : '#ffffff'
    },
    text: {
      primary: darkMode ? '#ffffff' : '#1a1a1a',
      secondary: darkMode ? '#b0b0b0' : '#666666'
    }
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h3: {
      fontWeight: 800,
      letterSpacing: '-0.01em'
    },
    h4: {
      fontWeight: 700,
      letterSpacing: '-0.01em'
    },
    h5: {
      fontWeight: 600
    },
    h6: {
      fontWeight: 600
    }
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: darkMode 
            ? '0 4px 20px rgba(0,0,0,0.3)' 
            : '0 4px 20px rgba(0,0,0,0.08)',
          background: darkMode ? '#1a1f3a' : '#ffffff'
        }
      }
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          background: darkMode 
            ? 'linear-gradient(180deg, #1a1f3a 0%, #0f1419 100%)'
            : 'linear-gradient(180deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          borderRight: 'none'
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: darkMode 
            ? 'rgba(26, 31, 58, 0.9)' 
            : 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(20px)',
          boxShadow: darkMode 
            ? '0 1px 20px rgba(0,0,0,0.3)' 
            : '0 1px 20px rgba(0,0,0,0.08)',
          borderBottom: darkMode 
            ? '1px solid rgba(255,255,255,0.1)' 
            : '1px solid rgba(255,255,255,0.2)'
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          background: darkMode ? '#1a1f3a' : '#ffffff'
        }
      }
    }
  },
});

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [selectedPage, setSelectedPage] = useState('dashboard');
  const [anchorEl, setAnchorEl] = useState(null);
  const [darkMode, setDarkMode] = useState(() => {
    // Get theme preference from localStorage
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  const theme = createAppTheme(darkMode);

  // Save theme preference to localStorage
  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  const handleThemeToggle = () => {
    setDarkMode(!darkMode);
  };

  // Comprehensive RWA Tokenization Platform Admin Navigation
  const navigationItems = [
    // Main Dashboard
    { id: 'dashboard', label: 'Platform Overview', icon: <DashboardIcon />, type: 'main' },
    
    // Core User Management
    { id: 'admin-overview', label: 'Admin Statistics', icon: <AnalyticsIcon />, type: 'admin', tab: 0 },
    { id: 'admin-users', label: 'All Users', icon: <PeopleIcon />, type: 'admin', tab: 1 },
    
    // RWA Platform Specific Management
    { id: 'admin-issuers', label: 'Issuer Management', icon: <IssuerIcon />, type: 'admin', tab: 2 },
    { id: 'admin-investors', label: 'Investor Management', icon: <InvestorIcon />, type: 'admin', tab: 3 },
    { id: 'admin-assets', label: 'Asset Tokenization', icon: <AssetIcon />, type: 'admin', tab: 4 },
    { id: 'admin-tokens', label: 'Token Management', icon: <TokenIcon />, type: 'admin', tab: 5 },
    
    // Compliance & Verification
    { id: 'admin-kyc', label: 'KYC/KYB Verification', icon: <KYCIcon />, type: 'admin', tab: 6 },
    { id: 'admin-compliance', label: 'Compliance Center', icon: <ComplianceIcon />, type: 'admin', tab: 7 },
    { id: 'admin-reports', label: 'Regulatory Reports', icon: <ReportIcon />, type: 'admin', tab: 8 },
    
    // Financial & Transaction Management
    { id: 'admin-investments', label: 'Investment Tracking', icon: <InvestmentIcon />, type: 'admin', tab: 9 },
    { id: 'admin-transactions', label: 'Transaction Monitor', icon: <TransactionIcon />, type: 'admin', tab: 10 },
    { id: 'admin-revenue', label: 'Revenue & Fees', icon: <RevenueIcon />, type: 'admin', tab: 11 },
    
    // Technical Management
    { id: 'admin-wallets', label: 'Wallet Management', icon: <WalletIcon />, type: 'admin', tab: 12 },
    { id: 'admin-dids', label: 'Digital Identity', icon: <DIDIcon />, type: 'admin', tab: 13 },
    { id: 'admin-security', label: 'Security & Risk', icon: <SecurityIcon />, type: 'admin', tab: 14 },
    
    // Settings
    { id: 'settings', label: 'Platform Settings', icon: <SettingsIcon />, type: 'main' }
  ];

  const handleNavigation = (item) => {
    if (item.type === 'admin') {
      setSelectedPage(`admin-${item.tab}`);
    } else {
      setSelectedPage(item.id);
    }
  };

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleProfileMenuClose();
  };

  const getCurrentPageTitle = () => {
    const currentItem = navigationItems.find(item => 
      item.id === selectedPage || 
      (selectedPage.startsWith('admin-') && item.id === selectedPage)
    );
    return currentItem?.label || 'Platform Overview';
  };

  const getCurrentAdminTab = () => {
    if (selectedPage.startsWith('admin-')) {
      const tabMatch = selectedPage.match(/admin-(\d+)/);
      return tabMatch ? parseInt(tabMatch[1]) : 0;
    }
    return 0;
  };

  const renderPageContent = () => {
    if (selectedPage === 'dashboard') {
      return <DashboardOverview />;
    } else if (selectedPage.startsWith('admin-')) {
      return <AdminDashboard currentTab={getCurrentAdminTab()} />;
    } else {
      return (
        <Box>
          <Typography variant="h4" gutterBottom fontWeight="bold">
            {getCurrentPageTitle()}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Content for {selectedPage} will be implemented here.
          </Typography>
        </Box>
      );
    }
  };

  // Group navigation items for better organization
  const getNavigationGroups = () => [
    {
      title: 'Dashboard',
      items: navigationItems.filter(item => item.type === 'main' && item.id === 'dashboard')
    },
    {
      title: 'User Management',
      items: navigationItems.filter(item => 
        ['admin-overview', 'admin-users', 'admin-issuers', 'admin-investors'].includes(item.id)
      )
    },
    {
      title: 'Asset & Token Management',
      items: navigationItems.filter(item => 
        ['admin-assets', 'admin-tokens', 'admin-investments'].includes(item.id)
      )
    },
    {
      title: 'Compliance & Security',
      items: navigationItems.filter(item => 
        ['admin-kyc', 'admin-compliance', 'admin-reports', 'admin-security'].includes(item.id)
      )
    },
    {
      title: 'Financial Operations',
      items: navigationItems.filter(item => 
        ['admin-transactions', 'admin-revenue'].includes(item.id)
      )
    },
    {
      title: 'Technical Infrastructure',
      items: navigationItems.filter(item => 
        ['admin-wallets', 'admin-dids'].includes(item.id)
      )
    },
    {
      title: 'Settings',
      items: navigationItems.filter(item => item.type === 'main' && item.id === 'settings')
    }
  ];

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ display: 'flex' }}>
        <CssBaseline />
        
        {/* App Bar */}
        <AppBar
          position="fixed"
          sx={{
            width: `calc(100% - ${drawerWidth}px)`,
            ml: `${drawerWidth}px`,
            color: 'text.primary'
          }}
        >
          <Toolbar sx={{ minHeight: '80px !important', px: 4 }}>
            <Box>
              <Typography variant="h4" component="div" fontWeight="800" color="text.primary">
                {getCurrentPageTitle()}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </Typography>
            </Box>

            <Box sx={{ flexGrow: 1 }} />

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {/* Theme Toggle */}
              <Tooltip title={`Switch to ${darkMode ? 'Light' : 'Dark'} Mode`}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    background: alpha(theme.palette.primary.main, 0.1),
                    borderRadius: 3,
                    px: 1.5,
                    py: 0.5,
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
                  }}
                >
                  <LightModeIcon 
                    sx={{ 
                      fontSize: 20, 
                      mr: 1, 
                      color: !darkMode ? theme.palette.primary.main : theme.palette.text.secondary,
                      opacity: !darkMode ? 1 : 0.5
                    }} 
                  />
                  <Switch
                    checked={darkMode}
                    onChange={handleThemeToggle}
                    size="small"
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': {
                        color: theme.palette.primary.main,
                      },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                        backgroundColor: theme.palette.primary.main,
                      },
                    }}
                  />
                  <DarkModeIcon 
                    sx={{ 
                      fontSize: 20, 
                      ml: 1, 
                      color: darkMode ? theme.palette.primary.main : theme.palette.text.secondary,
                      opacity: darkMode ? 1 : 0.5
                    }} 
                  />
                </Box>
              </Tooltip>

              <IconButton 
                sx={{ 
                  background: alpha(theme.palette.primary.main, 0.1),
                  '&:hover': { background: alpha(theme.palette.primary.main, 0.2) }
                }}
              >
                <Badge badgeContent={4} color="error">
                  <NotificationsIcon color="primary" />
                </Badge>
              </IconButton>

              <IconButton onClick={handleProfileMenuOpen} sx={{ p: 0 }}>
                <Avatar 
                  sx={{ 
                    background: darkMode 
                      ? 'linear-gradient(135deg, #4a5dc7 0%, #5a3680 100%)'
                      : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    width: 48, 
                    height: 48,
                    border: `3px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                    boxShadow: theme.shadows[4]
                  }}
                >
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </Avatar>
              </IconButton>
            </Box>
          </Toolbar>
        </AppBar>

        {/* Profile Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleProfileMenuClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          PaperProps={{
            sx: {
              borderRadius: 3,
              mt: 1,
              boxShadow: theme.shadows[8],
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
            }
          }}
        >
          <Box sx={{ px: 3, py: 2, borderBottom: 1, borderColor: 'divider', minWidth: 260 }}>
            <Typography variant="h6" fontWeight="700">
              {user?.firstName} {user?.lastName}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {user?.email}
            </Typography>
            <Chip 
              label={`${user?.role} • PLATFORM ADMIN`} 
              size="small" 
              sx={{ 
                background: darkMode 
                  ? 'linear-gradient(135deg, #4a5dc7 0%, #5a3680 100%)'
                  : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '0.75rem'
              }} 
            />
          </Box>
          
          {/* Theme Toggle in Menu */}
          <MenuItem sx={{ py: 1.5, px: 3 }}>
            <ListItemIcon>
              {darkMode ? <DarkModeIcon fontSize="small" /> : <LightModeIcon fontSize="small" />}
            </ListItemIcon>
            <FormControlLabel
              control={
                <Switch
                  checked={darkMode}
                  onChange={handleThemeToggle}
                  size="small"
                />
              }
              label={
                <Typography variant="body1" fontWeight="500">
                  {darkMode ? 'Dark Mode' : 'Light Mode'}
                </Typography>
              }
              sx={{ m: 0 }}
            />
          </MenuItem>
          
          <MenuItem 
            onClick={() => { setSelectedPage('settings'); handleProfileMenuClose(); }}
            sx={{ py: 1.5, px: 3 }}
          >
            <ListItemIcon><SettingsIcon fontSize="small" /></ListItemIcon>
            <Typography variant="body1" fontWeight="500">Settings</Typography>
          </MenuItem>
          <MenuItem onClick={handleLogout} sx={{ py: 1.5, px: 3 }}>
            <ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>
            <Typography variant="body1" fontWeight="500">Logout</Typography>
          </MenuItem>
        </Menu>

        {/* Sidebar */}
        <Drawer
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              boxSizing: 'border-box',
            }
          }}
          variant="permanent"
          anchor="left"
        >
          {/* Sidebar Header */}
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Box>
              <Typography 
                variant="h4" 
                component="div" 
                fontWeight="900" 
                gutterBottom
                sx={{ 
                  background: 'linear-gradient(135deg, rgba(255,255,255,1) 0%, rgba(255,255,255,0.8) 100%)',
                  backgroundClip: 'text',
                  textFillColor: 'transparent',
                  letterSpacing: '-0.02em'
                }}
              >
                RWA Portal
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9, fontWeight: 300 }}>
                Real World Asset Tokenization Platform
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ bgcolor: 'rgba(255,255,255,0.2)', mx: 2 }} />

          {/* Grouped Navigation */}
          <Box sx={{ overflowY: 'auto', flex: 1, px: 2, pb: 2 }}>
            {getNavigationGroups().map((group, groupIndex) => (
              <Box sx={{ mt: 3 }} key={groupIndex}>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    px: 2, 
                    py: 1, 
                    display: 'block',
                    opacity: 0.8,
                    fontWeight: 'bold',
                    fontSize: '0.75rem',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase'
                  }}
                >
                  {group.title}
                </Typography>
                <List sx={{ py: 0.5 }}>
                  {group.items.map((item) => (
                    <ListItem key={item.id} disablePadding sx={{ mb: 0.5 }}>
                      <ListItemButton
                        selected={
                          selectedPage === item.id || 
                          (selectedPage.startsWith('admin-') && item.id === selectedPage)
                        }
                        onClick={() => handleNavigation(item)}
                        sx={{
                          borderRadius: 2,
                          mx: 1,
                          '&.Mui-selected': {
                            bgcolor: 'rgba(255,255,255,0.25)',
                            backdropFilter: 'blur(10px)',
                            '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
                          },
                          '&:hover': { 
                            bgcolor: 'rgba(255,255,255,0.15)',
                            transform: 'translateX(4px)',
                            transition: 'all 0.2s ease'
                          },
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <ListItemIcon sx={{ color: 'white', minWidth: 40 }}>
                          {item.icon}
                        </ListItemIcon>
                        <ListItemText 
                          primary={item.label} 
                          primaryTypographyProps={{ 
                            fontWeight: 500,
                            fontSize: '0.875rem'
                          }}
                        />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              </Box>
            ))}
          </Box>
        </Drawer>

        {/* Main Content */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 4,
            mt: 10,
            background: darkMode 
              ? 'linear-gradient(135deg, #0a0e27 0%, #1a1f3a 100%)'
              : 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
            minHeight: '100vh'
          }}
        >
          {renderPageContent()}
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default Dashboard; 