export interface FinancialSummary {
  revenue: number;
  expenses: number;
  profit: number;
  cashFlow: number;
  revenueChange: number;
  expensesChange: number;
  profitChange: number;
  cashFlowChange: number;
}

export interface Transaction {
  id: string;
  date: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER' | 'ADJUSTMENT';
  description?: string;
  reference?: string;
  status: 'PENDING' | 'CLEARED' | 'RECONCILED' | 'VOIDED';
  taxDeductible: boolean;
  taxCategory?: string;
  attachments?: string[];
  accountId: string;
  categoryId?: string;
  businessId: string;
  createdAt: string;
  updatedAt: string;
  category?: {
    id: string;
    name: string;
    type: string;
  };
  account?: {
    id: string;
    name: string;
    type: string;
  };
}

export interface Account {
  id: string;
  name: string;
  accountNumber: string;
  type: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
  balance: number;
  currency: string;
  isActive: boolean;
  description?: string;
  businessId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  type: 'INCOME' | 'EXPENSE' | 'ASSET' | 'LIABILITY' | 'EQUITY';
  description?: string;
  taxDeductible: boolean;
  businessId: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaxFiling {
  id: string;
  type: string;
  period: string;
  dueDate: string;
  status: 'DRAFT' | 'PENDING' | 'FILED' | 'PAID' | 'OVERDUE' | 'PARTIALLY_PAID' | 'CANCELLED';
  amountDue: number;
  amountPaid: number;
  paymentAccountId?: string;
  taxCategoryId?: string;
  businessId: string;
  createdAt: string;
  updatedAt: string;
  payments?: Payment[];
  taxCategory?: Category;
  paymentAccount?: Account;
}

export interface Payment {
  id: string;
  amount: number;
  date: string;
  method: 'CASH' | 'CHECK' | 'CREDIT_CARD' | 'BANK_TRANSFER' | 'DEBIT_CARD' | 'PAYPAL' | 'OTHER';
  referenceNumber?: string;
  notes?: string;
  taxFilingId: string;
  businessId: string;
  createdAt: string;
  updatedAt: string;
}

export interface FinancialReport {
  id: string;
  type: 'INCOME_STATEMENT' | 'BALANCE_SHEET' | 'CASH_FLOW' | 'TAX' | 'GENERAL_LEDGER' | 'TRIAL_BALANCE' | 'AGING_REPORT' | 'CUSTOM';
  title: string;
  description?: string;
  periodStart: string;
  periodEnd: string;
  fileUrl?: string;
  data?: any;
  businessId: string;
  createdAt: string;
  updatedAt: string;
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
  recentTransactions: Transaction[];
  upcomingTaxFiling: TaxFiling | null;
}
