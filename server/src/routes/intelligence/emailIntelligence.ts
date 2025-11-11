import { Router, Request, Response, NextFunction } from 'express';
import { authenticateJWT, requireRole } from '../../middleware/auth';
import { ActionOrchestrator } from '../../services/intelligence/emailAgent/actionOrchestrator';
import { EmailMonitor } from '../../services/intelligence/emailAgent/emailMonitor';
import { NlpProcessor } from '../../services/intelligence/emailAgent/nlpProcessor';
import { PriorityEngine } from '../../services/intelligence/emailAgent/priorityEngine';
import { logger } from '../../../utils/logger';
import { validationResult, body } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Initialize services
const nlpProcessor = new NlpProcessor();
const priorityEngine = new PriorityEngine();
const actionOrchestrator = new ActionOrchestrator();
const emailMonitor = new EmailMonitor(nlpProcessor, priorityEngine, actionOrchestrator);

// Middleware to validate required email fields
const validateEmail = [
  body('from').isEmail().withMessage('Valid from email is required'),
  body('to').isArray({ min: 1 }).withMessage('At least one recipient is required'),
  body('to.*').isEmail().withMessage('Each recipient must be a valid email'),
  body('subject').isString().trim().notEmpty().withMessage('Subject is required'),
  body('text').isString().withMessage('Email text content is required'),
  body('html').optional().isString(),
  body('attachments').optional().isArray(),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

/**
 * @route   POST /api/intelligence/email/process
 * @desc    Process an email through the AI Email Agent
 * @access  Private (Requires authentication)
 */
router.post(
  '/process',
  authenticateJWT,
  requireRole(['admin', 'support', 'manager']),
  validateEmail,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const emailData = {
        ...req.body,
        emailId: `email-${uuidv4()}`,
        receivedAt: new Date(),
      };

      // Process the email asynchronously
      actionOrchestrator.processEmail(emailData)
        .catch(error => {
          logger.error(`Error processing email ${emailData.emailId} asynchronously:`, error);
        });

      // Return immediate response
      res.status(202).json({
        success: true,
        message: 'Email is being processed',
        emailId: emailData.emailId,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   GET /api/intelligence/email/status/:emailId
 * @desc    Get processing status of an email
 * @access  Private (Requires authentication)
 */
router.get(
  '/status/:emailId',
  authenticateJWT,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { emailId } = req.params;
      
      // In a real implementation, you would query a database for the status
      // For now, we'll return a mock response
      res.json({
        emailId,
        status: 'processed', // or 'processing', 'failed', 'pending'
        processedAt: new Date().toISOString(),
        // Additional status details would go here
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   POST /api/intelligence/email/start-monitoring
 * @desc    Start monitoring email account
 * @access  Private (Admin only)
 */
router.post(
  '/start-monitoring',
  authenticateJWT,
  requireRole(['admin']),
  [
    body('user').isString().notEmpty().withMessage('IMAP user is required'),
    body('password').isString().notEmpty().withMessage('IMAP password is required'),
    body('host').isString().notEmpty().withMessage('IMAP host is required'),
    body('port').isInt({ min: 1, max: 65535 }).withMessage('Valid port number is required'),
    body('tls').isBoolean().withMessage('TLS must be a boolean'),
    body('mailbox').optional().isString().default('INBOX'),
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { user, password, host, port, tls, mailbox } = req.body;
      
      // Start monitoring
      await emailMonitor.startMonitoring({
        user,
        password,
        host,
        port,
        tls,
        mailbox,
        markSeen: true,
        fetchUnreadOnStart: true,
      });

      res.json({
        success: true,
        message: 'Email monitoring started successfully',
        config: {
          user,
          host,
          port,
          tls,
          mailbox,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   POST /api/intelligence/email/stop-monitoring
 * @desc    Stop monitoring email account
 * @access  Private (Admin only)
 */
router.post(
  '/stop-monitoring',
  authenticateJWT,
  requireRole(['admin']),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await emailMonitor.stopMonitoring();
      
      res.json({
        success: true,
        message: 'Email monitoring stopped successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   GET /api/intelligence/email/monitoring-status
 * @desc    Get current monitoring status
 * @access  Private (Admin only)
 */
router.get(
  '/monitoring-status',
  authenticateJWT,
  requireRole(['admin']),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const status = emailMonitor.getStatus();
      
      res.json({
        success: true,
        isMonitoring: status.isMonitoring,
        lastChecked: status.lastChecked,
        totalProcessed: status.totalProcessed,
        lastError: status.lastError,
        config: status.config ? {
          user: status.config.user,
          host: status.config.host,
          port: status.config.port,
          tls: status.config.tls,
          mailbox: status.config.mailbox,
        } : null,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   GET /api/intelligence/email/stats
 * @desc    Get email processing statistics
 * @access  Private (Requires authentication)
 */
router.get(
  '/stats',
  authenticateJWT,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // In a real implementation, you would query a database for statistics
      // For now, we'll return mock data
      const stats = {
        totalProcessed: 0,
        byCategory: {
          purchaseOrders: 0,
          paymentConfirmations: 0,
          clientInquiries: 0,
          internal: 0,
          other: 0,
        },
        byPriority: {
          critical: 0,
          high: 0,
          medium: 0,
          low: 0,
        },
        byStatus: {
          processed: 0,
          pending: 0,
          failed: 0,
        },
        lastUpdated: new Date().toISOString(),
      };
      
      res.json({
        success: true,
        stats,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   GET /api/intelligence/email/search
 * @desc    Search processed emails
 * @access  Private (Requires authentication)
 */
router.get(
  '/search',
  authenticateJWT,
  [
    // Query parameters validation
    (req, res, next) => {
      // Add validation for query parameters if needed
      next();
    },
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { 
        query, 
        category, 
        priority, 
        status, 
        startDate, 
        endDate, 
        page = 1, 
        limit = 20 
      } = req.query;
      
      // In a real implementation, you would query a database with these filters
      // For now, we'll return mock data
      const results = [];
      const total = 0;
      
      res.json({
        success: true,
        data: results,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   GET /api/intelligence/email/:emailId
 * @desc    Get details of a processed email
 * @access  Private (Requires authentication)
 */
router.get(
  '/:emailId',
  authenticateJWT,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { emailId } = req.params;
      
      // In a real implementation, you would query a database for the email details
      // For now, we'll return a mock response
      res.json({
        success: true,
        email: {
          id: emailId,
          from: 'sender@example.com',
          to: ['recipient@example.com'],
          subject: 'Sample Email',
          receivedAt: new Date().toISOString(),
          status: 'processed',
          priority: 'medium',
          categories: ['clientInquiry'],
          // Additional email details would go here
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// Error handling middleware
router.use((err: any, req: Request, res: Response, next: NextFunction) => {
  logger.error('Email Intelligence API Error:', err);
  
  const statusCode = err.statusCode || 500;
  const message = err.message || 'An unexpected error occurred';
  
  res.status(statusCode).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_SERVER_ERROR',
      message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
});

export default router;
