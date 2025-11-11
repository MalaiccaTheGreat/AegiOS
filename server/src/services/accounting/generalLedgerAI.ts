import { logger } from '../../../utils/logger';

interface JournalEntry {
  id: string;
  date: Date;
  reference: string;
  description: string;
  entries: {
    accountId: string;
    accountName: string;
    debit: number;
    credit: number;
  }[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export class GeneralLedgerAI {
  private entries: JournalEntry[] = [];
  private accountBalances: Record<string, number> = {};

  constructor() {
    logger.info('General Ledger AI initialized');
  }

  async recordTransaction(entry: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<JournalEntry> {
    try {
      // Validate the entry (debits must equal credits)
      const totalDebit = entry.entries.reduce((sum, e) => sum + (e.debit || 0), 0);
      const totalCredit = entry.entries.reduce((sum, e) => sum + (e.credit || 0), 0);

      if (Math.abs(totalDebit - totalCredit) > 0.01) { // Allow for floating point precision
        throw new Error('Debits and credits must balance');
      }

      // Create the journal entry
      const journalEntry: JournalEntry = {
        ...entry,
        id: `je_${Date.now()}`,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Update account balances
      for (const line of journalEntry.entries) {
        const accountId = line.accountId;
        const netAmount = (line.debit || 0) - (line.credit || 0);
        
        this.accountBalances[accountId] = (this.accountBalances[accountId] || 0) + netAmount;
      }

      // Store the entry
      this.entries.push(journalEntry);
      logger.info(`Recorded journal entry ${journalEntry.id} with ${journalEntry.entries.length} lines`);

      return journalEntry;
    } catch (error) {
      logger.error('Error recording transaction:', error);
      throw error;
    }
  }

  async getAccountBalance(accountId: string): Promise<number> {
    return this.accountBalances[accountId] || 0;
  }

  async getTrialBalance() {
    const accounts = new Set<string>();
    
    // Collect all account IDs
    for (const entry of this.entries) {
      for (const line of entry.entries) {
        accounts.add(line.accountId);
      }
    }

    // Calculate balances
    const trialBalance = Array.from(accounts).map(accountId => ({
      accountId,
      balance: this.accountBalances[accountId] || 0
    }));

    const totalDebit = trialBalance
      .filter(a => a.balance > 0)
      .reduce((sum, a) => sum + a.balance, 0);
      
    const totalCredit = Math.abs(trialBalance
      .filter(a => a.balance < 0)
      .reduce((sum, a) => sum + a.balance, 0));

    return {
      date: new Date(),
      accounts: trialBalance,
      totalDebit,
      totalCredit,
      isBalanced: Math.abs(totalDebit - totalCredit) < 0.01 // Allow for floating point precision
    };
  }

  async getJournalEntries(options: {
    startDate?: Date;
    endDate?: Date;
    accountId?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ entries: JournalEntry[]; total: number }> {
    let filtered = [...this.entries];

    // Apply filters
    if (options.startDate) {
      filtered = filtered.filter(e => e.date >= options.startDate!);
    }
    
    if (options.endDate) {
      filtered = filtered.filter(e => e.date <= options.endDate!);
    }
    
    if (options.accountId) {
      filtered = filtered.filter(e => 
        e.entries.some(line => line.accountId === options.accountId)
      );
    }

    const total = filtered.length;
    
    // Apply pagination
    if (options.limit !== undefined) {
      const offset = options.offset || 0;
      filtered = filtered.slice(offset, offset + options.limit);
    }

    return { entries: filtered, total };
  }

  async getAccountHistory(accountId: string, options: {
    startDate?: Date;
    endDate?: Date;
  } = {}) {
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
    const { entries } = await this.getJournalEntries({
      accountId,
      startDate: options.startDate,
      endDate: options.endDate
    });

    // Process each entry to build the history
    for (const entry of entries) {
      const line = entry.entries.find(e => e.accountId === accountId);
      if (!line) continue;

      runningBalance += (line.debit || 0) - (line.credit || 0);

      history.push({
        date: entry.date,
        entryId: entry.id,
        reference: entry.reference,
        description: entry.description,
        debit: line.debit || 0,
        credit: line.credit || 0,
        balance: runningBalance
      });
    }

    return {
      accountId,
      startDate: options.startDate,
      endDate: options.endDate,
      startBalance: 0, // Would be calculated from entries before startDate in a real system
      endBalance: runningBalance,
      history
    };
  }
}

export default new GeneralLedgerAI();
