import Imap from 'node-imap';
import { simpleParser } from 'mailparser';
import { EventEmitter } from 'events';
import { logger } from '../../../../utils/logger';
import { NlpProcessor } from './nlpProcessor';
import { PriorityEngine } from './priorityEngine';
import { ActionOrchestrator } from './actionOrchestrator';

interface EmailMonitorConfig {
  user: string;
  password: string;
  host: string;
  port: number;
  tls: boolean;
  tlsOptions?: Record<string, any>;
  mailbox: string;
  markSeen?: boolean;
  fetchUnreadOnStart?: boolean;
}

export class EmailMonitor extends EventEmitter {
  private imap: Imap;
  private nlpProcessor: NlpProcessor;
  private priorityEngine: PriorityEngine;
  private actionOrchestrator: ActionOrchestrator;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 5000; // 5 seconds

  constructor(
    private config: EmailMonitorConfig,
    nlpProcessor: NlpProcessor,
    priorityEngine: PriorityEngine,
    actionOrchestrator: ActionOrchestrator
  ) {
    super();
    this.nlpProcessor = nlpProcessor;
    this.priorityEngine = priorityEngine;
    this.actionOrchestrator = actionOrchestrator;
    this.imap = this.createImapConnection();
  }

  private createImapConnection(): Imap {
    return new Imap({
      user: this.config.user,
      password: this.config.password,
      host: this.config.host,
      port: this.config.port,
      tls: this.config.tls,
      tlsOptions: this.config.tlsOptions,
      authTimeout: 10000,
      connTimeout: 30000,
      keepalive: true,
    });
  }

  public async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.imap.once('ready', () => {
        this.isConnected = true;
        this.reconnectAttempts = 0;
        logger.info('IMAP connection established');
        this.emit('connected');
        this.openInbox();
        this.setupEventHandlers();
        resolve();
      });

