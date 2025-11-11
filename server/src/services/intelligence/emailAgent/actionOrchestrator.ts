import { logger } from '../../../../utils/logger';
import { NlpResult } from './nlpProcessor';
import { PriorityScore } from './priorityEngine';
import { EmailSender } from '../../email/emailSender';
import { CrmService } from '../../crm/crmService';
import { ProjectService } from '../../projects/projectService';
import { AccountingService } from '../../accounting/accountingService';

export class ActionOrchestrator {
  private emailSender: EmailSender;
  private crmService: CrmService;
  private projectService: ProjectService;
  private accountingService: AccountingService;
  
  constructor() {
    // Initialize services with proper configuration
    this.emailSender = new EmailSender();
    this.crmService = new CrmService();
    this.projectService = new ProjectService();
    this.accountingService = new AccountingService();
    
    logger.info('ActionOrchestrator initialized');
  }
  
  /**
   * Process an email and trigger appropriate actions based on content and priority
   */
  public async processEmail(emailData: {
    emailId: string;
    from: string;
    to: string | string[] | undefined;
    subject: string;
    text: string;
    html?: string;
    attachments: any[];
    nlp: NlpResult;
    priority: PriorityScore;
  }): Promise<void> {
    const { emailId, from, subject, text, html, attachments, nlp, priority } = emailData;
    
    try {
      logger.info(`Processing email: ${emailId} with priority: ${priority.level}`);
      
      // 1. Log the email in the system
      await this.logEmail(emailData);
      
      // 2. Process based on email category and priority
      if (nlp.categories.isPurchaseOrder) {
        await this.handlePurchaseOrder(emailData);
      } else if (nlp.categories.isPaymentConfirmation) {
        await this.handlePaymentConfirmation(emailData);
      } else if (nlp.categories.isClientInquiry) {
        await this.handleClientInquiry(emailData);
      } else if (nlp.ufuduMetadata.isUfuduDomain) {
        await this.handleInternalEmail(emailData);
      } else {
        await this.handleGeneralEmail(emailData);
      }
      
      // 3. Trigger notifications if needed
      await this.triggerNotifications(emailData);
      
      // 4. Update CRM with email interaction
      await this.updateCrm(emailData);
      
      logger.info(`Successfully processed email: ${emailId}`);
      
    } catch (error) {
      logger.error(`Error processing email ${emailId}:`, error);
      await this.handleProcessingError(emailData, error);
    }
  }
  
  /**
   * Handle purchase order emails
   */
  private async handlePurchaseOrder(emailData: {
    emailId: string;
    from: string;
    subject: string;
    text: string;
    attachments: any[];
    nlp: NlpResult;
    priority: PriorityScore;
  }): Promise<void> {
    const { emailId, from, subject, text, attachments, nlp } = emailData;
    logger.info(`Processing purchase order from ${from}`);
    
    try {
      // 1. Extract PO details
      const poDetails = this.extractPODetails(text, attachments);
      
      // 2. Validate PO details
      const validationResult = await this.validatePO(poDetails);
      
      if (!validationResult.isValid) {
        logger.warn(`Invalid PO received: ${validationResult.message}`);
        await this.sendPOValidationError(from, subject, validationResult.message);
        return;
      }
      
      // 3. Create/Update PO in the system
      const poRecord = await this.createOrUpdatePO(poDetails);
      
      // 4. Notify relevant teams
      await this.notifyTeamsAboutPO(poRecord, emailData);
      
      // 5. Send acknowledgment to sender
      await this.sendPOAcknowledgment(from, poRecord);
      
      logger.info(`Successfully processed PO ${poRecord.poNumber} from ${from}`);
      
    } catch (error) {
      logger.error(`Error processing PO from ${from}:`, error);
      await this.sendPOProcessingError(from, subject, error.message);
      throw error;
    }
  }
  
