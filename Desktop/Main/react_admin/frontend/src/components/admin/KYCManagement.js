import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  Box,
  Avatar,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import {
  Person as PersonIcon,
  Business as BusinessIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon
} from '@mui/icons-material';

const KYCManagement = ({ users }) => {
  const [filter, setFilter] = useState('all');

  const usersWithKYC = users.filter(user => user.kycProfile || user.kybProfile);

  const filteredUsers = usersWithKYC.filter(user => {
    if (filter === 'pending') {
      return (user.kycProfile?.verificationStatus === 'PENDING') || 
             (user.kybProfile?.verificationStatus === 'PENDING');
    }
    if (filter === 'approved') {
      return (user.kycProfile?.verificationStatus === 'APPROVED') || 
             (user.kybProfile?.verificationStatus === 'APPROVED');
    }
    if (filter === 'rejected') {
      return (user.kycProfile?.verificationStatus === 'REJECTED') || 
             (user.kybProfile?.verificationStatus === 'REJECTED');
    }
    return true;
  });

  const getStatusColor = (status) => {
    const colors = {
      PENDING: 'warning',
      IN_REVIEW: 'info',
      APPROVED: 'success',
      REJECTED: 'error',
      EXPIRED: 'default'
    };
    return colors[status] || 'default';
  };

  const handleStatusChange = (userId, type, status) => {
    // TODO: Implement status update API call
    console.log(`Update ${type} status for user ${userId} to ${status}`);
  };

  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h6">KYC/KYB Management</Typography>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Filter</InputLabel>
            <Select
              value={filter}
              label="Filter"
              onChange={(e) => setFilter(e.target.value)}
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="approved">Approved</MenuItem>
              <MenuItem value="rejected">Rejected</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>User</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Submitted</TableCell>
                <TableCell>Verified By</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredUsers.map((user) => (
                <React.Fragment key={user.id}>
                  {user.kycProfile && (
                    <TableRow>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <Avatar sx={{ mr: 2 }}>
                            <PersonIcon />
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {user.firstName} {user.lastName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {user.email}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip label="KYC" color="info" size="small" />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={user.kycProfile.verificationStatus}
                          color={getStatusColor(user.kycProfile.verificationStatus)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {new Date(user.kycProfile.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {user.kycProfile.verifiedBy || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Box display="flex" gap={1}>
                          <Button
                            size="small"
                            color="success"
                            startIcon={<ApproveIcon />}
                            onClick={() => handleStatusChange(user.id, 'kyc', 'APPROVED')}
                            disabled={user.kycProfile.verificationStatus === 'APPROVED'}
                          >
                            Approve
                          </Button>
                          <Button
                            size="small"
                            color="error"
                            startIcon={<RejectIcon />}
                            onClick={() => handleStatusChange(user.id, 'kyc', 'REJECTED')}
                            disabled={user.kycProfile.verificationStatus === 'REJECTED'}
                          >
                            Reject
                          </Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                  )}
                  {user.kybProfile && (
                    <TableRow>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <Avatar sx={{ mr: 2 }}>
                            <BusinessIcon />
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {user.kybProfile.companyName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {user.email}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip label="KYB" color="secondary" size="small" />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={user.kybProfile.verificationStatus}
                          color={getStatusColor(user.kybProfile.verificationStatus)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {new Date(user.kybProfile.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {user.kybProfile.verifiedBy || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Box display="flex" gap={1}>
                          <Button
                            size="small"
                            color="success"
                            startIcon={<ApproveIcon />}
                            onClick={() => handleStatusChange(user.id, 'kyb', 'APPROVED')}
                            disabled={user.kybProfile.verificationStatus === 'APPROVED'}
                          >
                            Approve
                          </Button>
                          <Button
                            size="small"
                            color="error"
                            startIcon={<RejectIcon />}
                            onClick={() => handleStatusChange(user.id, 'kyb', 'REJECTED')}
                            disabled={user.kybProfile.verificationStatus === 'REJECTED'}
                          >
                            Reject
                          </Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {filteredUsers.length === 0 && (
          <Box textAlign="center" py={4}>
            <Typography color="text.secondary">
              No KYC/KYB profiles found for the selected filter.
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default KYCManagement; 