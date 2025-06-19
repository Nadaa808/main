import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Alert
} from '@mui/material';
import UsersList from './UsersList';
import UserDetailModal from './UserDetailModal';
import KYCManagement from './KYCManagement';
import WalletManagement from './WalletManagement';
import DIDManagement from './DIDManagement';
import AssetManagement from './AssetManagement';
import InvestmentManagement from './InvestmentManagement';
import AdminStats from './AdminStats';
// New RWA Platform Components
import IssuerManagement from './IssuerManagement';
import InvestorManagement from './InvestorManagement';
import TokenManagement from './TokenManagement';
import ComplianceCenter from './ComplianceCenter';
import RegulatoryReports from './RegulatoryReports';
import TransactionMonitor from './TransactionMonitor';
import RevenueManagement from './RevenueManagement';
import SecurityCenter from './SecurityCenter';
import { adminAPI } from '../../services/api';

const AdminDashboard = ({ currentTab = 0, onTabChange }) => {
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalKYC: 0,
    totalWallets: 0,
    totalDIDs: 0,
    totalAssets: 0,
    totalInvestments: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch users with all relations using the new adminAPI
      const usersResponse = await adminAPI.getUsersFull();
      setUsers(usersResponse.data);
      
      // Calculate stats from real data
      const totalUsers = usersResponse.data.length;
      const totalKYC = usersResponse.data.filter(u => u.kycProfile || u.kybProfile).length;
      const totalWallets = usersResponse.data.reduce((sum, u) => sum + (u.wallets?.length || 0), 0);
      const totalDIDs = usersResponse.data.reduce((sum, u) => sum + (u.didProfiles?.length || 0), 0);
      const totalAssets = usersResponse.data.reduce((sum, u) => sum + (u.issuedAssets?.length || 0), 0);
      const totalInvestments = usersResponse.data.reduce((sum, u) => sum + (u.investments?.length || 0), 0);
      
      setStats({
        totalUsers,
        totalKYC,
        totalWallets,
        totalDIDs,
        totalAssets,
        totalInvestments
      });
    } catch (error) {
      console.error('Failed to fetch admin data:', error);
      setError('Failed to load admin data. Please check if you are logged in and have admin permissions.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewUser = (user) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const handleEditUser = (user) => {
    // TODO: Implement user editing
    console.log('Edit user:', user);
  };

  const handleDeleteUser = (user) => {
    // TODO: Implement user deletion
    console.log('Delete user:', user);
  };

  if (loading) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          Loading Platform Data...
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Fetching RWA platform analytics and user data...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          RWA Admin Dashboard
        </Typography>
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      </Box>
    );
  }

  const renderTabContent = () => {
    switch (currentTab) {
      case 0: // Admin Statistics
        return <AdminStats stats={stats} users={users} />;
      
      case 1: // All Users
        return (
          <UsersList
            onViewUser={handleViewUser}
            onEditUser={handleEditUser}
            onDeleteUser={handleDeleteUser}
          />
        );
      
      case 2: // Issuer Management
        return <IssuerManagement users={users.filter(u => u.userType === 'ISSUER')} />;
      
      case 3: // Investor Management
        return <InvestorManagement users={users.filter(u => u.userType === 'INVESTOR')} />;
      
      case 4: // Asset Tokenization
        return <AssetManagement users={users} />;
      
      case 5: // Token Management
        return <TokenManagement users={users} />;
      
      case 6: // KYC/KYB Verification
        return <KYCManagement users={users} />;
      
      case 7: // Compliance Center
        return <ComplianceCenter users={users} />;
      
      case 8: // Regulatory Reports
        return <RegulatoryReports users={users} stats={stats} />;
      
      case 9: // Investment Tracking
        return <InvestmentManagement users={users} />;
      
      case 10: // Transaction Monitor
        return <TransactionMonitor users={users} />;
      
      case 11: // Revenue & Fees
        return <RevenueManagement users={users} stats={stats} />;
      
      case 12: // Wallet Management
        return <WalletManagement users={users} />;
      
      case 13: // Digital Identity
        return <DIDManagement users={users} />;
      
      case 14: // Security & Risk
        return <SecurityCenter users={users} stats={stats} />;
      
      default:
        return <AdminStats stats={stats} users={users} />;
    }
  };

  return (
    <Box>
      {/* Tab Content */}
      <Box>
        {renderTabContent()}
      </Box>

      {/* User Detail Modal */}
      <UserDetailModal
        open={showUserModal}
        user={selectedUser}
        onClose={() => {
          setShowUserModal(false);
          setSelectedUser(null);
        }}
      />
    </Box>
  );
};

export default AdminDashboard; 