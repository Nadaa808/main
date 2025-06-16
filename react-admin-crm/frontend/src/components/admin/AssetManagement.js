import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';

const AssetManagement = ({ users }) => {
  const assets = users.flatMap(user => 
    user.issuedAssets?.map(asset => ({ ...asset, issuer: user })) || []
  );

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>Asset Management</Typography>
        <Typography variant="body2">
          Total Assets: {assets.length}
        </Typography>
        <Box mt={2}>
          <Typography variant="body2" color="text.secondary">
            Detailed asset management interface will be implemented here.
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default AssetManagement; 