  /**
   * Handle payment confirmation emails
   */
  private async handlePaymentConfirmation(emailData: {
    emailId: string;
    from: string;
    subject: string;
    text: string;
    attachments: any[];
    nlp: NlpResult;
  }): Promise<void> {
    const { emailId, from, subject, text, attachments } = emailData;
    logger.info(`Processing payment confirmation from ${from}`);
    
    try {
      // 1. Extract payment details
      const paymentDetails = this.extractPaymentDetails(text, attachments);
      
      // 2. Match payment to invoice
      const matchResult = await this.matchPaymentToInvoice(paymentDetails);
      
      if (!matchResult.matched) {
        logger.warn(`Could not match payment to invoice: ${matchResult.message}`);
        await this.sendPaymentMatchingError(from, subject, matchResult.message);
        return;
      }
      
      // 3. Record payment in accounting system
      const paymentRecord = await this.recordPayment(matchResult.invoice, paymentDetails);
      
      // 4. Update project and client records
      await this.updateProjectAndClientRecords(paymentRecord);
      
      // 5. Send receipt/confirmation
      await this.sendPaymentConfirmation(from, paymentRecord);
      
      logger.info(`Successfully processed payment ${paymentRecord.reference} from ${from}`);
      
    } catch (error) {
      logger.error(`Error processing payment from ${from}:`, error);
      await this.sendPaymentProcessingError(from, subject, error.message);
      throw error;
    }
  }
  
  /**
   * Handle client inquiry emails
   */
  private async handleClientInquiry(emailData: {
    emailId: string;
    from: string;
    subject: string;
    text: string;
    nlp: NlpResult;
    priority: PriorityScore;
  }): Promise<void> {
    const { from, subject, text, nlp, priority } = emailData;
    logger.info(`Processing client inquiry from ${from}`);
    
    try {
      // 1. Identify or create client in CRM
      const client = await this.identifyOrCreateClient(from, nlp);
      
      // 2. Categorize inquiry
      const category = this.categorizeInquiry(text, nlp);
      
      // 3. Generate automated response if possible
      const autoResponse = await this.generateAutoResponse(client, category, text);
      
      if (autoResponse.canAutoRespond) {
        await this.sendAutoResponse(from, subject, autoResponse.response);
        logger.info(`Sent auto-response to inquiry from ${from}`);
      }
      
      // 4. Create ticket in support system if needed
      if (category.requiresHumanAttention) {
        await this.createSupportTicket({
          client,
          subject,
          description: text,
          category: category.name,
          priority: priority.level,
          emailId: emailData.emailId
        });
        logger.info(`Created support ticket for inquiry from ${from}`);
      }
      
      // 5. Update client history
      await this.updateClientHistory(client, {
        type: 'inquiry',
        subject,
        category: category.name,
        priority: priority.level,
        autoResponded: autoResponse.canAutoRespond
      });
      
    } catch (error) {
      logger.error(`Error processing client inquiry from ${from}:`, error);
      // Fallback to generic acknowledgment
      await this.sendGenericAcknowledgment(from, subject);
      throw error;
    }
  }
  
  /**
   * Handle internal Ufudu emails
   */
  private async handleInternalEmail(emailData: {
    emailId: string;
    from: string;
    subject: string;
    text: string;
    nlp: NlpResult;
  }): Promise<void> {
    const { from, subject, text, nlp } = emailData;
    logger.info(`Processing internal email from ${from}`);
    
    try {
      // 1. Check if it's a notification from a monitored system
      if (this.isSystemNotification(subject, text)) {
        await this.handleSystemNotification(emailData);
        return;
      }
      
      // 2. Check if it's a task assignment
      if (this.isTaskAssignment(subject, text)) {
        await this.handleTaskAssignment(emailData);
        return;
      }
      
      // 3. Check if it's a status update
      if (this.isStatusUpdate(subject, text)) {
        await this.handleStatusUpdate(emailData);
        return;
      }
      
      // 4. Default handling for other internal emails
      await this.handleGeneralInternalEmail(emailData);
      
    } catch (error) {
      logger.error(`Error processing internal email from ${from}:`, error);
      // For internal emails, we might want to notify the sender of processing failure
      await this.notifyInternalProcessingError(from, subject, error.message);
      throw error;
    }
  }
  
  /**
   * Handle general emails that don't fit other categories
   */
  private async handleGeneralEmail(emailData: {
    emailId: string;
    from: string;
    subject: string;
    text: string;
    nlp: NlpResult;
  }): Promise<void> {
    const { from, subject } = emailData;
    logger.info(`Processing general email from ${from}`);
    
    try {
      // For general emails, we'll just log them and maybe send an auto-responder
      await this.sendGenericAcknowledgment(from, subject);
      
    } catch (error) {
      logger.error(`Error processing general email from ${from}:`, error);
      // Not much we can do here, just log the error
    }
  }
  
