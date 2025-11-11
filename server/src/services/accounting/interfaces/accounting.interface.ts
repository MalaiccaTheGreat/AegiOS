import { Transaction, TaxFiling as PrismaTaxFiling, Account, FinancialReport } from '@prisma/client';

export interface TransactionWithCategory extends Transaction {
  category?: {
    id: string;
    name: string;
    type: string;
  };
}

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
    financialReports: FinancialReport[];
    taxData: {
      upcomingFiling: TaxFiling | null;
      recentFilings: TaxFiling[];
      taxSummary: TaxSummary;
    };
  };
}

export interface TaxFiling extends PrismaTaxFiling {
  payments?: Array<{
    id: string;
    amount: number;
    date: Date;
    method: string;
    referenceNumber?: string;
    notes?: string;
  }>;
}

export interface TaxSummary {
  totalPaid: number;
  totalDue: number;
  totalUpcoming: number;
  taxSavings: number;
  estimatedRefund: number;
}

export interface DashboardData {
  summary: {
    netWorth: number;
    totalAssets: number;
    totalLiabilities: number;
    monthlyIncome: number;
    monthlyExpenses: number;
    monthlyProfit: number;
  };
  recentTransactions: TransactionWithCategory[];
  upcomingTaxFiling: TaxFiling | null;
}

export interface ReportResult {
  type: string;
  period: {
    start: Date | null;
    end: Date | null;
  };
  [key: string]: any;
}
