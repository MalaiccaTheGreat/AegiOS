import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useApi } from '../../hooks/useApi';
import { format } from 'date-fns';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Card, 
  CardContent, 
  CardHeader, 
  Divider, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemAvatar, 
  Avatar, 
  IconButton, 
  Badge, 
  Chip, 
  Button, 
  TextField, 
  InputAdornment, 
  MenuItem, 
  Select, 
  FormControl, 
  InputLabel, 
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  useTheme,
  useMediaQuery,
  Tabs,
  Tab,
  Skeleton
} from '@mui/material';
import { 
  Email as EmailIcon, 
  Refresh as RefreshIcon, 
  Search as SearchIcon, 
  FilterList as FilterListIcon, 
  CheckCircle as CheckCircleIcon, 
  Error as ErrorIcon, 
  Warning as WarningIcon, 
  Info as InfoIcon,
  Send as SendIcon,
  Archive as ArchiveIcon,
  Delete as DeleteIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Label as LabelIcon,
  LabelImportant as LabelImportantIcon,
  MoreVert as MoreVertIcon,
  Add as AddIcon,
  PlayArrow as PlayArrowIcon,
  Stop as StopIcon,
  Settings as SettingsIcon,
  BarChart as BarChartIcon,
  Timeline as TimelineIcon,
  PieChart as PieChartIcon,
  Notifications as NotificationsIcon,
  Email as EmailInboxIcon,
  Inbox as InboxIcon,
  Send as SentIcon,
  Drafts as DraftsIcon,
  Delete as TrashIcon,
  Star as StarredIcon,
  Schedule as SnoozedIcon,
  Label as LabeledIcon,
  Report as ReportIcon,
  Forum as ForumIcon,
  Group as GroupIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  LocalOffer as TagIcon,
  Category as CategoryIcon,
  Assessment as AssessmentIcon,
  Dashboard as DashboardIcon,
  Email as EmailDashboardIcon,
  MarkEmailUnread as UnreadIcon,
  MarkEmailRead as ReadIcon,
  Reply as ReplyIcon,
  ReplyAll as ReplyAllIcon,
  Forward as ForwardIcon,
  DeleteForever as DeleteForeverIcon,
  CreateNewFolder as CreateFolderIcon,
  ReportProblem as ReportProblemIcon,
  Block as BlockIcon,
  Flag as FlagIcon,
  AddTask as AddTaskIcon,
  ScheduleSend as ScheduleSendIcon,
  InsertDriveFile as AttachmentIcon,
  InsertLink as LinkIcon,
  InsertPhoto as ImageIcon,
  InsertEmoticon as EmoticonIcon,
  FormatBold as FormatBoldIcon,
  FormatItalic as FormatItalicIcon,
  FormatUnderlined as FormatUnderlinedIcon,
  FormatListBulleted as FormatListBulletedIcon,
  FormatListNumbered as FormatListNumberedIcon,
  FormatQuote as FormatQuoteIcon,
  Code as CodeIcon,
  Link as InsertLinkIcon,
  Image as InsertImageIcon,
  AttachFile as AttachFileIcon,
  MoreVert as MoreVertMenuIcon,
  ExpandMore as ExpandMoreIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon,
  KeyboardArrowLeft as KeyboardArrowLeftIcon,
  KeyboardArrowRight as KeyboardArrowRightIcon,
  FirstPage as FirstPageIcon,
  LastPage as LastPageIcon,
  Close as CloseIcon,
  Check as CheckIcon,
  Clear as ClearIcon,
  Done as DoneIcon,
  AddCircle as AddCircleIcon,
  RemoveCircle as RemoveCircleIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  ArrowDropDown as ArrowDropDownIcon,
  ArrowDropUp as ArrowDropUpIcon,
  ArrowLeft as ArrowLeftIcon,
  ArrowRight as ArrowRightIcon,
  ArrowBackIos as ArrowBackIosIcon,
  ArrowForwardIos as ArrowForwardIosIcon,
  ArrowUpward as ArrowUpwardIcon2,
  ArrowDownward as ArrowDownwardIcon2,
  ArrowBack as ArrowBackIcon2,
  ArrowForward as ArrowForwardIcon2,
  ArrowDropDown as ArrowDropDownIcon2,
  ArrowDropUp as ArrowDropUpIcon2,
  ArrowLeft as ArrowLeftIcon2,
  ArrowRight as ArrowRightIcon2,
  ArrowBackIos as ArrowBackIosIcon2,
  ArrowForwardIos as ArrowForwardIosIcon2,
  Menu as MenuIcon,
  MenuOpen as MenuOpenIcon,
  MoreHoriz as MoreHorizIcon,
  MoreVert as MoreVertIcon2,
  Refresh as RefreshIcon2,
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon2,
  Cancel as CancelIcon,
  CheckCircle as CheckCircleIcon2,
  Warning as WarningIcon2,
  Error as ErrorIcon2,
  Info as InfoIcon2,
  Notifications as NotificationsIcon2,
  NotificationsActive as NotificationsActiveIcon,
  NotificationsNone as NotificationsNoneIcon,
  NotificationsOff as NotificationsOffIcon,
  AccountCircle as AccountCircleIcon,
  ExitToApp as ExitToAppIcon,
  Settings as SettingsIcon2,
  Help as HelpIcon,
  Info as InfoIcon3,
  Search as SearchIcon2,
  Home as HomeIcon,
  Dashboard as DashboardIcon2,
  People as PeopleIcon,
  Person as PersonIcon2,
  Group as GroupIcon2,
  Business as BusinessIcon2,
  Store as StoreIcon,
  ShoppingCart as ShoppingCartIcon,
  Assessment as AssessmentIcon2,
  PieChart as PieChartIcon2,
  Timeline as TimelineIcon2,
  BarChart as BarChartIcon2,
  ShowChart as ShowChartIcon,
  InsertChart as InsertChartIcon,
  InsertChartOutlined as InsertChartOutlinedIcon,
  AttachMoney as AttachMoneyIcon,
  Euro as EuroIcon,
  MonetizationOn as MonetizationOnIcon,
  CreditCard as CreditCardIcon,
  AccountBalance as AccountBalanceIcon,
  AccountBalanceWallet as AccountBalanceWalletIcon,
  Receipt as ReceiptIcon,
  ReceiptLong as ReceiptLongIcon,
  Description as DescriptionIcon,
  Note as NoteIcon,
  NoteAdd as NoteAddIcon,
  Create as CreateIcon,
  Edit as EditIcon,
  Delete as DeleteIcon2,
  Save as SaveIcon,
  Add as AddIcon2,
  Remove as RemoveIcon,
  Clear as ClearIcon2,
  Check as CheckIcon2,
  Close as CloseIcon2,
  ExpandMore as ExpandMoreIcon3,
  ExpandLess as ExpandLessIcon2,
  MoreVert as MoreVertIcon3,
  MoreHoriz as MoreHorizIcon2,
  ArrowBack as ArrowBackIcon3,
  ArrowForward as ArrowForwardIcon3,
  ArrowDropDown as ArrowDropDownIcon3,
  ArrowDropUp as ArrowDropUpIcon3,
  ArrowLeft as ArrowLeftIcon3,
  ArrowRight as ArrowRightIcon3,
  ArrowUpward as ArrowUpwardIcon3,
  ArrowDownward as ArrowDownwardIcon3,
  ArrowBackIos as ArrowBackIosIcon3,
  ArrowForwardIos as ArrowForwardIosIcon3,
  ArrowBackIosNew as ArrowBackIosNewIcon,
  ArrowForwardIos as ArrowForwardIosIcon4,
  ArrowDropDownCircle as ArrowDropDownCircleIcon,
  ArrowDropUp as ArrowDropUpIcon4,
  ArrowDropDown as ArrowDropDownIcon4,
  ArrowLeft as ArrowLeftIcon4,
  ArrowRight as ArrowRightIcon4,
  ArrowUpward as ArrowUpwardIcon4,
  ArrowDownward as ArrowDownwardIcon4,
  ArrowBack as ArrowBackIcon4,
  ArrowForward as ArrowForwardIcon4,
  ArrowBackIos as ArrowBackIosIcon4,
  ArrowForwardIos as ArrowForwardIosIcon5,
  ArrowBackIosNew as ArrowBackIosNewIcon2,
  ArrowForwardIos as ArrowForwardIosIcon6,
  ArrowDropDownCircle as ArrowDropDownCircleIcon2,
  ArrowDropUp as ArrowDropUpIcon5,
  ArrowDropDown as ArrowDropDownIcon5,
  ArrowLeft as ArrowLeftIcon5,
  ArrowRight as ArrowRightIcon5,
  ArrowUpward as ArrowUpwardIcon5,
  ArrowDownward as ArrowDownwardIcon5,
  ArrowBack as ArrowBackIcon5,
  ArrowForward as ArrowForwardIcon5,
  ArrowBackIos as ArrowBackIosIcon5,
  ArrowForwardIos as ArrowForwardIosIcon7,
  ArrowBackIosNew as ArrowBackIosNewIcon3,
  ArrowForwardIos as ArrowForwardIosIcon8,
  ArrowDropDownCircle as ArrowDropDownCircleIcon3,
  ArrowDropUp as ArrowDropUpIcon6,
  ArrowDropDown as ArrowDropDownIcon6,
  ArrowLeft as ArrowLeftIcon6,
  ArrowRight as ArrowRightIcon6,
  ArrowUpward as ArrowUpwardIcon6,
  ArrowDownward as ArrowDownwardIcon6
} from '@mui/icons-material';
import { makeStyles } from '@mui/styles';
import { Theme } from '@mui/material/styles';