      this.imap.once('error', (err: Error) => {
        logger.error('IMAP connection error:', err);
        this.isConnected = false;
        this.emit('error', err);
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.attemptReconnect();
        } else {
          logger.error('Max reconnection attempts reached');
          reject(err);
        }
      });

      this.imap.on('end', () => {
        logger.info('IMAP connection ended');
        this.isConnected = false;
        this.emit('disconnected');
      });

      this.imap.connect();
    });
  }

  private attemptReconnect(): void {
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    logger.info(`Attempting to reconnect in ${delay / 1000} seconds (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    setTimeout(() => {
      if (!this.isConnected) {
        logger.info('Reconnecting to IMAP server...');
        this.imap = this.createImapConnection();
        this.start().catch(err => {
          logger.error('Reconnection failed:', err);
        });
      }
    }, delay);
  }

  private openInbox(): void {
    this.imap.openBox(this.config.mailbox, false, (err, box) => {
      if (err) {
        logger.error('Error opening mailbox:', err);
        this.emit('error', err);
        return;
      }

      logger.info(`Connected to mailbox: ${this.config.mailbox}`);
      logger.info(`Total messages: ${box.messages.total}`);
      
      if (this.config.fetchUnreadOnStart) {
        this.fetchUnreadEmails();
      }
      
      // Start watching for new emails
      this.watchForNewEmails();
    });
  }

  private setupEventHandlers(): void {
    this.imap.on('mail', (numNewMsgs: number) => {
      logger.info(`New email received: ${numNewMsgs} new message(s)`);
      this.fetchRecentEmails(numNewMsgs);
    });
  }

  private watchForNewEmails(): void {
    this.imap.on('mail', (numNewMsgs: number) => {
      logger.info(`New email detected: ${numNewMsgs} new message(s)`);
      this.fetchRecentEmails(numNewMsgs);
    });
  }

  public fetchUnreadEmails(): void {
    this.imap.search(['UNSEEN'], (err, results) => {
      if (err) {
        logger.error('Error searching for unread emails:', err);
        this.emit('error', err);
        return;
      }

      if (results.length === 0) {
        logger.info('No unread emails found');
        return;
      }

      logger.info(`Found ${results.length} unread email(s)`);
      this.processEmails(results);
    });
  }

  private fetchRecentEmails(count: number = 10): void {
    this.imap.search(['ALL'], (err, results) => {
      if (err) {
        logger.error('Error searching for recent emails:', err);
        this.emit('error', err);
        return;
      }

      if (results.length === 0) {
        logger.info('No emails found');
        return;
      }

      // Get the most recent N emails
      const recentEmails = results.slice(-count);
      logger.info(`Processing ${recentEmails.length} recent email(s)`);
      this.processEmails(recentEmails);
    });
  }

  private processEmails(emailIds: number[]): void {
    if (!emailIds.length) return;

    const fetch = this.imap.fetch(emailIds, {
      bodies: '',
      markSeen: this.config.markSeen !== false, // Default to true if not specified
      struct: true,
    });

    fetch.on('message', (msg) => {
      let emailData: any = {};
      let emailBody = '';

      msg.on('body', (stream, info) => {
        simpleParser(stream, async (err, mail) => {
          if (err) {
            logger.error('Error parsing email:', err);
            this.emit('error', err);
            return;
          }

          emailData = {
            messageId: mail.messageId,
            subject: mail.subject || '(No Subject)',
            from: this.formatEmailAddress(mail.from),
            to: this.formatEmailAddress(mail.to),
            cc: this.formatEmailAddress(mail.cc),
            date: mail.date || new Date(),
            text: mail.text || '',
            html: mail.html || '',
            attachments: mail.attachments || [],
            headers: mail.headers || {},
          };

          emailBody = mail.text || '';
          if (mail.html) {
            // Convert HTML to plain text if no text version is available
            emailBody = this.htmlToText(mail.html);
          }

          // Process email with NLP
          try {
            const nlpResult = await this.nlpProcessor.processEmail(emailData, emailBody);
            const priorityScore = this.priorityEngine.calculatePriority(nlpResult);
            
            const processedEmail = {
              ...emailData,
              nlp: nlpResult,
              priority: priorityScore,
              status: 'pending',
              processedAt: new Date(),
            };

            // Emit event with processed email
            this.emit('email:processed', processedEmail);

            // Trigger actions based on email content
            await this.actionOrchestrator.processEmail(processedEmail);

          } catch (error) {
            logger.error('Error processing email with NLP:', error);
            this.emit('error', error);
          }
        });
      });

      msg.once('error', (err) => {
        logger.error('Error fetching email:', err);
        this.emit('error', err);
      });
    });

    fetch.once('error', (err) => {
      logger.error('Error fetching emails:', err);
      this.emit('error', err);
    });
  }

  private formatEmailAddress(address: any): string | string[] | undefined {
    if (!address) return undefined;
    
    if (Array.isArray(address)) {
      return address.map(addr => this.formatSingleAddress(addr));
    }
    
    return this.formatSingleAddress(address);
  }

  private formatSingleAddress(addr: any): string {
    if (typeof addr === 'string') return addr;
    
    if (addr.name && addr.address) {
      return `${addr.name} <${addr.address}>`;
    }
    
    return addr.address || '';
  }

  private htmlToText(html: string): string {
    // Simple HTML to text conversion
    return html
      .replace(/<style[^>]*>.*<\/style>/gms, '') // Remove style tags
      .replace(/<script[^>]*>.*<\/script>/gms, '') // Remove script tags
      .replace(/<[^>]+>/g, ' ') // Remove HTML tags
      .replace(/\s+/g, ' ') // Collapse whitespace
      .trim();
  }

  public stop(): void {
    if (this.imap) {
      this.imap.end();
      this.isConnected = false;
      this.emit('stopped');
    }
  }

  public getConnectionStatus(): boolean {
    return this.isConnected;
  }

  public getReconnectInfo(): { attempts: number; maxAttempts: number } {
    return {
      attempts: this.reconnectAttempts,
      maxAttempts: this.maxReconnectAttempts,
    };
  }
}
