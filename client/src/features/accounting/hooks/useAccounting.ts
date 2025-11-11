import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import * as accountingApi from '../api';
import { 
  FinancialSummary, 
  Transaction, 
  Account, 
  Category, 
  TaxFiling, 
  FinancialReport,
  DashboardData
} from '../types';

interface UseAccountingProps {
  businessId: string;
}

export function useAccounting({ businessId }: UseAccountingProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [taxFilings, setTaxFilings] = useState<TaxFiling[]>([]);
  const [reports, setReports] = useState<FinancialReport[]>([]);

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await accountingApi.getFinancialSummary(businessId);
      setDashboardData(data);
    } catch (err) {
      const error = err as Error;
      setError(error.message);
      toast({
        title: 'Error',
        description: 'Failed to fetch dashboard data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [businessId, toast]);

  // Fetch transactions
  const fetchTransactions = useCallback(async (params?: { limit?: number }) => {
    try {
      setLoading(true);
      const data = await accountingApi.getRecentTransactions(
        businessId,
        params?.limit
      );
      setTransactions(data);
      return data;
    } catch (err) {
      const error = err as Error;
      setError(error.message);
      toast({
        title: 'Error',
        description: 'Failed to fetch transactions',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [businessId, toast]);

  // Create a new transaction
  const createTransaction = useCallback(async (transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      setLoading(true);
      const newTransaction = await accountingApi.createTransaction(transaction);
      setTransactions(prev => [newTransaction, ...prev]);
      toast({
        title: 'Success',
        description: 'Transaction created successfully',
      });
      return newTransaction;
    } catch (err) {
      const error = err as Error;
      toast({
        title: 'Error',
        description: error.message || 'Failed to create transaction',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Update a transaction
  const updateTransaction = useCallback(async (id: string, updates: Partial<Transaction>) => {
    try {
      setLoading(true);
      const updatedTransaction = await accountingApi.updateTransaction(id, updates);
      setTransactions(prev => 
        prev.map(tx => tx.id === id ? { ...tx, ...updatedTransaction } : tx)
      );
      toast({
        title: 'Success',
        description: 'Transaction updated successfully',
      });
      return updatedTransaction;
    } catch (err) {
      const error = err as Error;
      toast({
        title: 'Error',
        description: error.message || 'Failed to update transaction',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Delete a transaction
  const deleteTransaction = useCallback(async (id: string) => {
    try {
      setLoading(true);
      await accountingApi.deleteTransaction(id);
      setTransactions(prev => prev.filter(tx => tx.id !== id));
      toast({
        title: 'Success',
        description: 'Transaction deleted successfully',
      });
      return true;
    } catch (err) {
      const error = err as Error;
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete transaction',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Generate a financial report
  const generateReport = useCallback(async (params: {
    type: 'INCOME_STATEMENT' | 'BALANCE_SHEET' | 'CASH_FLOW' | 'TAX';
    startDate?: string;
    endDate?: string;
  }) => {
    try {
      setLoading(true);
      const blob = await accountingApi.generateReport({
        businessId,
        ...params,
      });
      
      // Create a URL for the blob
      const url = window.URL.createObjectURL(blob);
      
      // Create a temporary link and trigger download
      const a = document.createElement('a');
      a.href = url;
      a.download = `report-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      return true;
    } catch (err) {
      const error = err as Error;
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate report',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [businessId, toast]);

  // Fetch tax filings
  const fetchTaxFilings = useCallback(async () => {
    try {
      setLoading(true);
      const data = await accountingApi.getTaxFilings(businessId);
      setTaxFilings(data);
      return data;
    } catch (err) {
      const error = err as Error;
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch tax filings',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [businessId, toast]);

  // File a tax return
  const fileTaxReturn = useCallback(async (data: {
    taxFilingId: string;
    paymentAmount: number;
    paymentDate: string;
    paymentMethod: string;
    referenceNumber?: string;
    notes?: string;
  }) => {
    try {
      setLoading(true);
      const result = await accountingApi.fileTaxReturn({
        businessId,
        ...data,
      });
      
      // Update the tax filings list
      await fetchTaxFilings();
      
      toast({
        title: 'Success',
        description: 'Tax return filed successfully',
      });
      
      return result;
    } catch (err) {
      const error = err as Error;
      toast({
        title: 'Error',
        description: error.message || 'Failed to file tax return',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [businessId, fetchTaxFilings, toast]);

  // Initial data loading
  useEffect(() => {
    if (businessId) {
      fetchDashboardData();
      fetchTransactions();
      fetchTaxFilings();
    }
  }, [businessId, fetchDashboardData, fetchTransactions, fetchTaxFilings]);

  return {
    loading,
    error,
    dashboardData,
    transactions,
    accounts,
    categories,
    taxFilings,
    reports,
    fetchDashboardData,
    fetchTransactions,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    generateReport,
    fetchTaxFilings,
    fileTaxReturn,
  };
}