// Types
type Email = {
  id: string;
  from: string;
  to: string[];
  subject: string;
  preview: string;
  date: string;
  read: boolean;
  starred: boolean;
  important: boolean;
  labels: string[];
  category?: 'primary' | 'social' | 'promotions' | 'updates' | 'forums';
  priority: 'low' | 'medium' | 'high' | 'critical';
  hasAttachments: boolean;
};

type EmailCategory = 'inbox' | 'sent' | 'drafts' | 'trash' | 'spam' | 'starred' | 'important' | 'all';

// Mock data
const mockEmails: Email[] = [
  {
    id: '1',
    from: 'client@example.com',
    to: ['me@ufudu.co.za'],
    subject: 'Urgent: Project Update Required',
    preview: 'Hi there, I need an update on the project we discussed last week...',
    date: '2023-06-15T14:30:00Z',
    read: false,
    starred: true,
    important: true,
    labels: ['work', 'urgent'],
    priority: 'high',
    hasAttachments: true,
  },
  {
    id: '2',
    from: 'supplier@example.com',
    to: ['procurement@ufudu.co.za'],
    subject: 'PO #12345 - Confirmation',
    preview: 'Thank you for your purchase order #12345. We have received it and will process it shortly...',
    date: '2023-06-14T09:15:00Z',
    read: true,
    starred: false,
    important: true,
    labels: ['purchase-order', 'finance'],
    priority: 'medium',
    hasAttachments: false,
  },
  {
    id: '3',
    from: 'bank@example.com',
    to: ['finance@ufudu.co.za'],
    subject: 'Payment Received - R45,678.90',
    preview: 'We have received a payment of R45,678.90 to your account...',
    date: '2023-06-14T08:45:00Z',
    read: true,
    starred: false,
    important: false,
    labels: ['payment', 'finance'],
    priority: 'high',
    hasAttachments: true,
  },
  {
    id: '4',
    from: 'support@software.com',
    to: ['it@ufudu.co.za'],
    subject: 'Your subscription will expire soon',
    preview: 'Your subscription for our software will expire in 7 days. Please renew to avoid service interruption...',
    date: '2023-06-13T16:20:00Z',
    read: false,
    starred: false,
    important: false,
    labels: ['subscription', 'it'],
    priority: 'medium',
    hasAttachments: false,
  },
  {
    id: '5',
    from: 'newsletter@industrynews.com',
    to: ['me@ufudu.co.za'],
    subject: 'This Week in Construction: Latest Trends',
    preview: 'Check out the latest trends and updates in the construction industry...',
    date: '2023-06-13T11:30:00Z',
    read: true,
    starred: false,
    important: false,
    labels: ['newsletter'],
    priority: 'low',
    hasAttachments: false,
    category: 'updates',
  },
];

