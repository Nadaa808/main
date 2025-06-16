import React from 'react';
import { Card, CardContent, Typography, Box, Grid, Avatar } from '@mui/material';
import { MonetizationOn, TrendingUp, Assessment, AccountBalance } from '@mui/icons-material';

const RevenueManagement = ({ users, stats }) => {
  const totalRevenue = users.reduce((sum, user) => 
    sum + (user.investments?.reduce((invSum, inv) => 
      invSum + (parseFloat(inv.amount) * 0.025), 0) || 0), 0); // 2.5% platform fee

  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Revenue & Fee Management
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Track platform revenue, transaction fees, and financial performance
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: 'success.main', mx: 'auto', mb: 2 }}>
                <MonetizationOn />
              </Avatar>
              <Typography variant="h4" fontWeight="bold">${totalRevenue.toLocaleString()}</Typography>
              <Typography variant="body2" color="text.secondary">Total Revenue</Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: 'primary.main', mx: 'auto', mb: 2 }}>
                <TrendingUp />
              </Avatar>
              <Typography variant="h4" fontWeight="bold">2.5%</Typography>
              <Typography variant="body2" color="text.secondary">Platform Fee</Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: 'info.main', mx: 'auto', mb: 2 }}>
                <Assessment />
              </Avatar>
              <Typography variant="h4" fontWeight="bold">+15%</Typography>
              <Typography variant="body2" color="text.secondary">Monthly Growth</Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: 'secondary.main', mx: 'auto', mb: 2 }}>
                <AccountBalance />
              </Avatar>
              <Typography variant="h4" fontWeight="bold">${(totalRevenue * 0.8).toLocaleString()}</Typography>
              <Typography variant="body2" color="text.secondary">Net Profit</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Revenue Analytics</Typography>
          <Typography variant="body2" color="text.secondary">
            Comprehensive revenue tracking including transaction fees, 
            subscription revenue, premium features, and detailed financial analytics.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default RevenueManagement; 