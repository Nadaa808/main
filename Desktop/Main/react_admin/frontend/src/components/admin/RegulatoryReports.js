import React from 'react';
import { Card, CardContent, Typography, Box, Grid, Avatar, Button, List, ListItem, ListItemText } from '@mui/material';
import { Article, Download, Schedule, Assessment } from '@mui/icons-material';

const RegulatoryReports = ({ users, stats }) => {
  const reports = [
    { name: 'Monthly KYC Compliance Report', due: '2024-01-31', status: 'Ready' },
    { name: 'Quarterly Asset Performance', due: '2024-03-31', status: 'In Progress' },
    { name: 'Annual AML Report', due: '2024-12-31', status: 'Pending' },
    { name: 'Transaction Monitoring Report', due: '2024-01-15', status: 'Ready' }
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Regulatory Reports
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Generate compliance reports for regulatory authorities and internal audits
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: 'success.main', mx: 'auto', mb: 2 }}>
                <Article />
              </Avatar>
              <Typography variant="h4" fontWeight="bold">{reports.length}</Typography>
              <Typography variant="body2" color="text.secondary">Total Reports</Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: 'primary.main', mx: 'auto', mb: 2 }}>
                <Download />
              </Avatar>
              <Typography variant="h4" fontWeight="bold">
                {reports.filter(r => r.status === 'Ready').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">Ready to Download</Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: 'warning.main', mx: 'auto', mb: 2 }}>
                <Schedule />
              </Avatar>
              <Typography variant="h4" fontWeight="bold">
                {reports.filter(r => r.status === 'In Progress').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">In Progress</Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: 'info.main', mx: 'auto', mb: 2 }}>
                <Assessment />
              </Avatar>
              <Typography variant="h4" fontWeight="bold">100%</Typography>
              <Typography variant="body2" color="text.secondary">Compliance Rate</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Available Reports</Typography>
          <List>
            {reports.map((report, index) => (
              <ListItem key={index} sx={{ border: 1, borderColor: 'divider', mb: 1, borderRadius: 1 }}>
                <ListItemText
                  primary={report.name}
                  secondary={`Due: ${report.due} • Status: ${report.status}`}
                />
                {report.status === 'Ready' && (
                  <Button variant="outlined" startIcon={<Download />}>
                    Download
                  </Button>
                )}
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>
    </Box>
  );
};

export default RegulatoryReports; 