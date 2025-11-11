export class CreateTransactionDto {
  businessId: string;
  date: Date;
  amount: number;
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
  categoryId?: string;
  description?: string;
  reference?: string;
  accountId: string;
  payee?: string;
  status?: 'PENDING' | 'CLEARED' | 'RECONCILED';
  taxDeductible?: boolean;
  taxCategory?: string;
  attachments?: string[];
}

export class UpdateTransactionDto {
  date?: Date;
  amount?: number;
  type?: 'INCOME' | 'EXPENSE' | 'TRANSFER';
  categoryId?: string | null;
  description?: string;
  reference?: string;
  accountId?: string;
  payee?: string;
  status?: 'PENDING' | 'CLEARED' | 'RECONCILED';
  taxDeductible?: boolean;
  taxCategory?: string | null;
  attachments?: string[];
}

export class GenerateReportDto {
  businessId: string;
  type: 'INCOME_STATEMENT' | 'BALANCE_SHEET' | 'CASH_FLOW' | 'TAX' | 'CUSTOM';
  startDate?: Date;
  endDate?: Date;
  format: 'PDF' | 'EXCEL' | 'CSV';
  includeDetails?: boolean;
  customTemplateId?: string;
}

export class FileTaxReturnDto {
  businessId: string;
  taxFilingId: string;
  paymentAmount: number;
  paymentDate: Date;
  paymentMethod: 'BANK_TRANSFER' | 'CREDIT_CARD' | 'CHECK' | 'OTHER';
  referenceNumber?: string;
  notes?: string;
  documents?: Array<{
    name: string;
    type: string;
    url: string;
    size: number;
  }>;
}
