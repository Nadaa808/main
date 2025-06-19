import React from 'react';
import { Card, CardContent, Typography, Box, Grid, Avatar } from '@mui/material';
import { SwapHoriz, TrendingUp, Security, MonetizationOn } from '@mui/icons-material';

const TransactionMonitor = ({ users }) => {
  const transactions = users.flatMap(user => user.investments || []);
  const totalVolume = transactions.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Transaction Monitor
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Real-time monitoring of all platform transactions and trading activity
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: 'primary.main', mx: 'auto', mb: 2 }}>
                <SwapHoriz />
              </Avatar>
              <Typography variant="h4" fontWeight="bold">{transactions.length}</Typography>
              <Typography variant="body2" color="text.secondary">Total Transactions</Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: 'success.main', mx: 'auto', mb: 2 }}>
                <MonetizationOn />
              </Avatar>
              <Typography variant="h4" fontWeight="bold">${totalVolume.toLocaleString()}</Typography>
              <Typography variant="body2" color="text.secondary">Total Volume</Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: 'info.main', mx: 'auto', mb: 2 }}>
                <TrendingUp />
              </Avatar>
              <Typography variant="h4" fontWeight="bold">24h</Typography>
              <Typography variant="body2" color="text.secondary">Active Period</Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: 'warning.main', mx: 'auto', mb: 2 }}>
                <Security />
              </Avatar>
              <Typography variant="h4" fontWeight="bold">0</Typography>
              <Typography variant="body2" color="text.secondary">Flagged Transactions</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Live Transaction Feed</Typography>
          <Typography variant="body2" color="text.secondary">
            Real-time transaction monitoring dashboard with fraud detection, 
            AML screening, and automated compliance checks will be implemented here.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default TransactionMonitor; 