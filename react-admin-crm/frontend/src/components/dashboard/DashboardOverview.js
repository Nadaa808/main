import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Paper,
  Avatar,
  LinearProgress
} from '@mui/material';
import {
  TrendingUp,
  People,
  AdminPanelSettings,
  Security,
  VerifiedUser
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

const StatCard = ({ title, value, subtitle, icon, color, progress }) => (
  <Card elevation={3} sx={{ height: '100%' }}>
    <CardContent>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Box>
          <Typography variant="h4" component="div" fontWeight="bold">
            {value}
          </Typography>
          <Typography variant="h6" color="text.primary">
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        </Box>
        <Avatar sx={{ bgcolor: color, width: 56, height: 56 }}>
          {icon}
        </Avatar>
      </Box>
      {progress !== undefined && (
        <Box>
          <LinearProgress 
            variant="determinate" 
            value={progress} 
            sx={{ height: 8, borderRadius: 1 }}
          />
          <Typography variant="caption" color="text.secondary" mt={1}>
            {progress}% of target
          </Typography>
        </Box>
      )}
    </CardContent>
  </Card>
);

const DashboardOverview = () => {
  const { user } = useAuth();

  const adminStats = [
    {
      title: 'Total Users',
      value: '24',
      subtitle: '+3 new this month',
      icon: <People />,
      color: '#1976d2',
      progress: 75
    },
    {
      title: 'Active Admins',
      value: '8',
      subtitle: 'Currently online',
      icon: <AdminPanelSettings />,
      color: '#2e7d32',
      progress: 62
    },
    {
      title: 'System Health',
      value: '98.5%',
      subtitle: 'Uptime this month',
      icon: <TrendingUp />,
      color: '#ed6c02',
      progress: 98
    },
    {
      title: 'Security Score',
      value: '95%',
      subtitle: 'All systems secure',
      icon: <Security />,
      color: '#9c27b0',
      progress: 95
    }
  ];

  const recentActivities = [
    {
      id: 1,
      title: 'New Admin User Created',
      description: 'John Smith was added as an admin user',
      time: '2 hours ago',
      type: 'user'
    },
    {
      id: 2,
      title: 'System Update',
      description: 'Database backup completed successfully',
      time: '4 hours ago',
      type: 'system'
    },
    {
      id: 3,
      title: 'Security Check',
      description: 'Weekly security scan completed - no issues found',
      time: '6 hours ago',
      type: 'security'
    },
    {
      id: 4,
      title: 'User Login',
      description: 'Admin user Sarah Connor logged in',
      time: '1 day ago',
      type: 'login'
    }
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Welcome back, {user?.firstName}!
      </Typography>
      
      <Typography variant="body1" color="text.secondary" mb={4}>
        Here's what's happening with your react-admin-crm system today.
      </Typography>

      {/* Statistics Cards */}
      <Grid container spacing={3} mb={4}>
        {adminStats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <StatCard {...stat} />
          </Grid>
        ))}
      </Grid>

      {/* Recent Activities */}
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom fontWeight="bold">
          Recent Activities
        </Typography>
        
        <Box>
          {recentActivities.map((activity) => (
            <Box 
              key={activity.id}
              display="flex" 
              alignItems="center" 
              py={2}
              borderBottom="1px solid #e0e0e0"
              sx={{ '&:last-child': { borderBottom: 'none' } }}
            >
              <Avatar 
                sx={{ 
                  bgcolor: activity.type === 'user' ? '#1976d2' : 
                          activity.type === 'system' ? '#2e7d32' :
                          activity.type === 'security' ? '#d32f2f' : '#9c27b0',
                  mr: 2 
                }}
              >
                {activity.type === 'user' ? <People /> :
                 activity.type === 'system' ? <AdminPanelSettings /> :
                 activity.type === 'security' ? <Security /> : <VerifiedUser />}
              </Avatar>
              
              <Box flexGrow={1}>
                <Typography variant="subtitle1" fontWeight="medium">
                  {activity.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {activity.description}
                </Typography>
              </Box>
              
              <Typography variant="caption" color="text.secondary">
                {activity.time}
              </Typography>
            </Box>
          ))}
        </Box>
      </Paper>

      {/* Quick Actions */}
      <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
        <Typography variant="h5" gutterBottom fontWeight="bold">
          Quick Actions
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item>
            <Card sx={{ p: 2, cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}>
              <Box display="flex" alignItems="center">
                <People sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="body2">Manage Users</Typography>
              </Box>
            </Card>
          </Grid>
          
          <Grid item>
            <Card sx={{ p: 2, cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}>
              <Box display="flex" alignItems="center">
                <AdminPanelSettings sx={{ mr: 1, color: 'success.main' }} />
                <Typography variant="body2">System Settings</Typography>
              </Box>
            </Card>
          </Grid>
          
          <Grid item>
            <Card sx={{ p: 2, cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}>
              <Box display="flex" alignItems="center">
                <Security sx={{ mr: 1, color: 'warning.main' }} />
                <Typography variant="body2">Security Center</Typography>
              </Box>
            </Card>
          </Grid>
          
          <Grid item>
            <Card sx={{ p: 2, cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}>
              <Box display="flex" alignItems="center">
                <TrendingUp sx={{ mr: 1, color: 'info.main' }} />
                <Typography variant="body2">View Reports</Typography>
              </Box>
            </Card>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default DashboardOverview; 