  // ===== Helper Methods =====
  
  private async logEmail(emailData: {
    emailId: string;
    from: string;
    subject: string;
    nlp: NlpResult;
    priority: PriorityScore;
  }): Promise<void> {
    // Implement email logging to database
    const logEntry = {
      emailId: emailData.emailId,
      from: emailData.from,
      subject: emailData.subject,
      receivedAt: new Date(),
      priority: emailData.priority.level,
      categories: Object.entries(emailData.nlp.categories)
        .filter(([_, value]) => value === true)
        .map(([key]) => key),
      metadata: {
        clientId: emailData.nlp.ufuduMetadata.clientId,
        projectReference: emailData.nlp.ufuduMetadata.projectReference,
        orderNumber: emailData.nlp.ufuduMetadata.orderNumber,
      },
    };
    
    // Save to database (implementation would go here)
    // await this.emailLogRepository.save(logEntry);
    
    logger.debug(`Logged email: ${emailData.emailId}`);
  }
  
  private extractPODetails(text: string, attachments: any[]): any {
    // Implement PO details extraction from text and attachments
    // This would involve parsing the email body and any attached PO documents
    
    // Placeholder implementation
    return {
      poNumber: this.extractPONumber(text),
      items: this.extractPOItems(text),
      totalAmount: this.extractTotalAmount(text),
      // ... other PO details
    };
  }
  
