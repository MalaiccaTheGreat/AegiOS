import React, { useState, useEffect } from 'react';
import { useRoute, useLocation } from 'wouter';
import { 
  Box, 
  Button, 
  TextField, 
  Typography, 
  Grid, 
  Divider, 
  IconButton,
  useTheme,
  useMediaQuery,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  InputAdornment
} from '@mui/material';
import { 
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  AttachFile as AttachFileIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { useApi } from '../../hooks/useApi';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';

// Types
type Account = {
  id: string;
  code: string;
  name: string;
  type: string;
  balance: number;
};

type TransactionLine = {
  id: string;
  accountId: string;
  accountName: string;
  description: string;
  debit: number;
  credit: number;
};

const TransactionForm: React.FC = () => {
  const [match, params] = useRoute('/business/:businessId/accounting/transactions/:id?');
  const businessId = params?.businessId;
  const id = params?.id;
  const [location, navigate] = useLocation();
  const api = useApi();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isEditing = !!id;

  // Form state
  const [date, setDate] = useState<Date | null>(new Date());
  const [reference, setReference] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<TransactionLine[]>([
    { id: '1', accountId: '', accountName: '', description: '', debit: 0, credit: 0 },
    { id: '2', accountId: '', accountName: '', description: '', debit: 0, credit: 0 },
  ]);

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accountSearch, setAccountSearch] = useState('');
  const [showAccountDialog, setShowAccountDialog] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [filteredAccounts, setFilteredAccounts] = useState<Account[]>([]);
  const [selectedLineId, setSelectedLineId] = useState<string | null>(null);

  // Fetch accounts and transaction data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // In a real app, fetch accounts from the API
        // const accountsResponse = await api.get(`/api/accounting/accounts?businessId=${businessId}`);
        // setAccounts(accountsResponse.data);
        
        // Mock data for development
        const mockAccounts: Account[] = [
          { id: '1001', code: '1010', name: 'Cash on Hand', type: 'ASSET', balance: 25000 },
          { id: '1002', code: '1020', name: 'Bank Account', type: 'ASSET', balance: 125000 },
          { id: '2001', code: '2010', name: 'Accounts Payable', type: 'LIABILITY', balance: 0 },
          { id: '3001', code: '3010', name: 'Owner\'s Equity', type: 'EQUITY', balance: 0 },
          { id: '4001', code: '4010', name: 'Service Revenue', type: 'REVENUE', balance: 0 },
          { id: '5001', code: '5010', name: 'Office Supplies', type: 'EXPENSE', balance: 0 },
          { id: '5002', code: '5020', name: 'Rent Expense', type: 'EXPENSE', balance: 0 },
          { id: '5003', code: '5030', name: 'Utilities', type: 'EXPENSE', balance: 0 },
        ];
        
        setAccounts(mockAccounts);
        setFilteredAccounts(mockAccounts);

        // If editing, fetch the transaction data
        if (isEditing) {
          // const response = await api.get(`/api/accounting/transactions/${id}?businessId=${businessId}`);
          // const transaction = response.data;
          // setDate(parseISO(transaction.date));
          // setReference(transaction.reference);
          // setDescription(transaction.description);
          // setNotes(transaction.notes);
          // setLines(transaction.lines);
          
          // Mock transaction data for editing
          setReference('INV-2023-001');
          setDescription('Office supplies purchase');
          setNotes('Purchased office supplies for the month');
          setLines([
            { 
              id: '1', 
              accountId: '5001', 
              accountName: 'Office Supplies', 
              description: 'Office supplies for June', 
              debit: 1250.50, 
              credit: 0 
            },
            { 
              id: '2', 
              accountId: '1001', 
              accountName: 'Cash on Hand', 
              description: 'Payment for office supplies', 
              debit: 0, 
              credit: 1250.50 
            },
          ]);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load transaction data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [businessId, id, isEditing, api]);

  // Filter accounts based on search
  useEffect(() => {
    if (accountSearch.trim() === '') {
      setFilteredAccounts(accounts);
    } else {
      const searchLower = accountSearch.toLowerCase();
      const filtered = accounts.filter(
        (account) =>
          account.code.toLowerCase().includes(searchLower) ||
          account.name.toLowerCase().includes(searchLower) ||
          account.type.toLowerCase().includes(searchLower)
      );
      setFilteredAccounts(filtered);
    }
  }, [accountSearch, accounts]);

  // Calculate totals
  const totals = React.useMemo(() => {
    return lines.reduce(
      (acc, line) => {
        acc.totalDebit += line.debit;
        acc.totalCredit += line.credit;
        return acc;
      },
      { totalDebit: 0, totalCredit: 0, difference: 0 }
    );
  }, [lines]);

  // Handle form field changes
  const handleDateChange = (newDate: Date | null) => {
    setDate(newDate);
  };

  const handleReferenceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setReference(e.target.value);
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDescription(e.target.value);
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNotes(e.target.value);
  };

  const handleLineChange = (id: string, field: keyof TransactionLine, value: number | string) => {
    setLines(
      lines.map((line) =>
        line.id === id ? { ...line, [field]: value } : line
      )
    );
  };

  const handleAccountSelect = (account: Account) => {
    if (selectedLineId) {
      setLines(
        lines.map((line) =>
          line.id === selectedLineId
            ? {
                ...line,
                accountId: account.id,
                accountName: account.name,
              }
            : line
        )
      );
      setShowAccountDialog(false);
      setAccountSearch('');
      setSelectedLineId(null);
    }
  };

  const handleAddLine = () => {
    const newLine: TransactionLine = {
      id: Date.now().toString(),
      accountId: '',
      accountName: '',
      description: '',
      debit: 0,
      credit: 0,
    };
    setLines([...lines, newLine]);
  };

  const handleRemoveLine = (id: string) => {
    if (lines.length > 2) {
      setLines(lines.filter((line) => line.id !== id));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!date) {
      setError('Date is required');
      return;
    }

    if (!description.trim()) {
      setError('Description is required');
      return;
    }

    // Validate lines
    for (const line of lines) {
      if (!line.accountId) {
        setError('Please select an account for all lines');
        return;
      }
      
      if (line.debit < 0 || line.credit < 0) {
        setError('Amounts cannot be negative');
        return;
      }
      
      if (line.debit > 0 && line.credit > 0) {
        setError('A line cannot have both debit and credit amounts');
        return;
      }
      
      if (line.debit === 0 && line.credit === 0) {
        setError('Amount cannot be zero');
        return;
      }
    }

    // Check if debits equal credits
    if (Math.abs(totals.totalDebit - totals.totalCredit) > 0.01) {
      setError('Total debits must equal total credits');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const transactionData = {
        date: date.toISOString(),
        reference,
        description,
        notes,
        lines: lines.map((line) => ({
          accountId: line.accountId,
          description: line.description,
          debit: line.debit,
          credit: line.credit,
        })),
      };

      // In a real app, this would call the API
      // if (isEditing) {
      //   await api.put(`/api/accounting/transactions/${id}?businessId=${businessId}`, transactionData);
      // } else {
      //   await api.post(`/api/accounting/transactions?businessId=${businessId}`, transactionData);
      // }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Transaction saved:', transactionData);
      
      // Redirect to transactions list
      navigate(`/business/${businessId}/accounting/transactions`);
    } catch (error) {
      console.error('Error saving transaction:', error);
      setError('Failed to save transaction. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (window.confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
      navigate(`/business/${businessId}/accounting/transactions`);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h1">
          {isEditing ? 'Edit Transaction' : 'New Transaction'}
        </Typography>
        <div>
          <Button 
            variant="outlined" 
            startIcon={<CancelIcon />} 
            onClick={handleCancel}
            sx={{ mr: 1 }}
          >
            Cancel
          </Button>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<SaveIcon />} 
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </Box>

      {error && (
        <Box sx={{ mb: 3, p: 2, bgcolor: 'error.light', color: 'white', borderRadius: 1 }}>
          {error}
        </Box>
      )}

      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          {/* Transaction Header */}
          <Grid item xs={12}>
            <Paper elevation={1} sx={{ p: 3 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DatePicker
                      label="Date"
                      value={date}
                      onChange={handleDateChange}
                      renderInput={(params) => (
                        <TextField 
                          {...params} 
                          fullWidth 
                          required 
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <DateIcon />
                              </InputAdornment>
                            ),
                          }}
                        />
                      )}
                    />
                  </LocalizationProvider>
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    label="Reference"
                    value={reference}
                    onChange={handleReferenceChange}
                    fullWidth
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <ReceiptIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Description"
                    value={description}
                    onChange={handleDescriptionChange}
                    fullWidth
                    required
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <DescriptionIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Transaction Lines */}
          <Grid item xs={12}>
            <Paper elevation={1}>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Account</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell align="right">Debit</TableCell>
                      <TableCell align="right">Credit</TableCell>
                      <TableCell width={50}></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {lines.map((line) => (
                      <TableRow key={line.id}>
                        <TableCell>
                          <TextField
                            size="small"
                            fullWidth
                            value={line.accountName}
                            onClick={() => {
                              setSelectedLineId(line.id);
                              setShowAccountDialog(true);
                            }}
                            placeholder="Select account..."
                            required
                            InputProps={{
                              readOnly: true,
                              startAdornment: (
                                <InputAdornment position="start">
                                  <AccountIcon />
                                </InputAdornment>
                              ),
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            fullWidth
                            value={line.description}
                            onChange={(e) =>
                              handleLineChange(line.id, 'description', e.target.value)
                            }
                            placeholder="Description (optional)"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <TextField
                            size="small"
                            type="number"
                            value={line.debit || ''}
                            onChange={(e) =>
                              handleLineChange(
                                line.id,
                                'debit',
                                e.target.value === '' ? 0 : parseFloat(e.target.value)
                              )
                            }
                            onFocus={(e) => e.target.select()}
                            inputProps={{
                              min: 0,
                              step: '0.01',
                              style: { textAlign: 'right' },
                            }}
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <MoneyIcon fontSize="small" />
                                </InputAdornment>
                              ),
                            }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <TextField
                            size="small"
                            type="number"
                            value={line.credit || ''}
                            onChange={(e) =>
                              handleLineChange(
                                line.id,
                                'credit',
                                e.target.value === '' ? 0 : parseFloat(e.target.value)
                              )
                            }
                            onFocus={(e) => e.target.select()}
                            inputProps={{
                              min: 0,
                              step: '0.01',
                              style: { textAlign: 'right' },
                            }}
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <MoneyIcon fontSize="small" />
                                </InputAdornment>
                              ),
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleRemoveLine(line.id)}
                            disabled={lines.length <= 2}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableCell colSpan={2}>
                        <Button
                          startIcon={<AddLineIcon />}
                          onClick={handleAddLine}
                          size="small"
                        >
                          Add Line
                        </Button>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="subtitle2">
                          {totals.totalDebit.toFixed(2)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="subtitle2">
                          {totals.totalCredit.toFixed(2)}
                        </Typography>
                      </TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell colSpan={3} align="right">
                        <Typography 
                          variant="subtitle1" 
                          sx={{ 
                            fontWeight: 'bold',
                            color: Math.abs(totals.totalDebit - totals.totalCredit) < 0.01 
                              ? 'success.main' 
                              : 'error.main' 
                          }}
                        >
                          {Math.abs(totals.totalDebit - totals.totalCredit) < 0.01
                            ? 'Balanced'
                            : `Difference: ${Math.abs(totals.totalDebit - totals.totalCredit).toFixed(2)}`}
                        </Typography>
                      </TableCell>
                      <TableCell colSpan={2}></TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>

          {/* Notes */}
          <Grid item xs={12}>
            <TextField
              label="Notes"
              value={notes}
              onChange={handleNotesChange}
              fullWidth
              multiline
              rows={3}
              placeholder="Add any additional notes or memos..."
            />
          </Grid>
        </Grid>
      </form>

      {/* Account Selection Dialog */}
      <Dialog
        open={showAccountDialog}
        onClose={() => {
          setShowAccountDialog(false);
          setAccountSearch('');
          setSelectedLineId(null);
        }}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Select Account</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Search accounts"
            type="text"
            fullWidth
            variant="outlined"
            value={accountSearch}
            onChange={(e) => setAccountSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          <Box sx={{ mt: 2, maxHeight: 400, overflow: 'auto' }}>
            <List>
              {filteredAccounts.map((account) => (
                <React.Fragment key={account.id}>
                  <ListItem 
                    button 
                    onClick={() => handleAccountSelect(account)}
                    sx={{ '&:hover': { backgroundColor: 'action.hover' } }}
                  >
                    <ListItemText
                      primary={`${account.code} - ${account.name}`}
                      secondary={account.type}
                    />
                    <Typography variant="body2" color="text.secondary">
                      ${account.balance.toLocaleString()}
                    </Typography>
                  </ListItem>
                  <Divider component="li" />
                </React.Fragment>
              ))}
              {filteredAccounts.length === 0 && (
                <ListItem>
                  <ListItemText 
                    primary="No accounts found" 
                    secondary="Try a different search term" 
                  />
                </ListItem>
              )}
            </List>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setShowAccountDialog(false);
              setAccountSearch('');
              setSelectedLineId(null);
            }}
          >
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TransactionForm;
