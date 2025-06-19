import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';

const WalletManagement = ({ users }) => {
  const wallets = users.flatMap(user => 
    user.wallets?.map(wallet => ({ ...wallet, user })) || []
  );

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>Wallet Management</Typography>
        <Typography variant="body2">
          Total Wallets: {wallets.length}
        </Typography>
        <Box mt={2}>
          <Typography variant="body2" color="text.secondary">
            Detailed wallet management interface will be implemented here.
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default WalletManagement; 