import { logger } from '../../../utils/logger';
import { Account } from './chartOfAccounts';

export interface JournalEntryLine {
  accountId: string;
  accountCode?: string;
  accountName?: string;
  debit: number;
  credit: number;
  description?: string;
  reference?: string;
  metadata?: Record<string, any>;
}

export interface JournalEntry {
  id: string;
  businessId: string;
  date: Date;
  reference: string;
  description: string;
  entries: JournalEntryLine[];
  isReversing: boolean;
  reversedById?: string;
  createdBy: string;
  updatedBy: string;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
}

export interface AccountBalance {
  accountId: string;
  accountCode: string;
  accountName: string;
  accountType: string;
  balance: number;
  debitTotal: number;
  creditTotal: number;
  periodStart: Date;
  periodEnd: Date;
}

export interface TrialBalanceLine {
  accountId: string;
  accountCode: string;
  accountName: string;
  accountType: string;
  debit: number;
  credit: number;
  balance: number;
}

export interface TrialBalance {
  businessId: string;
  asOf: Date;
  startDate?: Date;
  endDate?: Date;
  accounts: TrialBalanceLine[];
  totalDebit: number;
  totalCredit: number;
  isBalanced: boolean;
}

export class GeneralLedger {
  private entries: Map<string, JournalEntry> = new Map();
  private accountBalances: Map<string, AccountBalance> = new Map();
  private businessId: string;

  constructor(businessId: string) {
    this.businessId = businessId;
    logger.info(`Initialized General Ledger for business ${businessId}`);
  }

  private validateJournalEntry(entry: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>): void {
    // Check if entry has at least two lines
    if (entry.entries.length < 2) {
      throw new Error('Journal entry must have at least two lines');
    }

    // Calculate total debits and credits
    const totalDebit = entry.entries.reduce((sum, line) => sum + (line.debit || 0), 0);
    const totalCredit = entry.entries.reduce((sum, line) => sum + (line.credit || 0), 0);

    // Check if debits equal credits (with tolerance for floating point arithmetic)
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new Error(`Debits (${totalDebit}) do not equal credits (${totalCredit})`);
    }
  }

  async recordEntry(entry: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<JournalEntry> {
    try {
      // Validate the journal entry
      this.validateJournalEntry(entry);

      // Create the journal entry
      const journalEntry: JournalEntry = {
        ...entry,
        id: `je_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Update account balances
      for (const line of journalEntry.entries) {
        const accountId = line.accountId;
        const accountKey = `${accountId}_${this.getPeriodKey(journalEntry.date)}`;
        
        // Get or create account balance
        let balance = this.accountBalances.get(accountKey) || {
          accountId,
          accountCode: line.accountCode || '',
          accountName: line.accountName || '',
          accountType: '', // Would be populated from account service
          balance: 0,
          debitTotal: 0,
          creditTotal: 0,
          periodStart: this.getPeriodStart(journalEntry.date),
          periodEnd: this.getPeriodEnd(journalEntry.date),
        };

        // Update balance
        balance.debitTotal += line.debit || 0;
        balance.creditTotal += line.credit || 0;
        balance.balance = balance.debitTotal - balance.creditTotal;

        // Store updated balance
        this.accountBalances.set(accountKey, balance);
      }

      // Store the journal entry
      this.entries.set(journalEntry.id, journalEntry);
      logger.info(`Recorded journal entry ${journalEntry.id} with ${journalEntry.entries.length} lines`);

      return journalEntry;
    } catch (error) {
      logger.error('Error recording journal entry:', error);
      throw error;
    }
  }

  async getJournalEntry(id: string): Promise<JournalEntry | undefined> {
    return this.entries.get(id);
  }

  async getAccountBalance(accountId: string, asOf: Date = new Date()): Promise<AccountBalance> {
    const periodKey = this.getPeriodKey(asOf);
    const accountKey = `${accountId}_${periodKey}`;
    
    const balance = this.accountBalances.get(accountKey);
    if (!balance) {
      return {
        accountId,
        accountCode: '',
        accountName: '',
        accountType: '',
        balance: 0,
        debitTotal: 0,
        creditTotal: 0,
        periodStart: this.getPeriodStart(asOf),
        periodEnd: this.getPeriodEnd(asOf),
      };
    }
    
    return balance;
  }

  async getTrialBalance(asOf: Date = new Date()): Promise<TrialBalance> {
    const periodKey = this.getPeriodKey(asOf);
    const accounts = new Map<string, TrialBalanceLine>();
    
    // Aggregate balances for all accounts in the period
    for (const [key, balance] of this.accountBalances.entries()) {
      if (key.endsWith(periodKey)) {
        accounts.set(balance.accountId, {
          accountId: balance.accountId,
          accountCode: balance.accountCode,
          accountName: balance.accountName,
          accountType: balance.accountType,
          debit: balance.debitTotal,
          credit: balance.creditTotal,
          balance: balance.balance,
        });
      }
    }
    
    // Calculate totals
    let totalDebit = 0;
    let totalCredit = 0;
    
    for (const account of accounts.values()) {
      totalDebit += account.debit;
      totalCredit += account.credit;
    }
    
    return {
      businessId: this.businessId,
      asOf,
      accounts: Array.from(accounts.values()),
      totalDebit,
      totalCredit,
      isBalanced: Math.abs(totalDebit - totalCredit) < 0.01, // Allow for floating point precision
    };
  }

  async getAccountHistory(accountId: string, options: {
    startDate?: Date;
    endDate?: Date;
  } = {}): Promise<{
    accountId: string;
    startDate?: Date;
    endDate?: Date;
    startBalance: number;
    endBalance: number;
    entries: Array<{
      date: Date;
      entryId: string;
      reference: string;
      description: string;
      debit: number;
      credit: number;
      balance: number;
    }>;
  }> {
    const { startDate, endDate = new Date() } = options;
    
    const history: Array<{
      date: Date;
      entryId: string;
      reference: string;
      description: string;
      debit: number;
      credit: number;
      balance: number;
    }> = [];

    let runningBalance = 0;
    
    // Get all relevant journal entries
    const entries = Array.from(this.entries.values())
      .filter(entry => {
        const entryDate = entry.date;
        return (
          entry.entries.some(e => e.accountId === accountId) &&
          (!startDate || entryDate >= startDate) &&
          (!endDate || entryDate <= endDate)
        );
      })
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    // Process each entry to build the history
    for (const entry of entries) {
      const line = entry.entries.find(e => e.accountId === accountId);
      if (!line) continue;

      runningBalance += (line.debit || 0) - (line.credit || 0);

      history.push({
        date: entry.date,
        entryId: entry.id,
        reference: entry.reference,
        description: line.description || entry.description,
        debit: line.debit || 0,
        credit: line.credit || 0,
        balance: runningBalance,
      });
    }

    return {
      accountId,
      startDate,
      endDate,
      startBalance: 0, // Would be calculated from entries before startDate in a real system
      endBalance: runningBalance,
      entries,
    };
  }

  private getPeriodKey(date: Date): string {
    // Group by month for simplicity; could be adjusted for different periods
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  private getPeriodStart(date: Date): Date {
    // Start of month
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }

  private getPeriodEnd(date: Date): Date {
    // End of month
    return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
  }
}

export default GeneralLedger;
