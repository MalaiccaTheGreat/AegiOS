import { logger } from '../../../utils/logger';

interface CommandContext {
  userId: string;
  businessId: string;
  sessionId: string;
  timestamp: Date;
  previousContext?: any;
}

interface CommandResponse {
  success: boolean;
  message: string;
  data?: any;
  followUpQuestions?: string[];
  contextUpdates?: any;
}

interface CommandHandler {
  pattern: RegExp;
  handler: (matches: RegExpMatchArray, context: CommandContext) => Promise<CommandResponse>;
  requiresAuth?: boolean;
  description: string;
  examples: string[];
}

export class CommandProcessor {
  private commands: CommandHandler[] = [];
  private contextStore: Map<string, any> = new Map();

  constructor() {
    this.initializeDefaultCommands();
  }

  private initializeDefaultCommands() {
    // Help command
    this.registerCommand({
      pattern: /^(help|what can you do|show commands)$/i,
      handler: this.handleHelpCommand,
      description: 'Show available commands and examples',
      examples: ['help', 'what can you do?', 'show commands']
    });

    // Transaction creation
    this.registerCommand({
      pattern: /(?:create|add|record)\s+(?:a\s+)?(?:new\s+)?(?:transaction|expense|income)\s+(?:of\s*)?\$?(\d+(?:\.\d{2})?)\s*(?:for|on|to)?\s*(.+)/i,
      handler: this.handleCreateTransaction,
      requiresAuth: true,
      description: 'Create a new financial transaction',
      examples: [
        'create a transaction of $500 for office supplies',
        'add expense 250 for team lunch',
        'record income 1200 from client project'
      ]
    });

    // Financial reports
    this.registerCommand({
      pattern: /(?:show|generate|get)\s+(?:me\s+)?(?:a\s+)?(income\s*statement|balance\s*sheet|cash\s*flow|financial\s+report)(?:\s+for\s+(.+))?/i,
      handler: this.handleFinancialReport,
      requiresAuth: true,
      description: 'Generate financial reports',
      examples: [
        'show me an income statement',
        'generate balance sheet for Q2 2023',
        'get cash flow report for last month'
      ]
    });

    // Business performance
    this.registerCommand({
      pattern: /how(?:'s|\s+is)\s+(?:my\s+)?(business|company|performance|metrics?)(?:\s+doing|\s+performing)?(?:\s+this\s+(month|quarter|year))?/i,
      handler: this.handleBusinessPerformance,
      requiresAuth: true,
      description: 'Get business performance overview',
      examples: [
        "how's my business doing?",
        'how is my company performing this quarter?',
        'show me my business metrics'
      ]
    });

    // Bank reconciliation
    this.registerCommand({
      pattern: /(?:reconcile|check|verify)\s+(?:my\s+)?(?:bank\s+)?(?:account|transactions?)(?:\s+for\s+(.+))?/i,
      handler: this.handleBankReconciliation,
      requiresAuth: true,
      description: 'Reconcile bank transactions',
      examples: [
        'reconcile my bank account',
        'check transactions for last month',
        'verify my bank statement'
      ]
    });
  }

  public registerCommand(handler: CommandHandler) {
    this.commands.push(handler);
    logger.debug(`Registered command: ${handler.description}`);
  }

  public async processCommand(
    text: string,
    context: CommandContext
  ): Promise<CommandResponse> {
    logger.info(`Processing command: "${text}"`, { context });

    // Check for empty input
    if (!text || text.trim().length === 0) {
      return {
        success: false,
        message: 'I didn\'t catch that. Could you please repeat or say "help" for available commands.'
      };
    }

    // Check for help command first
    if (text.toLowerCase().includes('help')) {
      return this.handleHelpCommand([], context);
    }

    // Try to match the input against registered commands
    for (const command of this.commands) {
      const matches = text.match(command.pattern);
      if (matches) {
        try {
          // Check authentication if required
          if (command.requiresAuth && !context.userId) {
            return {
              success: false,
              message: 'You need to be logged in to perform this action.'
            };
          }

          logger.debug(`Matched command: ${command.description}`, { matches });
          return await command.handler(matches, context);
        } catch (error) {
          logger.error(`Error executing command: ${command.description}`, { error });
          return {
            success: false,
            message: 'Sorry, I encountered an error processing your request. Please try again.'
          };
        }
      }
    }

    // No matching command found
    return this.handleUnknownCommand(text, context);
  }

  private async handleHelpCommand(): Promise<CommandResponse> {
    const availableCommands = this.commands
      .filter(cmd => !cmd.requiresAuth) // Only show non-auth commands in help
      .map(cmd => ({
        command: cmd.examples[0],
        description: cmd.description,
        examples: cmd.examples.slice(1)
      }));

    return {
      success: true,
      message: 'Here\'s what I can help you with:',
      data: {
        commands: availableCommands
      },
      followUpQuestions: [
        'What would you like to do next?',
        'Is there anything specific you need help with?'
      ]
    };
  }

  private async handleCreateTransaction(
    matches: RegExpMatchArray,
    context: CommandContext
  ): Promise<CommandResponse> {
    const amount = parseFloat(matches[1]);
    const description = matches[2].trim();
    
    logger.info(`Creating transaction: $${amount} for ${description}`, { context });
    
    // In a real implementation, this would create the transaction in the database
    // const transaction = await transactionService.create({
    //   amount,
    //   description,
    //   userId: context.userId,
    //   businessId: context.businessId,
    //   date: new Date()
    // });

    return {
      success: true,
      message: `I've recorded a transaction of $${amount.toFixed(2)} for ${description}.`,
      data: {
        amount,
        description,
        // transactionId: transaction.id,
        timestamp: new Date().toISOString()
      },
      followUpQuestions: [
        'Would you like to categorize this transaction?',
        'Do you want to add a receipt or note?'
      ]
    };
  }

  private async handleFinancialReport(
    matches: RegExpMatchArray,
    context: CommandContext
  ): Promise<CommandResponse> {
    const reportType = matches[1].toLowerCase().replace(/\s+/g, '-');
    const period = matches[2] || 'current period';
    
    logger.info(`Generating ${reportType} report for ${period}`, { context });
    
    // In a real implementation, this would generate the requested report
    // const report = await reportService.generate({
    //   type: reportType,
    //   period,
    //   businessId: context.businessId,
    //   userId: context.userId
    // });

    return {
      success: true,
      message: `I've generated the ${reportType.replace('-', ' ')} for ${period}.`,
      data: {
        reportType,
        period,
        // reportData: report.data,
        generatedAt: new Date().toISOString()
      },
      followUpQuestions: [
        'Would you like me to email you this report?',
        'Would you like to see a breakdown by category?'
      ]
    };
  }

  private async handleBusinessPerformance(
    matches: RegExpMatchArray,
    context: CommandContext
  ): Promise<CommandResponse> {
    const period = matches[2] || 'current period';
    
    logger.info(`Fetching business performance for ${period}`, { context });
    
    // In a real implementation, this would fetch business metrics
    // const metrics = await analyticsService.getBusinessMetrics({
    //   businessId: context.businessId,
    //   period,
    //   userId: context.userId
    // });

    return {
      success: true,
      message: `Here's how your business is performing ${period === 'current period' ? 'currently' : 'this ' + period}:`,
      data: {
        // ...metrics,
        period,
        lastUpdated: new Date().toISOString()
      },
      followUpQuestions: [
        'Would you like to see a comparison with last period?',
        'Would you like to see detailed revenue breakdown?'
      ]
    };
  }

  private async handleBankReconciliation(
    matches: RegExpMatchArray,
    context: CommandContext
  ): Promise<CommandResponse> {
    const period = matches[1] || 'the last 30 days';
    
    logger.info(`Starting bank reconciliation for ${period}`, { context });
    
    // In a real implementation, this would reconcile bank transactions
    // const result = await reconciliationService.reconcile({
    //   businessId: context.businessId,
    //   period,
    //   userId: context.userId
    // });

    return {
      success: true,
      message: `I've started reconciling your bank transactions for ${period}.`,
      data: {
        status: 'pending',
        period,
        // ...result,
        startedAt: new Date().toISOString()
      },
      followUpQuestions: [
        'Would you like to review the unmatched transactions?',
        'Should I automatically categorize similar transactions?'
      ]
    };
  }

  private async handleUnknownCommand(
    text: string,
    context: CommandContext
  ): Promise<CommandResponse> {
    logger.info(`No matching command found for: "${text}"`, { context });
    
    // Try to find similar commands using a simple string similarity approach
    const similarCommands = this.findSimilarCommands(text);
    
    let message = `I'm not sure how to help with "${text}".`;
    
    if (similarCommands.length > 0) {
      message += ' Did you mean one of these commands?\n';
      message += similarCommands
        .slice(0, 3) // Limit to top 3 suggestions
        .map(cmd => `- ${cmd.examples[0]}`)
        .join('\n');
    } else {
      message += ' You can say "help" to see what I can do.';
    }
    
    return {
      success: false,
      message,
      data: {
        originalText: text,
        timestamp: new Date().toISOString()
      },
      followUpQuestions: [
        'Would you like me to show you all available commands?',
        'Can you rephrase your request?'
      ]
    };
  }

  private findSimilarCommands(text: string, threshold: number = 0.3): CommandHandler[] {
    const input = text.toLowerCase();
    
    return this.commands
      .map(cmd => ({
        ...cmd,
        // Simple similarity score based on common words
        score: this.calculateSimilarity(input, cmd.examples.join(' ').toLowerCase())
      }))
      .filter(cmd => cmd.score >= threshold)
      .sort((a, b) => b.score - a.score);
  }

  private calculateSimilarity(a: string, b: string): number {
    // Simple similarity calculation based on common words
    const wordsA = new Set(a.split(/\s+/));
    const wordsB = new Set(b.split(/\s+/));
    
    const intersection = new Set(
      [...wordsA].filter(word => wordsB.has(word))
    );
    
    const union = new Set([...wordsA, ...wordsB]);
    
    return union.size === 0 ? 0 : intersection.size / union.size;
  }

  // Save context for a session
  public saveContext(sessionId: string, context: any): void {
    this.contextStore.set(sessionId, context);
  }

  // Get context for a session
  public getContext(sessionId: string): any | undefined {
    return this.contextStore.get(sessionId);
  }

  // Clear context for a session
  public clearContext(sessionId: string): void {
    this.contextStore.delete(sessionId);
  }
}

// Export a singleton instance
export const commandProcessor = new CommandProcessor();

export default commandProcessor;