  private extractPONumber(text: string): string | null {
    // Implement PO number extraction logic
    const poMatch = text.match(/PO[\s-]?(?:#|No\.?)?[\s-]?([A-Z0-9-]+)/i);
    return poMatch ? poMatch[1] : null;
  }
  
  private extractPOItems(text: string): any[] {
    // Implement PO items extraction logic
    // This is a simplified example
    return [];
  }
  
  private extractTotalAmount(text: string): number | null {
    // Implement total amount extraction logic
    const amountMatch = text.match(/total[\s:]+[A-Z]{0,3}\s*([\d,.]+)/i);
    return amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : null;
  }
  
  private async validatePO(poDetails: any): Promise<{ isValid: boolean; message?: string }> {
    // Implement PO validation logic
    // Check required fields, valid amounts, etc.
    
    if (!poDetails.poNumber) {
      return { isValid: false, message: 'PO number is missing' };
    }
    
    if (!poDetails.items || poDetails.items.length === 0) {
      return { isValid: false, message: 'No items found in PO' };
    }
    
    // Additional validation checks...
    
    return { isValid: true };
  }
  
  private async createOrUpdatePO(poDetails: any): Promise<any> {
    // Implement PO creation/update in the system
    // This would typically involve database operations
    
    // Placeholder implementation
    return {
      id: `po-${Date.now()}`,
      ...poDetails,
      status: 'received',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
  
  private async notifyTeamsAboutPO(poRecord: any, emailData: any): Promise<void> {
    // Implement notification logic for relevant teams
    const recipients = [
      'procurement@ufudu.co.za',
      'finance@ufudu.co.za',
      // Add other relevant teams based on PO details
    ];
    
    const subject = `New PO Received: ${poRecord.poNumber}`;
    const message = `A new purchase order has been received and processed.\n\n` +
                   `PO Number: ${poRecord.poNumber}\n` +
                   `Total Amount: ${poRecord.totalAmount}\n` +
                   `Items: ${poRecord.items.length}\n\n` +
                   `View details in the procurement system.`;
    
    await this.emailSender.sendEmail({
      to: recipients,
      subject,
      text: message,
    });
  }
  
  private async sendPOAcknowledgment(to: string, poRecord: any): Promise<void> {
    // Implement PO acknowledgment email
    const subject = `PO Acknowledgment: ${poRecord.poNumber}`;
    const message = `Dear Valued Customer,\n\n` +
                   `We have received your purchase order ${poRecord.poNumber} and it is being processed.\n` +
                   `Total Amount: ${poRecord.totalAmount}\n` +
                   `Items: ${poRecord.items.length}\n\n` +
                   `If you have any questions, please contact our support team.\n\n` +
                   `Best regards,\nThe Ufudu Team`;
    
    await this.emailSender.sendEmail({
      to,
      subject,
      text: message,
    });
  }
  
  private async sendPOValidationError(to: string, originalSubject: string, errorMessage: string): Promise<void> {
    // Implement PO validation error email
    const subject = `Issue with your PO: ${originalSubject}`;
    const message = `Dear Customer,\n\n` +
                   `We encountered an issue processing your purchase order:\n\n` +
                   `${errorMessage}\n\n` +
                   `Please review and resubmit your PO with the correct information.\n\n` +
                   `If you need assistance, please contact our support team.\n\n` +
                   `Best regards,\nThe Ufudu Team`;
    
    await this.emailSender.sendEmail({
      to,
      subject,
      text: message,
    });
  }
  
  private async sendPOProcessingError(to: string, originalSubject: string, errorMessage: string): Promise<void> {
    // Implement PO processing error email
    const subject = `Error Processing Your PO: ${originalSubject}`;
    const message = `Dear Customer,\n\n` +
                   `We encountered an unexpected error while processing your purchase order.\n\n` +
                   `Our team has been notified and is working to resolve the issue.\n` +
                   `We apologize for any inconvenience this may cause.\n\n` +
                   `Error details: ${errorMessage}\n\n` +
                   `Best regards,\nThe Ufudu Team`;
    
    await this.emailSender.sendEmail({
      to,
      subject,
      text: message,
    });
  }
  
  // ===== Placeholder Methods for Other Functionality =====
  
  private extractPaymentDetails(text: string, attachments: any[]): any {
    // Implement payment details extraction
    return {};
  }
  
  private async matchPaymentToInvoice(paymentDetails: any): Promise<{ matched: boolean; message?: string; invoice?: any }> {
    // Implement payment to invoice matching
    return { matched: false, message: 'Not implemented' };
  }
  
  private async recordPayment(invoice: any, paymentDetails: any): Promise<any> {
    // Implement payment recording
    return {};
  }
  
  private async updateProjectAndClientRecords(paymentRecord: any): Promise<void> {
    // Implement project and client record updates
  }
  
  private async sendPaymentConfirmation(to: string, paymentRecord: any): Promise<void> {
    // Implement payment confirmation email
  }
  
  private async sendPaymentMatchingError(to: string, originalSubject: string, errorMessage: string): Promise<void> {
    // Implement payment matching error email
  }
  
  private async sendPaymentProcessingError(to: string, originalSubject: string, errorMessage: string): Promise<void> {
    // Implement payment processing error email
  }
  
  private async identifyOrCreateClient(email: string, nlp: NlpResult): Promise<any> {
    // Implement client identification or creation
    return {};
  }
  
  private categorizeInquiry(text: string, nlp: NlpResult): { name: string; requiresHumanAttention: boolean } {
    // Implement inquiry categorization
    return { name: 'general', requiresHumanAttention: true };
  }
  
  private async generateAutoResponse(client: any, category: any, inquiryText: string): Promise<{ canAutoRespond: boolean; response?: string }> {
    // Implement auto-response generation
    return { canAutoRespond: false };
  }
  
  private async createSupportTicket(ticketData: any): Promise<void> {
    // Implement support ticket creation
  }
  
  private async updateClientHistory(client: any, interaction: any): Promise<void> {
    // Implement client history update
  }
  
  private isSystemNotification(subject: string, text: string): boolean {
    // Implement system notification detection
    return false;
  }
  
  private isTaskAssignment(subject: string, text: string): boolean {
    // Implement task assignment detection
    return false;
  }
  
  private isStatusUpdate(subject: string, text: string): boolean {
    // Implement status update detection
    return false;
  }
  
  private async handleSystemNotification(emailData: any): Promise<void> {
    // Implement system notification handling
  }
  
  private async handleTaskAssignment(emailData: any): Promise<void> {
    // Implement task assignment handling
  }
  
  private async handleStatusUpdate(emailData: any): Promise<void> {
    // Implement status update handling
  }
  
  private async handleGeneralInternalEmail(emailData: any): Promise<void> {
    // Implement general internal email handling
  }
  
  private async sendGenericAcknowledgment(to: string, originalSubject: string): Promise<void> {
    // Implement generic acknowledgment email
    const subject = `We've received your email: ${originalSubject}`;
    const message = `Thank you for contacting Ufudu.\n\n` +
                   `We have received your email and will respond as soon as possible.\n\n` +
                   `Best regards,\nThe Ufudu Team`;
    
    await this.emailSender.sendEmail({
      to,
      subject,
      text: message,
    });
  }
  
  private async notifyInternalProcessingError(from: string, subject: string, errorMessage: string): Promise<void> {
    // Implement internal error notification
    const adminEmail = 'devops@ufudu.co.za';
    const errorSubject = `[ERROR] Failed to process internal email: ${subject}`;
    const errorMessageText = `An error occurred while processing an internal email:\n\n` +
                           `From: ${from}\n` +
                           `Subject: ${subject}\n` +
                           `Error: ${errorMessage}\n\n` +
                           `Please investigate and take appropriate action.`;
    
    await this.emailSender.sendEmail({
      to: adminEmail,
      subject: errorSubject,
      text: errorMessageText,
    });
  }
  
  private async triggerNotifications(emailData: any): Promise<void> {
    // Implement notification triggering logic
    // This could include:
    // - Email notifications to team members
    // - Slack/Teams messages
    // - Push notifications
    // - SMS alerts for critical items
    
    const { nlp, priority } = emailData;
    
    // Example: Notify team for high-priority items
    if (priority.level === 'high' || priority.level === 'critical') {
      await this.notifyTeam(emailData);
    }
    
    // Example: Notify client success managers for important client communications
    if (nlp.ufuduMetadata.clientId && (priority.level === 'high' || nlp.sentiment.label === 'negative')) {
      await this.notifyClientSuccessManager(emailData);
    }
  }
  
  private async updateCrm(emailData: any): Promise<void> {
    // Implement CRM update logic
    // This would typically involve:
    // - Logging the email interaction
    // - Updating contact/lead/opportunity records
    // - Triggering any relevant workflows
    
    const { from, subject, nlp } = emailData;
    
    try {
      // Check if this is from a known contact
      const contact = await this.crmService.findContactByEmail(from);
      
      if (contact) {
        // Log the interaction
        await this.crmService.logInteraction({
          contactId: contact.id,
          type: 'email',
          direction: 'inbound',
          subject,
          content: emailData.text,
          timestamp: new Date(),
          metadata: {
            emailId: emailData.emailId,
            categories: Object.entries(nlp.categories)
              .filter(([_, value]) => value === true)
              .map(([key]) => key),
            priority: emailData.priority.level,
          },
        });
        
        // Update last contact date
        await this.crmService.updateContact(contact.id, {
          lastContactDate: new Date(),
        });
        
        // If this is a lead, update lead score
        if (contact.type === 'lead') {
          await this.updateLeadScore(contact.id, emailData);
        }
      }
    } catch (error) {
      logger.error('Error updating CRM:', error);
      // Don't throw the error as we don't want to fail the entire process
    }
  }
  
  private async updateLeadScore(leadId: string, emailData: any): Promise<void> {
    // Implement lead scoring logic based on email content
    let scoreChange = 0;
    
    // Positive factors
    if (emailData.nlp.categories.isPurchaseOrder) scoreChange += 20;
    if (emailData.nlp.categories.isPaymentConfirmation) scoreChange += 15;
    if (emailData.nlp.sentiment.label === 'positive') scoreChange += 5;
    
    // Negative factors
    if (emailData.nlp.sentiment.label === 'negative') scoreChange -= 10;
    
    if (scoreChange !== 0) {
      await this.crmService.adjustLeadScore(leadId, scoreChange, 'Email interaction');
    }
  }
  
  private async notifyTeam(emailData: any): Promise<void> {
    // Implement team notification logic
    const teamEmails = await this.getTeamEmailsForNotification(emailData);
    
    if (teamEmails.length > 0) {
      const subject = `[Action Required] ${emailData.priority.level.toUpperCase()}: ${emailData.subject}`;
      const message = `A high-priority email requires attention:\n\n` +
                     `From: ${emailData.from}\n` +
                     `Subject: ${emailData.subject}\n` +
                     `Priority: ${emailData.priority.level}\n` +
                     `Categories: ${Object.entries(emailData.nlp.categories)
                       .filter(([_, value]) => value === true)
                       .map(([key]) => key)
                       .join(', ')}\n\n` +
                     `Please review and take appropriate action.`;
      
      await this.emailSender.sendEmail({
        to: teamEmails,
        subject,
        text: message,
      });
    }
  }
  
  private async notifyClientSuccessManager(emailData: any): Promise<void> {
    // Implement client success manager notification logic
    const clientId = emailData.nlp.ufuduMetadata.clientId;
    
    if (!clientId) return;
    
    try {
      const csm = await this.crmService.getClientSuccessManager(clientId);
      
      if (csm && csm.email) {
        const subject = `[Client Alert] ${emailData.priority.level.toUpperCase()}: ${emailData.subject}`;
        const message = `An important email has been received from your client:\n\n` +
                       `From: ${emailData.from}\n` +
                       `Subject: ${emailData.subject}\n` +
                       `Priority: ${emailData.priority.level}\n` +
                       `Sentiment: ${emailData.nlp.sentiment.label}\n\n` +
                       `Please review and take appropriate action.`;
        
        await this.emailSender.sendEmail({
          to: csm.email,
          subject,
          text: message,
        });
      }
    } catch (error) {
      logger.error('Error notifying client success manager:', error);
    }
  }
  
  private async getTeamEmailsForNotification(emailData: any): Promise<string[]> {
    // Implement logic to determine which team members should be notified
    // This could be based on:
    // - Email category (sales, support, etc.)
    // - Client/Project assignment
    // - Time of day/on-call schedule
    
    // Placeholder implementation
    const teamEmails: string[] = [];
    
    if (emailData.nlp.categories.isPurchaseOrder) {
      teamEmails.push('procurement@ufudu.co.za', 'finance@ufudu.co.za');
    }
    
    if (emailData.nlp.categories.isPaymentConfirmation) {
      teamEmails.push('accounts@ufudu.co.za');
    }
    
    if (emailData.nlp.categories.isClientInquiry) {
      teamEmails.push('support@ufudu.co.za');
    }
    
    // Add project-specific team members if applicable
    if (emailData.nlp.ufuduMetadata.projectReference) {
      try {
        const projectTeam = await this.projectService.getProjectTeam(
          emailData.nlp.ufuduMetadata.projectReference
        );
        
        if (projectTeam && projectTeam.members) {
          projectTeam.members.forEach((member: any) => {
            if (member.notificationsEnabled && member.email) {
              teamEmails.push(member.email);
            }
          });
        }
      } catch (error) {
        logger.error('Error getting project team:', error);
      }
    }
    
    // Remove duplicates
    return [...new Set(teamEmails)];
  }
  
  private async handleProcessingError(emailData: any, error: Error): Promise<void> {
    // Log the error
    logger.error(`Error processing email ${emailData.emailId}:`, error);
    
    // Notify administrators
    await this.notifyAdminAboutError(emailData, error);
    
    // If this was a client email, send a generic error response
    if (!emailData.nlp.ufuduMetadata.isUfuduDomain) {
      await this.sendErrorAcknowledgment(emailData.from, emailData.subject);
    }
  }
  
  private async notifyAdminAboutError(emailData: any, error: Error): Promise<void> {
    const adminEmail = 'devops@ufudu.co.za';
    const errorSubject = `[ERROR] Failed to process email: ${emailData.subject.substring(0, 50)}...`;
    const errorMessage = `An error occurred while processing an email:\n\n` +
                        `From: ${emailData.from}\n` +
                        `To: ${emailData.to}\n` +
                        `Subject: ${emailData.subject}\n` +
                        `Error: ${error.message}\n\n` +
                        `Stack trace:\n${error.stack || 'No stack trace available'}\n\n` +
                        `Please investigate and take appropriate action.`;
    
    await this.emailSender.sendEmail({
      to: adminEmail,
      subject: errorSubject,
      text: errorMessage,
    });
  }
  
  private async sendErrorAcknowledgment(to: string, originalSubject: string): Promise<void> {
    const subject = `Re: ${originalSubject}`;
    const message = `We're sorry, but we encountered an issue while processing your email.\n\n` +
                   `Our team has been notified and is working to resolve the problem.\n` +
                   `Please try again later or contact support@ufudu.co.za for immediate assistance.\n\n` +
                   `We apologize for any inconvenience.\n\n` +
                   `Best regards,\nThe Ufudu Team`;
    
    await this.emailSender.sendEmail({
      to,
      subject,
      text: message,
    });
  }
}
