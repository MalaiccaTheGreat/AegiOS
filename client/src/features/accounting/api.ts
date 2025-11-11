import { FinancialSummary, Transaction } from './types';

const API_BASE_URL = '/api/accounting';

export const accountingApi = {
  // Fetch financial summary for the dashboard
  async getFinancialSummary(businessId: string): Promise<FinancialSummary> {
    const response = await fetch(`${API_BASE_URL}/dashboard?businessId=${businessId}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch financial summary');
    }
    
    return response.json();
  },

  // Fetch recent transactions
  async getRecentTransactions(businessId: string, limit: number = 10): Promise<Transaction[]> {
    const response = await fetch(
      `${API_BASE_URL}/transactions?businessId=${businessId}&limit=${limit}&sortBy=date&sortOrder=desc`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      }
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch transactions');
    }
    
    return response.json();
  },

  // Create a new transaction
  async createTransaction(transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) {
    const response = await fetch(`${API_BASE_URL}/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(transaction),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create transaction');
    }
    
    return response.json();
  },

  // Update an existing transaction
  async updateTransaction(id: string, updates: Partial<Transaction>) {
    const response = await fetch(`${API_BASE_URL}/transactions/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(updates),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update transaction');
    }
    
    return response.json();
  },

  // Delete a transaction
  async deleteTransaction(id: string) {
    const response = await fetch(`${API_BASE_URL}/transactions/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete transaction');
    }
    
    return true;
  },

  // Generate a financial report
  async generateReport(params: {
    businessId: string;
    type: 'INCOME_STATEMENT' | 'BALANCE_SHEET' | 'CASH_FLOW' | 'TAX';
    startDate?: string;
    endDate?: string;
  }) {
    const { businessId, ...queryParams } = params;
    const queryString = new URLSearchParams(
      Object.entries(queryParams).filter(([_, v]) => v !== undefined) as [string, string][]
    ).toString();
    
    const response = await fetch(
      `${API_BASE_URL}/reports/generate?businessId=${businessId}&${queryString}`,
      {
        credentials: 'include',
      }
    );
    
    if (!response.ok) {
      throw new Error('Failed to generate report');
    }
    
    return response.blob();
  },

  // Get tax filings
  async getTaxFilings(businessId: string) {
    const response = await fetch(`${API_BASE_URL}/taxes/filings?businessId=${businessId}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch tax filings');
    }
    
    return response.json();
  },

  // File a tax return
  async fileTaxReturn(data: {
    businessId: string;
    taxFilingId: string;
    paymentAmount: number;
    paymentDate: string;
    paymentMethod: string;
    referenceNumber?: string;
    notes?: string;
  }) {
    const response = await fetch(`${API_BASE_URL}/taxes/file`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to file tax return');
    }
    
    return response.json();
  },
};