// Priority colors
const priorityColors = {
  critical: '#f44336',
  high: '#ff9800',
  medium: '#2196f3',
  low: '#757575',
};

// Styles
const useStyles = makeStyles((theme: Theme) => ({
  root: {
    display: 'flex',
    height: '100%',
    backgroundColor: theme.palette.background.default,
  },
  content: {
    flexGrow: 1,
    padding: theme.spacing(3),
    overflow: 'auto',
  },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: theme.spacing(0, 1),
    ...theme.mixins.toolbar,
  },
  emailList: {
    height: 'calc(100vh - 200px)',
    overflowY: 'auto',
    '&::-webkit-scrollbar': {
      width: '6px',
    },
    '&::-webkit-scrollbar-track': {
      background: '#f1f1f1',
    },
    '&::-webkit-scrollbar-thumb': {
      background: '#888',
      borderRadius: '3px',
    },
    '&::-webkit-scrollbar-thumb:hover': {
      background: '#555',
    },
  },
  emailItem: {
    display: 'flex',
    alignItems: 'center',
    padding: theme.spacing(1, 2),
    borderBottom: `1px solid ${theme.palette.divider}`,
    cursor: 'pointer',,
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
    '&.unread': {
      backgroundColor: theme.palette.background.paper,
      borderLeft: `3px solid ${theme.palette.primary.main}`,
    },
  },
  emailContent: {
    flex: 1,
    minWidth: 0,
    marginLeft: theme.spacing(2),
  },
  emailSubject: {
    fontWeight: 600,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    marginBottom: theme.spacing(0.5),
  },
  emailPreview: {
    color: theme.palette.text.secondary,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  emailDate: {
    color: theme.palette.text.secondary,
    fontSize: '0.75rem',
    whiteSpace: 'nowrap',
    marginLeft: theme.spacing(2),
  },
  priorityDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    marginRight: theme.spacing(1),
    display: 'inline-block',
  },
  filterBar: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: theme.spacing(2),
    gap: theme.spacing(2),
  },
  searchField: {
    flex: 1,
    maxWidth: '500px',
  },
  filterChips: {
    display: 'flex',
    gap: theme.spacing(1),
    flexWrap: 'wrap',
    marginBottom: theme.spacing(2),
  },
  statsCard: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  statsCardContent: {
    flexGrow: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing(3),
  },
  statsValue: {
    fontSize: '2.5rem',
    fontWeight: 'bold',
    margin: theme.spacing(1, 0),
  },
  statsLabel: {
    color: theme.palette.text.secondary,
    textAlign: 'center',
  },
  emailDetail: {
    padding: theme.spacing(3),
  },
  emailHeader: {
    marginBottom: theme.spacing(3),
    paddingBottom: theme.spacing(2),
    borderBottom: `1px solid ${theme.palette.divider}`,
  },
  emailActions: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: theme.spacing(2),
  },
  emailBody: {
    lineHeight: 1.6,
    '& p': {
      marginBottom: theme.spacing(2),
    },
  },
  attachmentList: {
    marginTop: theme.spacing(3),
    '& > *': {
      margin: theme.spacing(0.5, 0),
    },
  },
  tabPanel: {
    padding: 0,
    marginTop: theme.spacing(2),
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '300px',
    textAlign: 'center',
    color: theme.palette.text.secondary,
    '& svg': {
      fontSize: '4rem',
      marginBottom: theme.spacing(2),
      opacity: 0.5,
    },
  },
}));

