import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Chip,
  Divider,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  AccountBalanceWallet as WalletIcon,
  Security as SecurityIcon,
  Token as TokenIcon,
  TrendingUp as InvestmentIcon,
  VerifiedUser as VerifiedIcon
} from '@mui/icons-material';

const UserDetailModal = ({ open, user, onClose }) => {
  if (!user) return null;

  const getVerificationStatusColor = (status) => {
    const colors = {
      PENDING: 'warning',
      IN_REVIEW: 'info',
      APPROVED: 'success',
      REJECTED: 'error',
      EXPIRED: 'default'
    };
    return colors[status] || 'default';
  };

  const getStatusColor = (status) => {
    const colors = {
      ACTIVE: 'success',
      REVOKED: 'error',
      EXPIRED: 'warning',
      SUSPENDED: 'default'
    };
    return colors[status] || 'default';
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center">
          <Avatar sx={{ mr: 2 }}>
            {user.firstName?.[0]}{user.lastName?.[0]}
          </Avatar>
          <Box>
            <Typography variant="h6">
              {user.firstName} {user.lastName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {user.email} • {user.userType || 'INVESTOR'}
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Grid container spacing={3}>
          {/* Basic Information */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Basic Information
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2"><strong>ID:</strong> {user.id}</Typography>
                  <Typography variant="body2"><strong>Email:</strong> {user.email}</Typography>
                  <Typography variant="body2"><strong>Role:</strong> {user.role}</Typography>
                  <Typography variant="body2"><strong>User Type:</strong> {user.userType || 'INVESTOR'}</Typography>
                  <Typography variant="body2"><strong>Status:</strong> 
                    <Chip 
                      label={user.isActive ? 'Active' : 'Inactive'} 
                      color={user.isActive ? 'success' : 'error'}
                      size="small"
                      sx={{ ml: 1 }}
                    />
                  </Typography>
                  <Typography variant="body2"><strong>Created:</strong> {new Date(user.createdAt).toLocaleString()}</Typography>
                  <Typography variant="body2"><strong>Updated:</strong> {new Date(user.updatedAt).toLocaleString()}</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* KYC/KYB Information */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Verification Status
                </Typography>
                <Box sx={{ mt: 2 }}>
                  {user.kycProfile ? (
                    <Box sx={{ mb: 2 }}>
                      <Box display="flex" alignItems="center" sx={{ mb: 1 }}>
                        <PersonIcon sx={{ mr: 1 }} />
                        <Typography variant="body2" fontWeight="medium">KYC Profile</Typography>
                        <Chip
                          label={user.kycProfile.verificationStatus}
                          color={getVerificationStatusColor(user.kycProfile.verificationStatus)}
                          size="small"
                          sx={{ ml: 'auto' }}
                        />
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        Verified: {user.kycProfile.verifiedAt ? new Date(user.kycProfile.verifiedAt).toLocaleDateString() : 'Not verified'}
                      </Typography>
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">No KYC profile</Typography>
                  )}

                  {user.kybProfile ? (
                    <Box>
                      <Box display="flex" alignItems="center" sx={{ mb: 1 }}>
                        <BusinessIcon sx={{ mr: 1 }} />
                        <Typography variant="body2" fontWeight="medium">KYB Profile</Typography>
                        <Chip
                          label={user.kybProfile.verificationStatus}
                          color={getVerificationStatusColor(user.kybProfile.verificationStatus)}
                          size="small"
                          sx={{ ml: 'auto' }}
                        />
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        Company: {user.kybProfile.companyName}
                      </Typography>
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">No KYB profile</Typography>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Detailed Accordions */}
          <Grid item xs={12}>
            {/* Wallets */}
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <WalletIcon sx={{ mr: 1 }} />
                <Typography>Wallets ({user.wallets?.length || 0})</Typography>
              </AccordionSummary>
              <AccordionDetails>
                {user.wallets?.length > 0 ? (
                  <List>
                    {user.wallets.map((wallet, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <WalletIcon />
                        </ListItemIcon>
                        <ListItemText
                          primary={`${wallet.walletType} Wallet`}
                          secondary={`${wallet.address} • ${wallet.blockchain} • ${wallet.isActive ? 'Active' : 'Inactive'}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography color="text.secondary">No wallets found</Typography>
                )}
              </AccordionDetails>
            </Accordion>

            {/* DIDs */}
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <SecurityIcon sx={{ mr: 1 }} />
                <Typography>Decentralized IDs ({user.didProfiles?.length || 0})</Typography>
              </AccordionSummary>
              <AccordionDetails>
                {user.didProfiles?.length > 0 ? (
                  <List>
                    {user.didProfiles.map((did, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <SecurityIcon />
                        </ListItemIcon>
                        <ListItemText
                          primary={`${did.didMethod} DID`}
                          secondary={`${did.didId} • ${did.isActive ? 'Active' : 'Inactive'}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography color="text.secondary">No DIDs found</Typography>
                )}
              </AccordionDetails>
            </Accordion>

            {/* Verifiable Credentials */}
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <VerifiedIcon sx={{ mr: 1 }} />
                <Typography>Verifiable Credentials ({user.verifiableCredentials?.length || 0})</Typography>
              </AccordionSummary>
              <AccordionDetails>
                {user.verifiableCredentials?.length > 0 ? (
                  <List>
                    {user.verifiableCredentials.map((vc, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <VerifiedIcon />
                        </ListItemIcon>
                        <ListItemText
                          primary={vc.credentialType}
                          secondary={
                            <Box>
                              <Typography variant="caption">
                                Issuer: {vc.issuer} • Status: 
                                <Chip 
                                  label={vc.status} 
                                  color={getStatusColor(vc.status)}
                                  size="small"
                                  sx={{ ml: 0.5 }}
                                />
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography color="text.secondary">No credentials found</Typography>
                )}
              </AccordionDetails>
            </Accordion>

            {/* Soulbound Tokens */}
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <TokenIcon sx={{ mr: 1 }} />
                <Typography>Soulbound Tokens ({user.soulboundTokens?.length || 0})</Typography>
              </AccordionSummary>
              <AccordionDetails>
                {user.soulboundTokens?.length > 0 ? (
                  <List>
                    {user.soulboundTokens.map((sbt, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <TokenIcon />
                        </ListItemIcon>
                        <ListItemText
                          primary={sbt.tokenType}
                          secondary={`${sbt.tokenId} • ${sbt.blockchain}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography color="text.secondary">No soulbound tokens found</Typography>
                )}
              </AccordionDetails>
            </Accordion>

            {/* Assets (for Issuers) */}
            {user.userType === 'ISSUER' && (
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <TokenIcon sx={{ mr: 1 }} />
                  <Typography>Issued Assets ({user.issuedAssets?.length || 0})</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  {user.issuedAssets?.length > 0 ? (
                    <List>
                      {user.issuedAssets.map((asset, index) => (
                        <ListItem key={index}>
                          <ListItemIcon>
                            <TokenIcon />
                          </ListItemIcon>
                          <ListItemText
                            primary={`${asset.name} (${asset.symbol})`}
                            secondary={`${asset.assetType} • Status: ${asset.status}`}
                          />
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Typography color="text.secondary">No assets issued</Typography>
                  )}
                </AccordionDetails>
              </Accordion>
            )}

            {/* Investments (for Investors) */}
            {user.userType === 'INVESTOR' && (
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <InvestmentIcon sx={{ mr: 1 }} />
                  <Typography>Investments ({user.investments?.length || 0})</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  {user.investments?.length > 0 ? (
                    <List>
                      {user.investments.map((investment, index) => (
                        <ListItem key={index}>
                          <ListItemIcon>
                            <InvestmentIcon />
                          </ListItemIcon>
                          <ListItemText
                            primary={`${investment.amount} ${investment.currency}`}
                            secondary={`Status: ${investment.status} • Asset ID: ${investment.assetId}`}
                          />
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Typography color="text.secondary">No investments found</Typography>
                  )}
                </AccordionDetails>
              </Accordion>
            )}
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default UserDetailModal; 