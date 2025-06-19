import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';

const InvestmentManagement = ({ users }) => {
  const investments = users.flatMap(user => 
    user.investments?.map(investment => ({ ...investment, investor: user })) || []
  );

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>Investment Management</Typography>
        <Typography variant="body2">
          Total Investments: {investments.length}
        </Typography>
        <Box mt={2}>
          <Typography variant="body2" color="text.secondary">
            Detailed investment management interface will be implemented here.
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default InvestmentManagement; 