import { Router } from 'express';
import { authenticateJWT, requireRole } from '../../middleware/auth';
import { AccountType, ChartOfAccounts } from '../../models/accounting/chartOfAccounts';
import { GeneralLedger } from '../../models/accounting/generalLedger';
import { logger } from '../../../utils/logger';
import AIAccountant from '../../services/accounting/aiAccountant';
import BankReconciliationAI from '../../services/accounting/bankReconciliationAI';
import FinancialStatementGenerator from '../../services/accounting/financialStatementGenerator';
import TaxComplianceAI from '../../services/accounting/taxComplianceAI';

const router = Router();

// Initialize accounting services per business
const chartOfAccountsMap = new Map<string, ChartOfAccounts>();
const generalLedgerMap = new Map<string, GeneralLedger>();

// Helper to get or create accounting services for a business
const getAccountingServices = (businessId: string) => {
  if (!chartOfAccountsMap.has(businessId)) {
    chartOfAccountsMap.set(businessId, new ChartOfAccounts(businessId));
  }
  if (!generalLedgerMap.has(businessId)) {
    generalLedgerMap.set(businessId, new GeneralLedger(businessId));
  }
  
  return {
    chartOfAccounts: chartOfAccountsMap.get(businessId)!,
    generalLedger: generalLedgerMap.get(businessId)!,
  };
};

// Middleware to attach accounting services to request
router.use(authenticateJWT, (req, res, next) => {
  const businessId = req.user?.businessId;
  if (!businessId) {
    return res.status(400).json({ success: false, error: 'Business ID is required' });
  }
  
  const { chartOfAccounts, generalLedger } = getAccountingServices(businessId);
  req.chartOfAccounts = chartOfAccounts;
  req.generalLedger = generalLedger;
  next();
});

// Chart of Accounts Routes
router.get('/chart-of-accounts', requireRole(['admin', 'accountant']), async (req, res) => {
  try {
    const accounts = await req.chartOfAccounts.getAccountTree();
    res.json({ success: true, data: accounts });
  } catch (error) {
    logger.error('Error fetching chart of accounts:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch chart of accounts' });
  }
});

router.post('/chart-of-accounts', requireRole(['admin', 'accountant']), async (req, res) => {
  try {
    const account = await req.chartOfAccounts.addAccount({
      ...req.body,
      createdBy: req.user?.id || 'system',
      updatedBy: req.user?.id || 'system',
    });
    res.status(201).json({ success: true, data: account });
  } catch (error: any) {
    logger.error('Error creating account:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

// General Ledger Routes
router.post('/journal-entries', requireRole(['admin', 'accountant']), async (req, res) => {
  try {
    const entry = await req.generalLedger.recordEntry({
      ...req.body,
      businessId: req.user?.businessId,
      createdBy: req.user?.id || 'system',
      updatedBy: req.user?.id || 'system',
      date: req.body.date ? new Date(req.body.date) : new Date(),
    });
    res.status(201).json({ success: true, data: entry });
  } catch (error: any) {
    logger.error('Error recording journal entry:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/journal-entries', requireRole(['admin', 'accountant']), async (req, res) => {
  try {
    const { startDate, endDate, accountId, page = 1, limit = 20 } = req.query;
    
    // In a real implementation, this would use pagination and filtering
    res.json({ 
      success: true, 
      data: [], // Would be populated with actual entries
      pagination: { page: Number(page), limit: Number(limit), total: 0 }
    });
  } catch (error) {
    logger.error('Error fetching journal entries:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch journal entries' });
  }
});

// Financial Statements
router.get('/financial-statements', requireRole(['admin', 'accountant', 'manager']), async (req, res) => {
  try {
    const { period = 'current' } = req.query;
    const businessId = req.user?.businessId || '';
    
    // In a real implementation, this would use the period parameter
    const statements = await FinancialStatementGenerator.generateAllStatements(businessId, '2023-01-01 to 2023-12-31');
    res.json({ success: true, ...statements });
  } catch (error) {
    logger.error('Error generating financial statements:', error);
    res.status(500).json({ success: false, error: 'Failed to generate financial statements' });
  }
});

// Bank Reconciliation
router.post('/bank-reconciliation', requireRole(['admin', 'accountant']), async (req, res) => {
  try {
    const { accountId, transactions } = req.body;
    const result = await BankReconciliationAI.reconcileAccount(accountId, transactions);
    res.json({ success: true, data: result });
  } catch (error: any) {
    logger.error('Error performing bank reconciliation:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

// Tax Compliance
router.get('/tax-liability', requireRole(['admin', 'accountant']), async (req, res) => {
  try {
    const { period = 'current' } = req.query;
    const businessId = req.user?.businessId || '';
    
    const liability = await TaxComplianceAI.calculateTaxLiability(businessId, String(period));
    res.json({ success: true, data: liability });
  } catch (error) {
    logger.error('Error calculating tax liability:', error);
    res.status(500).json({ success: false, error: 'Failed to calculate tax liability' });
  }
});

// Trial Balance
router.get('/trial-balance', requireRole(['admin', 'accountant']), async (req, res) => {
  try {
    const { asOf } = req.query;
    const asOfDate = asOf ? new Date(String(asOf)) : new Date();
    
    const trialBalance = await req.generalLedger.getTrialBalance(asOfDate);
    res.json({ success: true, data: trialBalance });
  } catch (error) {
    logger.error('Error generating trial balance:', error);
    res.status(500).json({ success: false, error: 'Failed to generate trial balance' });
  }
});

// Account Balances
router.get('/account-balances', requireRole(['admin', 'accountant', 'manager']), async (req, res) => {
  try {
    const { asOf } = req.query;
    const asOfDate = asOf ? new Date(String(asOf)) : new Date();
    
    // In a real implementation, this would fetch all accounts and their balances
    const trialBalance = await req.generalLedger.getTrialBalance(asOfDate);
    res.json({ 
      success: true, 
      data: trialBalance.accounts,
      asOf: asOfDate
    });
  } catch (error) {
    logger.error('Error fetching account balances:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch account balances' });
  }
});

// AI-Powered Insights
router.get('/ai-insights', requireRole(['admin', 'accountant', 'manager']), async (req, res) => {
  try {
    const businessId = req.user?.businessId || '';
    const { period = 'current' } = req.query;
    
    // Get financial data for AI analysis
    const financials = await FinancialStatementGenerator.generateAllStatements(businessId, String(period));
    
    // Get tax insights
    const taxInsights = await TaxComplianceAI.identifyDeductions(businessId, String(period));
    
    // Get reconciliation status
    const reconciliationStatus = await BankReconciliationAI.reconcileAllAccounts(businessId);
    
    res.json({
      success: true,
      data: {
        financials,
        taxInsights,
        reconciliationStatus,
        recommendations: [
          // AI-generated recommendations would go here
          {
            type: 'tax',
            priority: 'high',
            description: 'Consider accelerating equipment purchases to maximize Section 179 deduction',
            estimatedSavings: 5000
          },
          {
            type: 'reconciliation',
            priority: 'medium',
            description: `${reconciliationStatus.summary.totalUnmatched} transactions need attention`,
            action: 'Review unmatched transactions',
            link: '/accounting/reconciliation'
          }
        ]
      }
    });
  } catch (error) {
    logger.error('Error generating AI insights:', error);
    res.status(500).json({ success: false, error: 'Failed to generate AI insights' });
  }
});

export default router;
