import { logger } from '../../../utils/logger';

export enum AccountType {
  ASSET = 'ASSET',
  LIABILITY = 'LIABILITY',
  EQUITY = 'EQUITY',
  REVENUE = 'REVENUE',
  EXPENSE = 'EXPENSE',
}

export enum AccountSubtype {
  // Asset subtypes
  CURRENT_ASSET = 'CURRENT_ASSET',
  FIXED_ASSET = 'FIXED_ASSET',
  INVENTORY = 'INVENTORY',
  RECEIVABLE = 'RECEIVABLE',
  BANK = 'BANK',
  
  // Liability subtypes
  CURRENT_LIABILITY = 'CURRENT_LIABILITY',
  LONG_TERM_LIABILITY = 'LONG_TERM_LIABILITY',
  PAYABLE = 'PAYABLE',
  
  // Equity subtypes
  COMMON_STOCK = 'COMMON_STOCK',
  RETAINED_EARNINGS = 'RETAINED_EARNINGS',
  
  // Revenue subtypes
  OPERATING_REVENUE = 'OPERATING_REVENUE',
  OTHER_REVENUE = 'OTHER_REVENUE',
  
  // Expense subtypes
  COST_OF_GOODS_SOLD = 'COST_OF_GOODS_SOLD',
  OPERATING_EXPENSE = 'OPERATING_EXPENSE',
  PAYROLL_EXPENSE = 'PAYROLL_EXPENSE',
  DEPRECIATION = 'DEPRECIATION',
  TAX = 'TAX',
}

export interface Account {
  id: string;
  businessId: string;
  parentId: string | null;
  code: string;
  name: string;
  type: AccountType;
  subtype: AccountSubtype;
  currency: string;
  isActive: boolean;
  isSystemAccount: boolean;
  description?: string;
  tags?: string[];
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

export class ChartOfAccounts {
  private accounts: Map<string, Account> = new Map();
  private accountTree: Map<string, Account[]> = new Map();
  private businessId: string;

  constructor(businessId: string) {
    this.businessId = businessId;
    logger.info(`Initialized Chart of Accounts for business ${businessId}`);
  }

  async initializeDefaultAccounts(createdBy: string): Promise<void> {
    const defaultAccounts: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>[] = [
      // Assets
      {
        businessId: this.businessId,
        parentId: null,
        code: '1000',
        name: 'Assets',
        type: AccountType.ASSET,
        subtype: AccountSubtype.CURRENT_ASSET,
        currency: 'USD',
        isActive: true,
        isSystemAccount: true,
        createdBy,
        updatedBy: createdBy,
      },
      {
        businessId: this.businessId,
        parentId: '1000',
        code: '1100',
        name: 'Current Assets',
        type: AccountType.ASSET,
        subtype: AccountSubtype.CURRENT_ASSET,
        currency: 'USD',
        isActive: true,
        isSystemAccount: true,
        createdBy,
        updatedBy: createdBy,
      },
      {
        businessId: this.businessId,
        parentId: '1100',
        code: '1110',
        name: 'Cash and Cash Equivalents',
        type: AccountType.ASSET,
        subtype: AccountSubtype.BANK,
        currency: 'USD',
        isActive: true,
        isSystemAccount: true,
        createdBy,
        updatedBy: createdBy,
      },
      // Add more default accounts as needed...
    ];

    // Add default accounts to the chart
    for (const account of defaultAccounts) {
      await this.addAccount({
        ...account,
        id: account.code,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }

  async addAccount(account: Account): Promise<Account> {
    if (this.accounts.has(account.id)) {
      throw new Error(`Account with ID ${account.id} already exists`);
    }

    // Validate parent exists if provided
    if (account.parentId && !this.accounts.has(account.parentId)) {
      throw new Error(`Parent account ${account.parentId} not found`);
    }

    // Add to accounts map
    this.accounts.set(account.id, account);

    // Update account tree
    const parentId = account.parentId || '';
    if (!this.accountTree.has(parentId)) {
      this.accountTree.set(parentId, []);
    }
    this.accountTree.get(parentId)?.push(account);

    logger.info(`Added account ${account.code} - ${account.name}`);
    return account;
  }

  async updateAccount(id: string, updates: Partial<Account>): Promise<Account> {
    const account = this.accounts.get(id);
    if (!account) {
      throw new Error(`Account ${id} not found`);
    }

    // Prevent changing account type for system accounts
    if (account.isSystemAccount && updates.type && updates.type !== account.type) {
      throw new Error('Cannot change type of system account');
    }

    // Update account
    const updatedAccount = { ...account, ...updates, updatedAt: new Date() };
    this.accounts.set(id, updatedAccount);

    // Update in account tree if parent changed
    if (updates.parentId !== undefined && updates.parentId !== account.parentId) {
      // Remove from old parent
      const oldParentId = account.parentId || '';
      const oldSiblings = this.accountTree.get(oldParentId) || [];
      this.accountTree.set(
        oldParentId,
        oldSiblings.filter(a => a.id !== id)
      );

      // Add to new parent
      const newParentId = updates.parentId || '';
      if (!this.accountTree.has(newParentId)) {
        this.accountTree.set(newParentId, []);
      }
      this.accountTree.get(newParentId)?.push(updatedAccount);
    }

    logger.info(`Updated account ${id}`);
    return updatedAccount;
  }

  async getAccount(id: string): Promise<Account | undefined> {
    return this.accounts.get(id);
  }

  async getAccountsByType(type: AccountType): Promise<Account[]> {
    return Array.from(this.accounts.values()).filter(a => a.type === type);
  }

  async getAccountTree(parentId: string | null = null): Promise<Account[]> {
    const children = this.accountTree.get(parentId || '') || [];
    return Promise.all(
      children.map(async account => ({
        ...account,
        children: await this.getAccountTree(account.id)
      }))
    );
  }

  async searchAccounts(query: string, options: {
    types?: AccountType[];
    subtypes?: AccountSubtype[];
    isActive?: boolean;
  } = {}): Promise<Account[]> {
    const { types = [], subtypes = [], isActive } = options;
    
    return Array.from(this.accounts.values()).filter(account => {
      // Filter by query (case-insensitive search in code and name)
      const matchesQuery = !query || 
        account.code.toLowerCase().includes(query.toLowerCase()) ||
        account.name.toLowerCase().includes(query.toLowerCase()) ||
        account.description?.toLowerCase().includes(query.toLowerCase());
      
      // Filter by type
      const matchesType = types.length === 0 || types.includes(account.type);
      
      // Filter by subtype
      const matchesSubtype = subtypes.length === 0 || subtypes.includes(account.subtype);
      
      // Filter by active status
      const matchesActive = isActive === undefined || account.isActive === isActive;
      
      return matchesQuery && matchesType && matchesSubtype && matchesActive;
    });
  }

  async deactivateAccount(id: string): Promise<void> {
    const account = await this.getAccount(id);
    if (!account) {
      throw new Error(`Account ${id} not found`);
    }
    
    if (account.isSystemAccount) {
      throw new Error('Cannot deactivate system account');
    }
    
    await this.updateAccount(id, { isActive: false });
    logger.info(`Deactivated account ${id}`);
  }
}

export default ChartOfAccounts;
