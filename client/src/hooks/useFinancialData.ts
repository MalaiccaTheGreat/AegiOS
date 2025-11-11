import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { useBusiness } from '@/contexts/BusinessContext';

export interface FinancialData {
  summary: {
    revenue: number;
    revenueChange: number;
    expenses: number;
    expensesChange: number;
    profit: number;
    profitChange: number;
    cashFlow: number;
    cashFlowChange: number;
  };
  metrics: {
    monthlyMetrics: Array<{
      month: string;
      revenue: number;
      expenses: number;
      profit: number;
    }>;
    accountBalances: Array<{
      id: string;
      name: string;
      accountNumber: string;
      balance: number;
      change: number;
    }>;
    financialReports: Array<{
      id: string;
      name: string;
      type: 'income_statement' | 'balance_sheet' | 'cash_flow' | 'tax' | 'custom';
      period: string;
      generatedAt: string;
      status: 'generated' | 'processing' | 'failed';
      downloadUrl?: string;
    }>;
    taxData: {
      upcomingFiling: {
        id: string;
        name: string;
        type: 'federal' | 'state' | 'local' | 'sales' | 'property' | 'payroll' | 'other';
        dueDate: string;
        status: 'not_started' | 'in_progress' | 'filed' | 'paid' | 'overdue';
        amountDue: number;
        amountPaid: number;
        progress: number;
        documents: Array<{ name: string; type: string; size: string; uploadedAt: string }>;
      } | null;
      recentFilings: Array<{
        id: string;
        name: string;
        type: 'federal' | 'state' | 'local' | 'sales' | 'property' | 'payroll' | 'other';
        dueDate: string;
        status: 'not_started' | 'in_progress' | 'filed' | 'paid' | 'overdue';
        amountDue: number;
        amountPaid: number;
      }>;
      taxSummary: {
        totalPaid: number;
        totalDue: number;
        totalUpcoming: number;
        taxSavings: number;
        estimatedRefund: number;
      };
    };
  };
}

const useFinancialData = (businessId?: string) => {
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const queryClient = useQueryClient();
  const { socket } = useWebSocket();
  const { currentBusiness } = useBusiness();

  const fetchFinancialData = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/businesses/${id}/financials`);
      if (!response.ok) {
        throw new Error('Failed to fetch financial data');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching financial data:', error);
      throw error;
    }
  }, []);

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery<FinancialData>({
    queryKey: ['financialData', businessId],
    queryFn: () => businessId ? fetchFinancialData(businessId) : Promise.resolve(null),
    enabled: !!businessId,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Handle WebSocket updates
  useEffect(() => {
    if (!socket || !businessId) return;

    const handleFinancialUpdate = (update: { businessId: string; data: Partial<FinancialData> }) => {
      if (update.businessId === businessId) {
        queryClient.setQueryData<FinancialData>(['financialData', businessId], (oldData) => ({
          ...oldData!,
          ...update.data,
        }));
        setLastUpdated(new Date());
      }
    };

    const handleTransactionCreated = (transaction: any) => {
      if (transaction.businessId === businessId) {
        queryClient.invalidateQueries({ queryKey: ['financialData', businessId] });
      }
    };

    socket.on('financialUpdate', handleFinancialUpdate);
    socket.on('transactionCreated', handleTransactionCreated);

    return () => {
      socket.off('financialUpdate', handleFinancialUpdate);
      socket.off('transactionCreated', handleTransactionCreated);
    };
  }, [socket, businessId, queryClient]);

  // Auto-refresh data every 5 minutes
  useEffect(() => {
    if (!businessId) return;
    
    const interval = setInterval(() => {
      refetch();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [businessId, refetch]);

  // Generate mock data if no data is available
  const mockFinancialData: FinancialData = useCallback(() => {
    const now = new Date();
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    
    const monthlyMetrics = Array.from({ length: 6 }, (_, i) => {
      const month = (now.getMonth() - 5 + i + 12) % 12;
      const year = now.getFullYear() - (now.getMonth() - 5 + i < 0 ? 1 : 0);
      const revenue = Math.floor(Math.random() * 50000) + 50000;
      const expenses = Math.floor(Math.random() * 30000) + 20000;
      
      return {
        month: `${months[month]} ${year}`,
        revenue,
        expenses,
        profit: revenue - expenses,
      };
    });

    return {
      summary: {
        revenue: 325000,
        revenueChange: 12.5,
        expenses: 245000,
        expensesChange: 8.2,
        profit: 80000,
        profitChange: 24.7,
        cashFlow: 45000,
        cashFlowChange: 15.3,
      },
      metrics: {
        monthlyMetrics,
        accountBalances: [
          { id: '1', name: 'Business Checking', accountNumber: '****7890', balance: 125000, change: 5.2 },
          { id: '2', name: 'Savings Account', accountNumber: '****4321', balance: 250000, change: 3.8 },
          { id: '3', name: 'Credit Card', accountNumber: '****2109', balance: -12500, change: -2.1 },
          { id: '4', name: 'Payroll Account', accountNumber: '****8765', balance: 45000, change: 0 },
        ],
        financialReports: [
          {
            id: '1',
            name: 'Q2 2023 Income Statement',
            type: 'income_statement',
            period: 'Q2 2023',
            generatedAt: '2023-07-15T10:30:00Z',
            status: 'generated',
            downloadUrl: '/reports/income-statement-q2-2023.pdf',
          },
          {
            id: '2',
            name: 'Q2 2023 Balance Sheet',
            type: 'balance_sheet',
            period: 'Q2 2023',
            generatedAt: '2023-07-15T10:35:00Z',
            status: 'generated',
            downloadUrl: '/reports/balance-sheet-q2-2023.pdf',
          },
          {
            id: '3',
            name: 'Q2 2023 Cash Flow',
            type: 'cash_flow',
            period: 'Q2 2023',
            generatedAt: '2023-07-15T10:40:00Z',
            status: 'processing',
          },
        ],
        taxData: {
          upcomingFiling: {
            id: 'tax-1',
            name: 'Q3 2023 Estimated Tax',
            type: 'federal',
            dueDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'not_started',
            amountDue: 12500,
            amountPaid: 0,
            progress: 0,
            documents: [],
          },
          recentFilings: [
            {
              id: 'tax-2',
              name: 'Q2 2023 Estimated Tax',
              type: 'federal',
              dueDate: '2023-06-15T00:00:00Z',
              status: 'paid',
              amountDue: 11800,
              amountPaid: 11800,
            },
            {
              id: 'tax-3',
              name: 'Q1 2023 Estimated Tax',
              type: 'federal',
              dueDate: '2023-04-15T00:00:00Z',
              status: 'paid',
              amountDue: 11200,
              amountPaid: 11200,
            },
          ],
          taxSummary: {
            totalPaid: 23000,
            totalDue: 12500,
            totalUpcoming: 12500,
            taxSavings: 3200,
            estimatedRefund: 0,
          },
        },
      },
    };
  }, []);

  return {
    data: data || mockFinancialData(),
    isLoading: isLoading && !data,
    error,
    lastUpdated,
    refetch,
  };
};

export default useFinancialData;
