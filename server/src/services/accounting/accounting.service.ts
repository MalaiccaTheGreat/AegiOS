import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTransactionDto, GenerateReportDto, FileTaxReturnDto } from './dto/accounting.dto';
import { FinancialData, TransactionWithCategory, TaxFiling } from './interfaces/accounting.interface';

@Injectable()
export class AccountingService {
  constructor(private prisma: PrismaService) {}

  async getFinancialData(businessId: string): Promise<FinancialData> {
    // Implementation from previous session
    // ...
  }

  async createTransaction(createTransactionDto: CreateTransactionDto) {
    return this.prisma.transaction.create({
      data: {
        ...createTransactionDto,
        amount: Number(createTransactionDto.amount),
      },
    });
  }

  async getTransaction(id: string) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id },
      include: { category: true },
    });

    if (!transaction) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }
    return transaction;
  }

  async generateReport(generateReportDto: GenerateReportDto) {
    const { type, startDate, endDate, businessId } = generateReportDto;
    
    const query: any = {
      where: {
        businessId,
        ...(startDate && { date: { gte: new Date(startDate) } }),
        ...(endDate && { date: { lte: new Date(endDate) } }),
      },
      include: { category: true },
    };

    const transactions = await this.prisma.transaction.findMany(query);

    // Generate different report types
    switch (type) {
      case 'INCOME_STATEMENT':
        return this.generateIncomeStatement(transactions);
      case 'BALANCE_SHEET':
        return this.generateBalanceSheet(businessId, new Date(endDate || new Date()));
      case 'CASH_FLOW':
        return this.generateCashFlowStatement(transactions);
      case 'TAX':
        return this.generateTaxReport(transactions);
      default:
        return transactions;
    }
  }

  private generateIncomeStatement(transactions: any[]) {
    const revenue = transactions
      .filter(t => t.type === 'INCOME')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const expenses = transactions
      .filter(t => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    return {
      type: 'INCOME_STATEMENT',
      period: {
        start: transactions.length ? new Date(Math.min(...transactions.map(t => new Date(t.date).getTime()))) : null,
        end: transactions.length ? new Date(Math.max(...transactions.map(t => new Date(t.date).getTime()))) : null,
      },
      revenue,
      expenses,
      netIncome: revenue - expenses,
    };
  }

  private async generateBalanceSheet(businessId: string, asOfDate: Date) {
    const assets = await this.prisma.account.findMany({
      where: {
        businessId,
        type: 'ASSET',
      },
    });

    const liabilities = await this.prisma.account.findMany({
      where: {
        businessId,
        type: 'LIABILITY',
      },
    });

    const equity = await this.prisma.account.findMany({
      where: {
        businessId,
        type: 'EQUITY',
      },
    });

    const totalAssets = assets.reduce((sum, a) => sum + Number(a.balance), 0);
    const totalLiabilities = liabilities.reduce((sum, l) => sum + Number(l.balance), 0);
    const totalEquity = equity.reduce((sum, e) => sum + Number(e.balance), 0);

    return {
      type: 'BALANCE_SHEET',
      asOfDate,
      assets: {
        items: assets,
        total: totalAssets,
      },
      liabilities: {
        items: liabilities,
        total: totalLiabilities,
      },
      equity: {
        items: equity,
        total: totalEquity,
      },
      total: totalLiabilities + totalEquity, // Should equal totalAssets
    };
  }

  private generateCashFlowStatement(transactions: any[]) {
    const operating = transactions
      .filter(t => t.category?.type === 'OPERATING')
      .reduce((sum, t) => sum + (t.type === 'INCOME' ? 1 : -1) * Number(t.amount), 0);

    const investing = transactions
      .filter(t => t.category?.type === 'INVESTING')
      .reduce((sum, t) => sum + (t.type === 'INCOME' ? 1 : -1) * Number(t.amount), 0);

    const financing = transactions
      .filter(t => t.category?.type === 'FINANCING')
      .reduce((sum, t) => sum + (t.type === 'INCOME' ? 1 : -1) * Number(t.amount), 0);

    return {
      type: 'CASH_FLOW',
      period: {
        start: transactions.length ? new Date(Math.min(...transactions.map(t => new Date(t.date).getTime()))) : null,
        end: transactions.length ? new Date(Math.max(...transactions.map(t => new Date(t.date).getTime()))) : null,
      },
      operating,
      investing,
      financing,
      netChange: operating + investing + financing,
    };
  }

  private generateTaxReport(transactions: any[]) {
    const taxableIncome = transactions
      .filter(t => t.taxable)
      .reduce((sum, t) => sum + (t.type === 'INCOME' ? 1 : -1) * Number(t.amount), 0);

    const taxDeductions = transactions
      .filter(t => t.taxDeductible)
      .reduce((sum, t) => sum + (t.type === 'EXPENSE' ? 1 : 0) * Number(t.amount), 0);

    // This is a simplified tax calculation
    const taxOwed = Math.max(0, taxableIncome - taxDeductions) * 0.2; // 20% flat rate for example

    return {
      type: 'TAX',
      period: {
        start: transactions.length ? new Date(Math.min(...transactions.map(t => new Date(t.date).getTime()))) : null,
        end: transactions.length ? new Date(Math.max(...transactions.map(t => new Date(t.date).getTime()))) : null,
      },
      taxableIncome,
      taxDeductions,
      taxOwed,
      transactions: transactions.filter(t => t.taxable || t.taxDeductible),
    };
  }

  async getTaxFilings(businessId: string): Promise<TaxFiling[]> {
    return this.prisma.taxFiling.findMany({
      where: { businessId },
      orderBy: { dueDate: 'desc' },
    });
  }

  async fileTaxReturn(fileTaxReturnDto: FileTaxReturnDto) {
    const { taxFilingId, paymentAmount, paymentDate, paymentMethod } = fileTaxReturnDto;
    
    const taxFiling = await this.prisma.taxFiling.findUnique({
      where: { id: taxFilingId },
    });

    if (!taxFiling) {
      throw new NotFoundException(`Tax filing with ID ${taxFilingId} not found`);
    }

    // Record the payment
    const payment = await this.prisma.payment.create({
      data: {
        amount: paymentAmount,
        date: new Date(paymentDate),
        method: paymentMethod,
        referenceNumber: fileTaxReturnDto.referenceNumber,
        notes: fileTaxReturnDto.notes,
        taxFilingId,
        businessId: taxFiling.businessId,
      },
    });

    // Update the tax filing status
    const updatedFiling = await this.prisma.taxFiling.update({
      where: { id: taxFilingId },
      data: {
        status: paymentAmount >= taxFiling.amountDue ? 'PAID' : 'PARTIALLY_PAID',
        amountPaid: { increment: paymentAmount },
      },
    });

    // Record the transaction
    await this.createTransaction({
      businessId: taxFiling.businessId,
      date: new Date(paymentDate),
      amount: paymentAmount,
      type: 'EXPENSE',
      categoryId: taxFiling.taxCategoryId,
      description: `Tax payment - ${taxFiling.period}`,
      reference: payment.id,
      accountId: taxFiling.paymentAccountId,
      taxDeductible: true,
      taxCategory: 'TAX_PAYMENT',
    });

    return {
      filing: updatedFiling,
      payment,
    };
  }

  async getDashboardData(businessId: string) {
    const [transactions, accounts, taxFilings] = await Promise.all([
      this.prisma.transaction.findMany({
        where: { businessId },
        orderBy: { date: 'desc' },
        take: 10,
        include: { category: true },
      }),
      this.prisma.account.findMany({
        where: { businessId },
      }),
      this.prisma.taxFiling.findMany({
        where: { 
          businessId,
          dueDate: { gte: new Date() },
          status: { notIn: ['PAID', 'FILED'] },
        },
        orderBy: { dueDate: 'asc' },
        take: 3,
      }),
    ]);

    const totalAssets = accounts
      .filter(a => a.type === 'ASSET')
      .reduce((sum, a) => sum + Number(a.balance), 0);

    const totalLiabilities = accounts
      .filter(a => a.type === 'LIABILITY')
      .reduce((sum, a) => sum + Number(a.balance), 0);

    const netWorth = totalAssets - totalLiabilities;

    // Calculate income and expenses for the current month
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const monthlyTransactions = await this.prisma.transaction.findMany({
      where: {
        businessId,
        date: { gte: firstDay },
      },
    });

    const income = monthlyTransactions
      .filter(t => t.type === 'INCOME')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const expenses = monthlyTransactions
      .filter(t => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    return {
      summary: {
        netWorth,
        totalAssets,
        totalLiabilities,
        monthlyIncome: income,
        monthlyExpenses: expenses,
        monthlyProfit: income - expenses,
      },
      recentTransactions: transactions,
      upcomingTaxFiling: taxFilings[0] || null,
    };
  }
}
