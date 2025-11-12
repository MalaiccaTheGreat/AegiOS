import React, { useState, useEffect } from 'react';
import { useRoute, useLocation } from 'wouter';
import { 
  Box, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  CardHeader, 
  Button, 
  Divider, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText,
  Paper,
  Tabs,
  Tab,
  useTheme,
  useMediaQuery,
  IconButton,
  Menu,
  MenuItem
} from '@mui/material';
import {
  AccountBalance as AccountBalanceIcon,
  Assessment as AssessmentIcon,
  Receipt as ReceiptIcon,
  ShowChart as ShowChartIcon,
  AccountTree as AccountTreeIcon,
  Settings as SettingsIcon,
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AccountBalanceWallet as AccountBalanceWalletIcon,
  AttachMoney as AttachMoneyIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  CompareArrows as ReconciliationIcon,
  Calculate as TaxIcon,
  Timeline as TrendsIcon,
  Notifications as AlertsIcon,
  ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';
import { useApi } from '../../hooks/useApi';
import { toast } from 'sonner';

// Sample data - in a real app, this would come from the API
const quickStats = [
  { label: 'Total Revenue', value: '$125,430', change: '+12%', isPositive: true },
  { label: 'Total Expenses', value: '$89,210', change: '+5%', isNegative: true },
  { label: 'Net Income', value: '$36,220', change: '+8%', isPositive: true },
  { label: 'Unreconciled', value: '12', isWarning: true },
];

const recentTransactions = [
  { id: 1, date: '2023-06-15', description: 'Office Supplies', amount: 1250.50, type: 'expense', account: 'Office Expenses' },
  { id: 2, date: '2023-06-14', description: 'Client Payment', amount: 5000.00, type: 'income', account: 'Accounts Receivable' },
  { id: 3, date: '2023-06-12', description: 'Monthly Rent', amount: 2500.00, type: 'expense', account: 'Rent Expense' },
  { id: 4, date: '2023-06-10', description: 'Consulting Services', amount: 3200.00, type: 'income', account: 'Service Revenue' },
];

const AccountingDashboard: React.FC = () => {
  const [match, params] = useRoute('/business/:businessId/accounting');
  const businessId = params?.businessId;
  const [location, navigate] = useLocation();
  const api = useApi();
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    const fetchData = async () => {
      try {
        // In a real app, you would fetch data for the dashboard here
        // const response = await api.get(`/api/accounting/summary/${businessId}`);
        // setDashboardData(response.data);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching accounting data:', error);
        setIsLoading(false);
      }
    };

    fetchData();
  }, [businessId, api]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const navigateTo = (path: string) => {
    navigate(`/business/${businessId}/accounting/${path}`);
  };

  if (isLoading) {
    return <div>Loading accounting dashboard...</div>;
  }

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Accounting Dashboard
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<AddIcon />}
          onClick={() => navigateTo('new-transaction')}
        >
          New Transaction
        </Button>
      </Box>

      {/* Quick Stats */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {quickStats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card elevation={2}>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  {stat.label}
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h5" component="div">
                    {stat.value}
                  </Typography>
                  {stat.change && (
                    <Typography 
                      variant="body2" 
                      color={stat.isPositive ? 'success.main' : stat.isNegative ? 'error.main' : 'warning.main'}
                      sx={{ fontWeight: 'bold' }}
                    >
                      {stat.change}
                    </Typography>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {/* Main Content */}
        <Grid item xs={12} md={8}>
          <Card elevation={2} sx={{ mb: 3 }}>
            <CardHeader 
              title="Financial Overview" 
              action={
                <Button 
                  size="small" 
                  endIcon={<ArrowForwardIcon />}
                  onClick={() => navigateTo('reports')}
                >
                  View All Reports
                </Button>
              } 
            />
            <Divider />
            <CardContent>
              <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography color="textSecondary">
                  Financial charts and graphs would be displayed here
                </Typography>
              </Box>
            </CardContent>
          </Card>

          <Card elevation={2}>
            <CardHeader 
              title="Recent Transactions" 
              action={
                <Button 
                  size="small" 
                  endIcon={<ArrowForwardIcon />}
                  onClick={() => navigateTo('transactions')}
                >
                  View All
                </Button>
              } 
            />
            <Divider />
            <List>
              {recentTransactions.map((tx) => (
                <React.Fragment key={tx.id}>
                  <ListItem 
                    button 
                    onClick={() => navigateTo(`transactions/${tx.id}`)}
                    sx={{ '&:hover': { backgroundColor: 'action.hover' } }}
                  >
                    <ListItemIcon>
                      {tx.type === 'income' ? (
                        <ReceiptIcon color="primary" />
                      ) : (
                        <ReceiptIcon color="secondary" />
                      )}
                    </ListItemIcon>
                    <ListItemText 
                      primary={tx.description} 
                      secondary={`${tx.date} • ${tx.account}`} 
                    />
                    <Typography 
                      variant="body1" 
                      color={tx.type === 'income' ? 'success.main' : 'error.main'}
                      sx={{ fontWeight: 500 }}
                    >
                      {tx.type === 'income' ? '+' : '-'}${tx.amount.toLocaleString()}
                    </Typography>
                  </ListItem>
                  <Divider component="li" />
                </React.Fragment>
              ))}
            </List>
          </Card>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          <Card elevation={2} sx={{ mb: 3 }}>
            <CardHeader title="Quick Actions" />
            <Divider />
            <List>
              <ListItem button onClick={() => navigateTo('new-transaction')}>
                <ListItemIcon>
                  <AddIcon color="primary" />
                </ListItemIcon>
                <ListItemText primary="Record Transaction" />
              </ListItem>
              <Divider component="li" />
              <ListItem button onClick={() => navigateTo('reconciliation')}>
                <ListItemIcon>
                  <ReconciliationIcon color="primary" />
                </ListItemIcon>
                <ListItemText 
                  primary="Reconcile Accounts" 
                  secondary="12 transactions need attention" 
                  secondaryTypographyProps={{ color: 'error.main' }}
                />
              </ListItem>
              <Divider component="li" />
              <ListItem button onClick={() => navigateTo('reports/income-statement')}>
                <ListItemIcon>
                  <AssessmentIcon color="primary" />
                </ListItemIcon>
                <ListItemText primary="Generate Reports" />
              </ListItem>
              <Divider component="li" />
              <ListItem button onClick={() => navigateTo('tax')}>
                <ListItemIcon>
                  <TaxIcon color="primary" />
                </ListItemIcon>
                <ListItemText primary="Tax Center" secondary="Quarterly filing due in 14 days" />
              </ListItem>
            </List>
          </Card>

          <Card elevation={2}>
            <CardHeader title="AI Insights" />
            <Divider />
            <CardContent>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="primary" gutterBottom>
                  <TrendsIcon color="primary" sx={{ verticalAlign: 'middle', mr: 1 }} />
                  Spending Trends
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Your office supplies expense is 15% higher than last month.
                </Typography>
              </Box>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="primary" gutterBottom>
                  <AlertsIcon color="warning" sx={{ verticalAlign: 'middle', mr: 1 }} />
                  Alerts
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  You have 3 tax deductions you might be missing.
                </Typography>
              </Box>
              <Button 
                variant="outlined" 
                size="small" 
                fullWidth 
                sx={{ mt: 1 }}
                onClick={() => navigateTo('ai-insights')}
              >
                View All Insights
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AccountingDashboard;
