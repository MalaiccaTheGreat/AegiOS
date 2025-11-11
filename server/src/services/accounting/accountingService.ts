import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTransactionDto, UpdateTransactionDto } from './dto/accounting.dto';
import { FinancialData, TaxFiling } from './interfaces/accounting.interface';

@Injectable()
export class AccountingService {
  constructor(private prisma: PrismaService) {}

  async getFinancialData(businessId: string): Promise<FinancialData> {
    // Get transactions for the last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const transactions = await this.prisma.transaction.findMany({
      where: {
        businessId,
        date: { gte: sixMonthsAgo },
      },
      include: {
        category: true,
      },
    });

    // Calculate summary metrics
    const currentPeriod = new Date();
    currentPeriod.setMonth(currentPeriod.getMonth() - 1);
    const previousPeriod = new Date(currentPeriod);
    previousPeriod.setMonth(previousPeriod.getMonth() - 1);

    const currentPeriodTransactions = transactions.filter(
      (t) => new Date(t.date) >= currentPeriod,
    );
    const previousPeriodTransactions = transactions.filter(
      (t) =>
        new Date(t.date) >= previousPeriod && new Date(t.date) < currentPeriod,
    );

    const calculateMetrics = (transactions: any[]) => {
      const revenue = transactions
        .filter((t) => t.type === 'INCOME')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const expenses = transactions
        .filter((t) => t.type === 'EXPENSE')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      return {
        revenue,
        expenses,
        profit: revenue - expenses,
        cashFlow: revenue - expenses,
      };
    };

    const currentMetrics = calculateMetrics(currentPeriodTransactions);
    const previousMetrics = calculateMetrics(previousPeriodTransactions);

    const getPercentageChange = (current: number, previous: number) => {
      if (previous === 0) return 0;
      return ((current - previous) / Math.abs(previous)) * 100;
    };

    // Get account balances
    const accounts = await this.prisma.account.findMany({
      where: { businessId },
    });

    // Get tax data
    const taxFilings = await this.getTaxFilings(businessId);
    const upcomingFiling = taxFilings.find(
      (f) =>
        new Date(f.dueDate) > new Date() &&
        !['filed', 'paid'].includes(f.status),
    );

    return {
      summary: {
        revenue: currentMetrics.revenue,
        revenueChange: getPercentageChange(
          currentMetrics.revenue,
          previousMetrics.revenue,
        ),
        expenses: currentMetrics.expenses,
        expensesChange: getPercentageChange(
          currentMetrics.expenses,
          previousMetrics.expenses,
        ),
        profit: currentMetrics.profit,
        profitChange: getPercentageChange(
          currentMetrics.profit,
          previousMetrics.profit,
        ),
        cashFlow: currentMetrics.cashFlow,
        cashFlowChange: getPercentageChange(
          currentMetrics.cashFlow,
          previousMetrics.cashFlow,
        ),
      },
      metrics: {
        monthlyMetrics: this.calculateMonthlyMetrics(transactions),
        accountBalances: accounts.map((account) => ({
          id: account.id,
          name: account.name,
          accountNumber: account.accountNumber,
          balance: Number(account.balance),
          change: 0, // Would calculate this based on previous period
        })),
        financialReports: await this.getFinancialReports(businessId),
        taxData: {
          upcomingFiling: upcomingFiling || null,
          recentFilings: taxFilings.filter((f) => f !== upcomingFiling).slice(0, 5),
          taxSummary: this.calculateTaxSummary(taxFilings),
        },
      },
    };
  }

  private calculateMonthlyMetrics(transactions: any[]) {
    const months: Record<string, { revenue: number; expenses: number }> = {};
    
    transactions.forEach((transaction) => {
      const date = new Date(transaction.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!months[monthKey]) {
        months[monthKey] = { revenue: 0, expenses: 0 };
      }
      
      if (transaction.type === 'INCOME') {
        months[monthKey].revenue += Number(transaction.amount);
      } else {
        months[monthKey].expenses += Number(transaction.amount);
      }
    });

    // Convert to array and sort by date
    return Object.entries(months)
      .map(([month, data]) => ({
        month,
        revenue: data.revenue,
        expenses: data.expenses,
        profit: data.revenue - data.expenses,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }

  private async getFinancialReports(businessId: string) {
    return this.prisma.financialReport.findMany({
      where: { businessId },
      orderBy: { generatedAt: 'desc' },
      take: 10,
    });
  }

  private async getTaxFilings(businessId: string): Promise<TaxFiling[]> {
    return this.prisma.taxFiling.findMany({
      where: { businessId },
      orderBy: { dueDate: 'desc' },
    });
  }

  private calculateTaxSummary(filings: TaxFiling[]) {
    const now = new Date();
    const currentYear = now.getFullYear();
    
    const currentYearFilings = filings.filter(
      (f) => new Date(f.dueDate).getFullYear() === currentYear,
    );

    const totalPaid = currentYearFilings
      .filter((f) => ['filed', 'paid'].includes(f.status))
      .reduce((sum, f) => sum + Number(f.amountPaid || 0), 0);

    const totalDue = currentYearFilings
      .filter((f) => !['filed', 'paid'].includes(f.status))
      .reduce((sum, f) => sum + (Number(f.amountDue) - Number(f.amountPaid || 0)), 0);

    const upcomingFiling = currentYearFilings.find(
      (f) => new Date(f.dueDate) > now && !['filed', 'paid'].includes(f.status),
    );

    return {
      totalPaid,
      totalDue,
      totalUpcoming: upcomingFiling 
        ? Number(upcomingFiling.amountDue) - Number(upcomingFiling.amountPaid || 0) 
        : 0,
      taxSavings: 0, // Would calculate based on deductions, credits, etc.
      estimatedRefund: 0, // Would calculate based on payments and liability
    };
  }

  // Additional CRUD methods for transactions, reports, etc.
  async createTransaction(createTransactionDto: CreateTransactionDto) {
    return this.prisma.transaction.create({
      data: {
        ...createTransactionDto,
        amount: Number(createTransactionDto.amount),
      },
    });
  }

  async updateTransaction(id: string, updateTransactionDto: UpdateTransactionDto) {
    return this.prisma.transaction.update({
      where: { id },
      data: {
        ...updateTransactionDto,
        ...(updateTransactionDto.amount && { 
          amount: Number(updateTransactionDto.amount) 
        }),
      },
    });
  }

  async deleteTransaction(id: string) {
    return this.prisma.transaction.delete({ where: { id } });
  }

  // WebSocket event handlers
  async handleTransactionCreated(transaction: any) {
    // Invalidate cache or push update to connected clients
    // This would be called from a WebSocket gateway
  }
}