const EmailIntelligenceDashboard: React.FC = () => {
  const classes = useStyles();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user } = useAuth();
  const api = useApi();
  
  // State
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [category, setCategory] = useState<EmailCategory>('inbox');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [monitoringStatus, setMonitoringStatus] = useState({
    isMonitoring: false,
    lastChecked: null as string | null,
    totalProcessed: 0,
  });
  
  // Fetch emails
  const fetchEmails = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // In a real app, you would fetch emails from your API
      // const response = await api.get(`/api/intelligence/email/search?category=${category}&q=${searchQuery}`);
      // setEmails(response.data);
      
      // Mock implementation
      setTimeout(() => {
        setEmails(mockEmails);
        setLoading(false);
      }, 500);
      
    } catch (err) {
      console.error('Error fetching emails:', err);
      setError('Failed to load emails. Please try again.');
      setLoading(false);
    }
  }, [category, searchQuery, api]);
  
  // Fetch monitoring status
  const fetchMonitoringStatus = useCallback(async () => {
    try {
      // In a real app, you would fetch this from your API
      // const response = await api.get('/api/intelligence/email/monitoring-status');
      // setMonitoringStatus(response.data);
      
      // Mock implementation
      setMonitoringStatus({
        isMonitoring: true,
        lastChecked: new Date().toISOString(),
        totalProcessed: 1245,
      });
    } catch (err) {
      console.error('Error fetching monitoring status:', err);
    }
  }, [api]);
  
  // Start/stop monitoring
  const toggleMonitoring = async () => {
    try {
      if (monitoringStatus.isMonitoring) {
        // await api.post('/api/intelligence/email/stop-monitoring');
        setMonitoringStatus(prev => ({
          ...prev,
          isMonitoring: false,
        }));
      } else {
        // await api.post('/api/intelligence/email/start-monitoring', {
        //   user: 'email@ufudu.co.za',
        //   password: 'password',
        //   host: 'imap.ufudu.co.za',
        //   port: 993,
        //   tls: true,
        //   mailbox: 'INBOX',
        // });
        setMonitoringStatus(prev => ({
          ...prev,
          isMonitoring: true,
          lastChecked: new Date().toISOString(),
        }));
      }
      
      // Refresh status
      await fetchMonitoringStatus();
    } catch (err) {
      console.error('Error toggling monitoring:', err);
    }
  };
  
  // Handle email selection
  const handleSelectEmail = (email: Email) => {
    setSelectedEmail(email);
    
    // Mark as read
    if (!email.read) {
      setEmails(prevEmails =>
        prevEmails.map(e =>
          e.id === email.id ? { ...e, read: true } : e
        )
      );
      
      // In a real app, you would update the email status via API
      // await api.patch(`/api/intelligence/email/${email.id}`, { read: true });
    }
  };
  
  // Handle page change
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };
  
  // Handle rows per page change
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchEmails();
  };
  
  // Initial data fetch
  useEffect(() => {
    fetchEmails();
    fetchMonitoringStatus();
    
    // Set up polling for new emails (in a real app)
    // const interval = setInterval(fetchEmails, 30000); // Poll every 30 seconds
    // return () => clearInterval(interval);
  }, [fetchEmails, fetchMonitoringStatus]);
  
  // Filter emails based on category and search query
  const filteredEmails = emails.filter(email => {
    // Filter by category
    if (category === 'inbox') {
      // In a real app, you might have more sophisticated filtering
      return true;
    } else if (category === 'starred' && !email.starred) {
      return false;
    } else if (category === 'important' && !email.important) {
      return false;
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        email.subject.toLowerCase().includes(query) ||
        email.from.toLowerCase().includes(query) ||
        email.preview.toLowerCase().includes(query) ||
        email.labels.some(label => label.toLowerCase().includes(query))
      );
    }
    
    return true;
  });
  
  // Pagination
  const paginatedEmails = filteredEmails.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );
  
  // Stats
  const stats = {
    total: emails.length,
    unread: emails.filter(e => !e.read).length,
    starred: emails.filter(e => e.starred).length,
    important: emails.filter(e => e.important).length,
  };
  
  // Priority counts
  const priorityCounts = {
    critical: emails.filter(e => e.priority === 'critical').length,
    high: emails.filter(e => e.priority === 'high').length,
    medium: emails.filter(e => e.priority === 'medium').length,
    low: emails.filter(e => e.priority === 'low').length,
  };
  
  // Category counts
  const categoryCounts = {
    purchaseOrders: emails.filter(e => e.labels.includes('purchase-order')).length,
    payments: emails.filter(e => e.labels.includes('payment')).length,
    clientInquiries: emails.filter(e => e.labels.includes('client')).length,
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    
    // If today, show time
    if (date.toDateString() === now.toDateString()) {
      return format(date, 'h:mm a');
    }
    
    // If this year, show date and month
    if (date.getFullYear() === now.getFullYear()) {
      return format(date, 'MMM d');
    }
    
    // Otherwise, show full date
    return format(date, 'MMM d, yyyy');
  };
  
  // Render loading state
  if (loading && emails.length === 0) {
    return (
      <Box className={classes.root}>
        <Box className={classes.content}>
          <div className={classes.toolbar} />
          <Grid container spacing={3}>
            {[1, 2, 3, 4].map((item) => (
              <Grid item xs={12} sm={6} md={3} key={item}>
                <Skeleton variant="rectangular" height={150} />
              </Grid>
            ))}
            <Grid item xs={12}>
              <Skeleton variant="rectangular" height={400} />
            </Grid>
          </Grid>
        </Box>
      </Box>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <Box className={classes.root}>
        <Box className={classes.content}>
          <div className={classes.toolbar} />
          <Box display="flex" justifyContent="center" alignItems="center" height="80vh">
            <Paper elevation={3} style={{ padding: '2rem', textAlign: 'center' }}>
              <ErrorIcon color="error" style={{ fontSize: 48, marginBottom: '1rem' }} />
              <Typography variant="h5" gutterBottom>
                Error Loading Emails
              </Typography>
              <Typography color="textSecondary" paragraph>
                {error}
              </Typography>
              <Button
                variant="contained"
                color="primary"
                startIcon={<RefreshIcon />}
                onClick={fetchEmails}
              >
                Retry
              </Button>
            </Paper>
          </Box>
        </Box>
      </Box>
    );
  }
  
  return (
    <Box className={classes.root}>
      <Box className={classes.content}>
        <div className={classes.toolbar} />
        
        {/* Header */}
        <Box mb={3}>
          <Typography variant="h4" component="h1" gutterBottom>
            Email Intelligence
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Monitor, analyze, and manage your emails with AI-powered intelligence
          </Typography>
        </Box>
        
        {/* Stats Cards */}
        <Grid container spacing={3} style={{ marginBottom: '1.5rem' }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card className={classes.statsCard}>
              <CardContent className={classes.statsCardContent}>
                <EmailInboxIcon color="primary" fontSize="large" />
                <Typography variant="h4" className={classes.statsValue}>
                  {stats.total}
                </Typography>
                <Typography variant="body2" className={classes.statsLabel}>
                  Total Emails
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card className={classes.statsCard}>
              <CardContent className={classes.statsCardContent}>
                <MarkEmailUnreadIcon color="secondary" fontSize="large" />
                <Typography variant="h4" className={classes.statsValue}>
                  {stats.unread}
                </Typography>
                <Typography variant="body2" className={classes.statsLabel}>
                  Unread
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card className={classes.statsCard}>
              <CardContent className={classes.statsCardContent}>
                <StarIcon style={{ color: '#ffc107' }} fontSize="large" />
                <Typography variant="h4" className={classes.statsValue}>
                  {stats.starred}
                </Typography>
                <Typography variant="body2" className={classes.statsLabel}>
                  Starred
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card className={classes.statsCard}>
              <CardContent className={classes.statsCardContent}>
                <LabelImportantIcon color="error" fontSize="large" />
                <Typography variant="h4" className={classes.statsValue}>
                  {stats.important}
                </Typography>
                <Typography variant="body2" className={classes.statsLabel}>
                  Important
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
        
        {/* Monitoring Status */}
        <Box mb={3}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" component="div">
                  Email Monitoring Status
                </Typography>
                <Button
                  variant="contained"
                  color={monitoringStatus.isMonitoring ? 'secondary' : 'primary'}
                  startIcon={monitoringStatus.isMonitoring ? <StopIcon /> : <PlayArrowIcon />}
                  onClick={toggleMonitoring}
                >
                  {monitoringStatus.isMonitoring ? 'Stop Monitoring' : 'Start Monitoring'}
                </Button>
              </Box>
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <Typography variant="body2" color="textSecondary">
                    Status
                  </Typography>
                  <Typography variant="body1">
                    {monitoringStatus.isMonitoring ? (
                      <Box display="flex" alignItems="center">
                        <Box
                          style={{
                            width: '10px',
                            height: '10px',
                            borderRadius: '50%',
                            backgroundColor: '#4caf50',
                            marginRight: '8px',
                          }}
                        />
                        Active
                      </Box>
                    ) : (
                      <Box display="flex" alignItems="center">
                        <Box
                          style={{
                            width: '10px',
                            height: '10px',
                            borderRadius: '50%',
                            backgroundColor: '#f44336',
                            marginRight: '8px',
                          }}
                        />
                        Inactive
                      </Box>
                    )}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <Typography variant="body2" color="textSecondary">
                    Last Checked
                  </Typography>
                  <Typography variant="body1">
                    {monitoringStatus.lastChecked
                      ? formatDate(monitoringStatus.lastChecked)
                      : 'Never'}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <Typography variant="body2" color="textSecondary">
                    Total Processed
                  </Typography>
                  <Typography variant="body1">
                    {monitoringStatus.totalProcessed.toLocaleString()}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Box>
        
        {/* Email List and Detail View */}
        <Grid container spacing={3}>
          {/* Email List */}
          <Grid item xs={12} md={selectedEmail && !isMobile ? 5 : 12}>
            <Card>
              <CardContent>
                {/* Search and Filter */}
                <Box className={classes.filterBar}>
                  <form onSubmit={handleSearch} style={{ flex: 1 }}>
                    <TextField
                      fullWidth
                      variant="outlined"
                      placeholder="Search emails..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className={classes.searchField}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon />
                          </InputAdornment>
                        ),
                        endAdornment: searchQuery && (
                          <InputAdornment position="end">
                            <IconButton
                              size="small"
                              onClick={() => {
                                setSearchQuery('');
                                fetchEmails();
                              }}
                            >
                              <ClearIcon fontSize="small" />
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </form>
                  
                  <FormControl variant="outlined" size="small">
                    <Select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as EmailCategory)}
                      displayEmpty
                      inputProps={{ 'aria-label': 'Category' }}
                    >
                      <MenuItem value="inbox">Inbox</MenuItem>
                      <MenuItem value="starred">Starred</MenuItem>
                      <MenuItem value="important">Important</MenuItem>
                      <MenuItem value="sent">Sent</MenuItem>
                      <MenuItem value="drafts">Drafts</MenuItem>
                      <MenuItem value="trash">Trash</MenuItem>
                    </Select>
                  </FormControl>
                  
                  <IconButton onClick={fetchEmails}>
                    <RefreshIcon />
                  </IconButton>
                </Box>
                
                {/* Filter Chips */}
                <Box className={classes.filterChips}>
                  <Chip
                    icon={<EmailIcon />}
                    label="All Emails"
                    variant={!searchQuery && category === 'inbox' ? 'default' : 'outlined'}
                    color={!searchQuery && category === 'inbox' ? 'primary' : 'default'}
                    onClick={() => {
                      setSearchQuery('');
                      setCategory('inbox');
                    }}
                    style={{ marginRight: '8px' }}
                  />
                  
                  <Chip
                    icon={<LocalOfferIcon />}
                    label="Purchase Orders"
                    variant={searchQuery === 'purchase-order' ? 'default' : 'outlined'}
                    color={searchQuery === 'purchase-order' ? 'primary' : 'default'}
                    onClick={() => setSearchQuery('purchase-order')}
                    style={{ marginRight: '8px' }}
                  />
                  
                  <Chip
                    icon={<AttachMoneyIcon />}
                    label="Payments"
                    variant={searchQuery === 'payment' ? 'default' : 'outlined'}
                    color={searchQuery === 'payment' ? 'primary' : 'default'}
                    onClick={() => setSearchQuery('payment')}
                    style={{ marginRight: '8px' }}
                  />
                  
                  <Chip
                    icon={<PersonIcon />}
                    label="Client Inquiries"
                    variant={searchQuery === 'client' ? 'default' : 'outlined'}
                    color={searchQuery === 'client' ? 'primary' : 'default'}
                    onClick={() => setSearchQuery('client')}
                  />
                </Box>
                
                {/* Priority Filters */}
                <Box className={classes.filterChips}>
                  <Chip
                    label={`Critical (${priorityCounts.critical})`}
                    style={{
                      backgroundColor: priorityCounts.critical > 0 ? '#f44336' : undefined,
                      color: priorityCounts.critical > 0 ? '#fff' : undefined,
                      marginRight: '8px',
                    }}
                    onClick={() => {}}
                  />
                  <Chip
                    label={`High (${priorityCounts.high})`}
                    style={{
                      backgroundColor: priorityCounts.high > 0 ? '#ff9800' : undefined,
                      color: priorityCounts.high > 0 ? '#fff' : undefined,
                      marginRight: '8px',
                    }}
                    onClick={() => {}}
                  />
                  <Chip
                    label={`Medium (${priorityCounts.medium})`}
                    style={{
                      backgroundColor: priorityCounts.medium > 0 ? '#2196f3' : undefined,
                      color: priorityCounts.medium > 0 ? '#fff' : undefined,
                      marginRight: '8px',
                    }}
                    onClick={() => {}}
                  />
                  <Chip
                    label={`Low (${priorityCounts.low})`}
                    style={{
                      backgroundColor: priorityCounts.low > 0 ? '#9e9e9e' : undefined,
                      color: priorityCounts.low > 0 ? '#fff' : undefined,
                    }}
                    onClick={() => {}}
                  />
                </Box>
                
                {/* Email List */}
                {loading ? (
                  <Box display="flex" justifyContent="center" p={3}>
                    <CircularProgress />
                  </Box>
                ) : filteredEmails.length === 0 ? (
                  <Box className={classes.emptyState}>
                    <EmailIcon fontSize="inherit" />
                    <Typography variant="h6">No emails found</Typography>
                    <Typography variant="body2">
                      {searchQuery
                        ? 'Try a different search term'
                        : 'Your inbox is empty'}
                    </Typography>
                  </Box>
                ) : (
                  <>
                    <List className={classes.emailList}>
                      {paginatedEmails.map((email) => (
                        <React.Fragment key={email.id}>
                          <ListItem
                            button
                            className={`${classes.emailItem} ${!email.read ? 'unread' : ''}`}
                            onClick={() => handleSelectEmail(email)}
                            selected={selectedEmail?.id === email.id}
                          >
                            <ListItemAvatar>
                              <Avatar>
                                {email.from.charAt(0).toUpperCase()}
                              </Avatar>
                            </ListItemAvatar>
                            
                            <Box className={classes.emailContent}>
                              <Box display="flex" alignItems="center">
                                <Box
                                  className={classes.priorityDot}
                                  style={{
                                    backgroundColor: priorityColors[email.priority] || '#9e9e9e',
                                  }}
                                />
                                <Typography
                                  variant="subtitle1"
                                  className={classes.emailSubject}
                                  style={{
                                    fontWeight: email.read ? 'normal' : 'bold',
                                  }}
                                >
                                  {email.subject}
                                </Typography>
                              </Box>
                              
                              <Box display="flex" justifyContent="space-between" alignItems="center">
                                <Typography
                                  variant="body2"
                                  className={classes.emailPreview}
                                  style={{
                                    fontWeight: email.read ? 'normal' : '500',
                                  }}
                                >
                                  {email.preview}
                                </Typography>
                                
                                <Typography
                                  variant="caption"
                                  className={classes.emailDate}
                                  style={{
                                    fontWeight: email.read ? 'normal' : '500',
                                  }}
                                >
                                  {formatDate(email.date)}
                                </Typography>
                              </Box>
                              
                              <Box mt={1}>
                                {email.labels.map((label) => (
                                  <Chip
                                    key={label}
                                    label={label}
                                    size="small"
                                    style={{
                                      marginRight: '4px',
                                      marginBottom: '4px',
                                      backgroundColor: '#e0e0e0',
                                    }}
                                  />
                                ))}
                              </Box>
                            </Box>
                            
                            <Box display="flex" flexDirection="column" alignItems="center" ml={1}>
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Toggle star
                                  setEmails(prev =>
                                    prev.map(e =>
                                      e.id === email.id ? { ...e, starred: !e.starred } : e
                                    )
                                  );
                                }}
                              >
                                {email.starred ? (
                                  <StarIcon style={{ color: '#ffc107' }} />
                                ) : (
                                  <StarBorderIcon />
                                )}
                              </IconButton>
                              
                              {email.hasAttachments && (
                                <Tooltip title="Has attachments">
                                  <AttachmentIcon fontSize="small" color="action" />
                                </Tooltip>
                              )}
                            </Box>
                          </ListItem>
                          <Divider variant="inset" component="li" />
                        </React.Fragment>
                      ))}
                    </List>
                    
                    {/* Pagination */}
                    <TablePagination
                      rowsPerPageOptions={[5, 10, 25, 50]}
                      component="div"
                      count={filteredEmails.length}
                      rowsPerPage={rowsPerPage}
                      page={page}
                      onPageChange={handleChangePage}
                      onRowsPerPageChange={handleChangeRowsPerPage}
                    />
                  </>
                )}
              </CardContent>
            </Card>
          </Grid>
          
          {/* Email Detail View */}
          {selectedEmail && (
            <Grid item xs={12} md={7}>
              <Card>
                <CardContent className={classes.emailDetail}>
                  {/* Email Header */}
                  <Box className={classes.emailHeader}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Typography variant="h5" component="h2">
                        {selectedEmail.subject}
                      </Typography>
                      <Box>
                        <IconButton>
                          <ReplyIcon />
                        </IconButton>
                        <IconButton>
                          <ReplyAllIcon />
                        </IconButton>
                        <IconButton>
                          <ForwardIcon />
                        </IconButton>
                        <IconButton>
                          <DeleteIcon />
                        </IconButton>
                        <IconButton>
                          <MoreVertIcon />
                        </IconButton>
                      </Box>
                    </Box>
                    
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Box display="flex" alignItems="center">
                        <Avatar style={{ marginRight: '12px' }}>
                          {selectedEmail.from.charAt(0).toUpperCase()}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle1">
                            {selectedEmail.from}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            to me
                          </Typography>
                        </Box>
                      </Box>
                      
                      <Typography variant="caption" color="textSecondary">
                        {formatDate(selectedEmail.date)}
                      </Typography>
                    </Box>
                  </Box>
                  
                  {/* Email Body */}
                  <Box className={classes.emailBody}>
                    <Typography variant="body1" paragraph>
                      {selectedEmail.preview}
                    </Typography>
                    
                    <Typography variant="body1" paragraph>
                      Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam in dui mauris. 
                      Vivamus hendrerit arcu sed erat molestie vehicula. Sed auctor neque eu tellus 
                      rhoncus ut eleifend nibh porttitor. Ut in nulla enim. Phasellus molestie magna 
                      non est bibendum non venenatis nisl tempor. Suspendisse dictum feugiat nisl ut 
                      dapibus. Mauris iaculis porttitor posuere. Praesent id metus massa, ut blandit 
                      odio. Proin quis tortor orci. Etiam at risus et justo dignissim congue. 
                      Donec congue lacinia dui, a porttitor lectus condimentum laoreet.
                    </Typography>
                    
                    <Typography variant="body1" paragraph>
                      Best regards,\n                      <br />
                      The Sender
                    </Typography>
                  </Box>
                  
                  {/* Attachments */}
                  {selectedEmail.hasAttachments && (
                    <Box className={classes.attachmentList}>
                      <Typography variant="subtitle2" gutterBottom>
                        Attachments ({selectedEmail.hasAttachments ? 2 : 0})
                      </Typography>
                      
                      <Paper variant="outlined" style={{ padding: '8px', marginBottom: '8px' }}>
                        <Box display="flex" alignItems="center">
                          <DescriptionIcon color="action" style={{ marginRight: '8px' }} />
                          <Box flexGrow={1}>
                            <Typography variant="body2">document.pdf</Typography>
                            <Typography variant="caption" color="textSecondary">
                              2.4 MB
                            </Typography>
                          </Box>
                          <Button size="small" color="primary">
                            Download
                          </Button>
                        </Box>
                      </Paper>
                      
                      <Paper variant="outlined" style={{ padding: '8px' }}>
                        <Box display="flex" alignItems="center">
                          <ImageIcon color="action" style={{ marginRight: '8px' }} />
                          <Box flexGrow={1}>
                            <Typography variant="body2">screenshot.png</Typography>
                            <Typography variant="caption" color="textSecondary">
                              1.2 MB
                            </Typography>
                          </Box>
                          <Button size="small" color="primary">
                            Download
                          </Button>
                        </Box>
                      </Paper>
                    </Box>
                  )}
                  
                  {/* Email Actions */}
                  <Box mt={3} display="flex" justifyContent="space-between">
                    <Box>
                      <Button
                        variant="contained"
                        color="primary"
                        startIcon={<ReplyIcon />}
                        style={{ marginRight: '8px' }}
                      >
                        Reply
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<ReplyAllIcon />}
                        style={{ marginRight: '8px' }}
                      >
                        Reply All
                      </Button>
                      <Button variant="outlined" startIcon={<ForwardIcon />}>
                        Forward
                      </Button>
                    </Box>
                    
                    <Box>
                      <IconButton>
                        <ArchiveIcon />
                      </IconButton>
                      <IconButton>
                        <DeleteIcon />
                      </IconButton>
                      <IconButton>
                        <MoreVertIcon />
                      </IconButton>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
              
              {/* AI Analysis Section */}
              <Box mt={3}>
                <Card>
                  <CardHeader
                    title="AI Analysis"
                    avatar={<AssessmentIcon color="primary" />}
                    action={
                      <IconButton>
                        <InfoIcon />
                      </IconButton>
                    }
                  />
                  <CardContent>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6} md={4}>
                        <Box mb={2}>
                          <Typography variant="subtitle2" color="textSecondary">
                            Priority
                          </Typography>
                          <Box display="flex" alignItems="center">
                            <Box
                              style={{
                                width: '12px',
                                height: '12px',
                                borderRadius: '50%',
                                backgroundColor: priorityColors[selectedEmail.priority] || '#9e9e9e',
                                marginRight: '8px',
                              }}
                            />
                            <Typography variant="body1" style={{ textTransform: 'capitalize' }}>
                              {selectedEmail.priority}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                      
                      <Grid item xs={12} sm={6} md={4}>
                        <Box mb={2}>
                          <Typography variant="subtitle2" color="textSecondary">
                            Category
                          </Typography>
                          <Typography variant="body1">
                            {selectedEmail.labels[0] || 'General'}
                          </Typography>
                        </Box>
                      </Grid>
                      
                      <Grid item xs={12} sm={6} md={4}>
                        <Box mb={2}>
                          <Typography variant="subtitle2" color="textSecondary">
                            Sentiment
                          </Typography>
                          <Box display="flex" alignItems="center">
                            <SentimentSatisfiedIcon
                              style={{
                                color: '#4caf50',
                                marginRight: '4px',
                              }}
                            />
                            <Typography variant="body1">Positive</Typography>
                          </Box>
                        </Box>
                      </Grid>
                      
                      <Grid item xs={12}>
                        <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                          Suggested Actions
                        </Typography>
                        <Box display="flex" flexWrap="wrap" gap={1}>
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<CheckCircleIcon />}
                          >
                            Mark as Complete
                          </Button>
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<ScheduleIcon />}
                          >
                            Set Reminder
                          </Button>
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<PersonAddIcon />}
                          >
                            Assign to Team Member
                          </Button>
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<LabelIcon />}
                          >
                            Add Label
                          </Button>
                        </Box>
                      </Grid>
                      
                      <Grid item xs={12}>
                        <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                          Related Items
                        </Typography>
                        <Box display="flex" flexWrap="wrap" gap={1}>
                          <Chip
                            icon={<BusinessIcon />}
                            label="Client: Acme Corp"
                            variant="outlined"
                            size="small"
                            clickable
                          />
                          <Chip
                            icon={<AssignmentIcon />}
                            label="Project: Website Redesign"
                            variant="outlined"
                            size="small"
                            clickable
                          />
                          <Chip
                            icon={<ReceiptIcon />}
                            label="Invoice: INV-2023-0456"
                            variant="outlined"
                            size="small"
                            clickable
                          />
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Box>
            </Grid>
          )}
        </Grid>
      </Box>
    </Box>
  );
};

export default EmailIntelligenceDashboard;
