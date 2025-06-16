import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';

const DIDManagement = ({ users }) => {
  const dids = users.flatMap(user => 
    user.didProfiles?.map(did => ({ ...did, user })) || []
  );

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>DID Management</Typography>
        <Typography variant="body2">
          Total DIDs: {dids.length}
        </Typography>
        <Box mt={2}>
          <Typography variant="body2" color="text.secondary">
            Detailed DID management interface will be implemented here.
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default DIDManagement; 