import React from 'react';
import { Card, CardContent, Typography, Box, Grid, Avatar } from '@mui/material';
import { Token as TokenIcon, TrendingUp, Security, AccountBalance } from '@mui/icons-material';

const TokenManagement = ({ users }) => {
  const tokens = users.flatMap(user => 
    user.issuedAssets?.map(asset => ({ ...asset, issuer: user })) || []
  );

  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Token Management
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Manage token contracts, minting, burning, and blockchain operations
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: 'primary.main', mx: 'auto', mb: 2 }}>
                <TokenIcon />
              </Avatar>
              <Typography variant="h4" fontWeight="bold">{tokens.length}</Typography>
              <Typography variant="body2" color="text.secondary">Total Tokens</Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: 'success.main', mx: 'auto', mb: 2 }}>
                <TrendingUp />
              </Avatar>
              <Typography variant="h4" fontWeight="bold">
                {tokens.filter(t => t.status === 'TRADING').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">Active Trading</Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: 'info.main', mx: 'auto', mb: 2 }}>
                <Security />
              </Avatar>
              <Typography variant="h4" fontWeight="bold">100%</Typography>
              <Typography variant="body2" color="text.secondary">Security Score</Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: 'secondary.main', mx: 'auto', mb: 2 }}>
                <AccountBalance />
              </Avatar>
              <Typography variant="h4" fontWeight="bold">ETH</Typography>
              <Typography variant="body2" color="text.secondary">Primary Chain</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Token Operations</Typography>
          <Typography variant="body2" color="text.secondary">
            Advanced token management features including smart contract deployment, 
            token minting/burning, compliance monitoring, and cross-chain operations 
            will be implemented here.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default TokenManagement; 