import { logger } from '../../../utils/logger';
import { BankReconciliationAI } from './bankReconciliationAI';
import { FinancialStatementGenerator } from './financialStatementGenerator';
import { TaxComplianceAI } from './taxComplianceAI';
import { GeneralLedgerAI } from './generalLedgerAI';

export class AIAccountant {
  private reconciliationAI: BankReconciliationAI;
  private statementGenerator: FinancialStatementGenerator;
  private taxAI: TaxComplianceAI;
  private ledgerAI: GeneralLedgerAI;

  constructor() {
    this.reconciliationAI = new BankReconciliationAI();
    this.statementGenerator = new FinancialStatementGenerator();
    this.taxAI = new TaxComplianceAI();
    this.ledgerAI = new GeneralLedgerAI();
    logger.info('AI Accountant initialized');
  }

  async processTransaction(transaction: any) {
    // AI-powered transaction processing
    return { success: true, transaction };
  }

  async generateFinancials(businessId: string, period: string) {
    return this.statementGenerator.generateAllStatements(businessId, period);
  }

  async reconcileAccounts(businessId: string) {
    return this.reconciliationAI.reconcileAllAccounts(businessId);
  }

  async calculateTaxes(businessId: string, period: string) {
    return this.taxAI.calculateTaxLiability(businessId, period);
  }
}

export default new AIAccountant();
