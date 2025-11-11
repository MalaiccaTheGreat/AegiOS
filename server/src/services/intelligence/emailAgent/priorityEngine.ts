import { logger } from '../../../../utils/logger';
import { NlpResult } from './nlpProcessor';

export interface PriorityScore {
  score: number; // 0 (lowest) to 100 (highest)
  level: 'low' | 'medium' | 'high' | 'critical';
  factors: {
    name: string;
    score: number;
    weight: number;
    description: string;
  }[];
  recommendedActions: string[];
  responseTime: {
    target: number; // in minutes
    urgency: 'low' | 'medium' | 'high' | 'critical';
  };
}

export class PriorityEngine {
  private priorityWeights: Record<string, number>;
  private priorityThresholds: Record<string, { min: number; max: number; level: 'low' | 'medium' | 'high' | 'critical' }>;
  
  constructor() {
    // Define weights for different priority factors (sum should be 1.0)
    this.priorityWeights = {
      senderImportance: 0.2,    // Internal, VIP, etc.
      contentUrgency: 0.25,     // Keywords like 'urgent', 'ASAP'
      relationship: 0.15,       // Existing client, new lead, etc.
      businessImpact: 0.25,     // Potential revenue impact
      timeSensitivity: 0.15,    // Time-bound requests
    };
    
    // Define priority level thresholds
    this.priorityThresholds = {
      low: { min: 0, max: 40, level: 'low' },
      medium: { min: 41, max: 70, level: 'medium' },
      high: { min: 71, max: 90, level: 'high' },
      critical: { min: 91, max: 100, level: 'critical' },
    };
    
    logger.info('Priority Engine initialized');
  }
  
  /**
   * Calculate the priority score for an email based on NLP results
   */
  public calculatePriority(nlpResult: NlpResult): PriorityScore {
    const factors: PriorityScore['factors'] = [];
    
    // 1. Sender Importance
    const senderScore = this.calculateSenderImportance(nlpResult);
    factors.push({
      name: 'Sender Importance',
      score: senderScore,
      weight: this.priorityWeights.senderImportance,
      description: this.getSenderImportanceDescription(senderScore)
    });
    
    // 2. Content Urgency
    const urgencyScore = this.calculateContentUrgency(nlpResult);
    factors.push({
      name: 'Content Urgency',
      score: urgencyScore,
      weight: this.priorityWeights.contentUrgency,
      description: this.getUrgencyDescription(urgencyScore)
    });
    
    // 3. Relationship
    const relationshipScore = this.calculateRelationshipScore(nlpResult);
    factors.push({
      name: 'Relationship',
      score: relationshipScore,
      weight: this.priorityWeights.relationship,
      description: this.getRelationshipDescription(relationshipScore)
    });
    
    // 4. Business Impact
    const businessImpactScore = this.calculateBusinessImpact(nlpResult);
    factors.push({
      name: 'Business Impact',
      score: businessImpactScore,
      weight: this.priorityWeights.businessImpact,
      description: this.getBusinessImpactDescription(businessImpactScore)
    });
    
    // 5. Time Sensitivity
    const timeSensitivityScore = this.calculateTimeSensitivity(nlpResult);
    factors.push({
      name: 'Time Sensitivity',
      score: timeSensitivityScore,
      weight: this.priorityWeights.timeSensitivity,
      description: this.getTimeSensitivityDescription(timeSensitivityScore)
    });
    
    // Calculate weighted score
    const weightedScore = factors.reduce((total, factor) => {
      return total + (factor.score * factor.weight);
    }, 0);
    
    // Ensure score is between 0 and 100
    const finalScore = Math.max(0, Math.min(100, Math.round(weightedScore)));
    
    // Determine priority level
    const priorityLevel = this.determinePriorityLevel(finalScore);
    
    // Get recommended actions
    const recommendedActions = this.getRecommendedActions(priorityLevel, nlpResult);
    
    // Determine response time target
    const responseTime = this.calculateResponseTime(priorityLevel, nlpResult);
    
    return {
      score: finalScore,
      level: priorityLevel,
      factors,
      recommendedActions,
      responseTime
    };
  }
  
  private calculateSenderImportance(nlpResult: NlpResult): number {
    let score = 0;
    
    // Internal emails get higher priority
    if (nlpResult.ufuduMetadata.isUfuduDomain) {
      score += 80; // Base score for internal emails
      
      // Check for executive emails
      const from = nlpResult.entities.emailAddresses[0] || '';
      const executiveDomains = ['ceo@', 'cto@', 'cfo@', 'management@', 'leadership@'];
      if (executiveDomains.some(domain => from.includes(domain))) {
        score += 20; // Bonus for executive emails
      }
    } 
    // Known clients
    else if (nlpResult.ufuduMetadata.clientId) {
      score += 60; // Base score for known clients
      
      // VIP clients (could be determined from CRM integration)
      const isVip = this.isVipClient(nlpResult.ufuduMetadata.clientId);
      if (isVip) {
        score += 20; // Bonus for VIP clients
      }
    }
    // New leads
    else if (nlpResult.categories.isClientInquiry) {
      score += 40; // Base score for new leads
      
      // High-value lead indicators
      const hasBudgetMention = nlpResult.entities.money.length > 0 || 
                             /budget|investment|price|cost/i.test(nlpResult.keyPhrases.join(' '));
      if (hasBudgetMention) {
        score += 20; // Bonus for potential high-value leads
      }
    }
    
    return Math.min(100, score);
  }
  
  private calculateContentUrgency(nlpResult: NlpResult): number {
    let score = 0;
    
    // Check for urgent keywords
    const urgentKeywords = ['urgent', 'asap', 'immediate', 'important', 'critical', 'emergency'];
    const hasUrgentKeywords = urgentKeywords.some(keyword => 
      nlpResult.keyPhrases.some(phrase => 
        phrase.toLowerCase().includes(keyword)
      )
    );
    
    if (hasUrgentKeywords) {
      score += 70; // Base score for urgent content
    }
    
    // Check sentiment (negative emails might need quicker response)
    if (nlpResult.sentiment.label === 'negative') {
      score += 30; // Additional points for negative sentiment
    }
    
    // Check for time-sensitive information
    const timeSensitivePhrases = ['deadline', 'due by', 'before', 'expire', 'last chance'];
    const hasTimeSensitiveContent = timeSensitivePhrases.some(phrase =>
      nlpResult.keyPhrases.some(p => p.toLowerCase().includes(phrase))
    );
    
    if (hasTimeSensitiveContent) {
      score += 40; // Bonus for time-sensitive content
    }
    
    // Check for purchase order or payment (high business value)
    if (nlpResult.categories.isPurchaseOrder || nlpResult.categories.isPaymentConfirmation) {
      score += 50; // High score for business-critical emails
    }
    
    return Math.min(100, score);
  }
  
  private calculateRelationshipScore(nlpResult: NlpResult): number {
    let score = 0;
    
    // Existing client with active projects
    if (nlpResult.ufuduMetadata.clientId && nlpResult.ufuduMetadata.projectReference) {
      score += 80; // High score for active clients with projects
      
      // Check project status (could be from project management system)
      const projectStatus = this.getProjectStatus(nlpResult.ufuduMetadata.projectReference);
      if (projectStatus === 'active' || projectStatus === 'on_hold') {
        score += 10; // Bonus for active/on-hold projects
      }
    }
    // Existing client without active projects
    else if (nlpResult.ufuduMetadata.clientId) {
      score += 60; // Good score for existing clients
    }
    // New lead with high potential
    else if (nlpResult.categories.isClientInquiry && nlpResult.entities.money.length > 0) {
      score += 50; // Decent score for promising new leads
    }
    // General inquiry
    else if (nlpResult.categories.isClientInquiry) {
      score += 30; // Base score for general inquiries
    }
    
    // Check communication history (could be from CRM)
    const communicationHistory = this.getCommunicationHistory(nlpResult.entities.emailAddresses[0] || '');
    if (communicationHistory.recentEmails > 5) {
      score += 10; // Bonus for active communication
    }
    
    return Math.min(100, score);
  }
  
  private calculateBusinessImpact(nlpResult: NlpResult): number {
    let score = 0;
    
    // Purchase orders (direct revenue impact)
    if (nlpResult.categories.isPurchaseOrder) {
      score += 90; // Very high impact
      
      // Higher value POs get higher score
      const totalAmount = nlpResult.entities.money.reduce((sum, money) => sum + money.amount, 0);
      if (totalAmount > 10000) score += 10; // Bonus for large orders
    }
    // Payment confirmations (cash flow impact)
    else if (nlpResult.categories.isPaymentConfirmation) {
      score += 85; // High impact
      
      // Larger payments get higher score
      const totalAmount = nlpResult.entities.money.reduce((sum, money) => sum + money.amount, 0);
      if (totalAmount > 5000) score += 15; // Bonus for large payments
    }
    // Client inquiries (potential future revenue)
    else if (nlpResult.categories.isClientInquiry) {
      score += 60; // Moderate impact
      
      // Check for budget mentions
      const hasBudgetMention = nlpResult.entities.money.length > 0 || 
                             /budget|investment|price|cost/i.test(nlpResult.keyPhrases.join(' '));
      if (hasBudgetMention) {
        score += 20; // Bonus for budget-related inquiries
      }
    }
    
    // Check for project references
    if (nlpResult.ufuduMetadata.projectReference) {
      const projectValue = this.getProjectValue(nlpResult.ufuduMetadata.projectReference);
      if (projectValue > 0) {
        // Scale score based on project value (logarithmic scale)
        const valueScore = Math.min(30, Math.log10(projectValue) * 5);
        score += valueScore;
      }
    }
    
    return Math.min(100, score);
  }
  
  private calculateTimeSensitivity(nlpResult: NlpResult): number {
    let score = 0;
    
    // Check for explicit deadlines
    const deadlinePhrases = ['deadline', 'due by', 'needed by', 'required by'];
    const hasDeadline = deadlinePhrases.some(phrase =>
      nlpResult.keyPhrases.some(p => p.toLowerCase().includes(phrase))
    );
    
    if (hasDeadline) {
      score += 80; // High score for explicit deadlines
      
      // Check if deadline is today or tomorrow (would require date parsing in a real implementation)
      const isUrgentDeadline = /today|tomorrow|asap|immediate/i.test(nlpResult.keyPhrases.join(' '));
      if (isUrgentDeadline) {
        score += 20; // Bonus for urgent deadlines
      }
    }
    
    // Check for time-sensitive business processes
    if (nlpResult.categories.isPaymentConfirmation) {
      // Payment confirmations are time-sensitive for accounting
      score = Math.max(score, 70);
    }
    
    // Check for follow-up emails (would require threading in a real implementation)
    const isFollowUp = /follow.?up|checking in|status update/i.test(nlpResult.keyPhrases.join(' '));
    if (isFollowUp) {
      score = Math.max(score, 60); // Moderate score for follow-ups
    }
    
    return Math.min(100, score);
  }
  
  private determinePriorityLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
    for (const level in this.priorityThresholds) {
      const { min, max, level: priorityLevel } = this.priorityThresholds[level];
      if (score >= min && score <= max) {
        return priorityLevel;
      }
    }
    return 'medium'; // Default to medium if no match found (shouldn't happen with proper thresholds)
  }
  
  private getRecommendedActions(
    priorityLevel: string, 
    nlpResult: NlpResult
  ): string[] {
    const actions: string[] = [];
    
    // Base actions on priority level
    switch (priorityLevel) {
      case 'critical':
        actions.push('Respond within 1 hour');
        actions.push('Notify team lead');
        actions.push('Escalate if no response within 30 minutes');
        break;
      case 'high':
        actions.push('Respond within 4 hours');
        actions.push('Add to high-priority queue');
        break;
      case 'medium':
        actions.push('Respond within 24 hours');
        actions.push('Add to standard queue');
        break;
      case 'low':
      default:
        actions.push('Respond within 48 hours');
        actions.push('Add to low-priority queue');
        break;
    }
    
    // Additional actions based on content
    if (nlpResult.categories.isPurchaseOrder) {
      actions.push('Process PO in ERP system');
      actions.push('Acknowledge receipt to sender');
    }
    
    if (nlpResult.categories.isPaymentConfirmation) {
      actions.push('Verify payment in accounting system');
      actions.push('Update invoice status');
    }
    
    if (nlpResult.categories.isClientInquiry) {
      actions.push('Prepare information package');
      if (nlpResult.ufuduMetadata.clientId) {
        actions.push('Review client history');
      }
    }
    
    // Add sentiment-based actions
    if (nlpResult.sentiment.label === 'negative') {
      actions.push('Handle with care - negative sentiment detected');
      actions.push('Consider escalation to customer service manager');
    }
    
    return actions;
  }
  
  private calculateResponseTime(
    priorityLevel: string,
    nlpResult: NlpResult
  ): { target: number; urgency: 'low' | 'medium' | 'high' | 'critical' } {
    // Base response times (in minutes)
    const baseResponseTimes: Record<string, number> = {
      critical: 60,    // 1 hour
      high: 240,       // 4 hours
      medium: 1440,    // 24 hours
      low: 2880,       // 48 hours
    };
    
    let targetMinutes = baseResponseTimes[priorityLevel] || 1440; // Default to 24 hours
    
    // Adjust based on content
    if (nlpResult.categories.isUrgent) {
      targetMinutes = Math.max(30, targetMinutes * 0.5); // Reduce time for urgent items
    }
    
    if (nlpResult.sentiment.label === 'negative') {
      targetMinutes = Math.max(60, targetMinutes * 0.7); // Reduce time for negative sentiment
    }
    
    // Determine urgency level based on adjusted time
    let urgency: 'low' | 'medium' | 'high' | 'critical' = 'medium';
    if (targetMinutes <= 60) urgency = 'critical';
    else if (targetMinutes <= 240) urgency = 'high';
    else if (targetMinutes <= 1440) urgency = 'medium';
    else urgency = 'low';
    
    return {
      target: Math.round(targetMinutes),
      urgency
    };
  }
  
  // Helper methods (would be implemented with actual integrations in a real system)
  
  private isVipClient(clientId: string): boolean {
    // In a real implementation, this would check a CRM or database
    // For now, we'll assume any client ID with 'vip' in it is a VIP
    return clientId.toLowerCase().includes('vip');
  }
  
  private getProjectStatus(projectReference: string): string {
    // In a real implementation, this would check a project management system
    // For now, return a mock status
    const statuses = ['active', 'on_hold', 'completed', 'cancelled'];
    return statuses[Math.floor(Math.random() * statuses.length)];
  }
  
  private getCommunicationHistory(email: string): { recentEmails: number; lastContact: Date | null } {
    // In a real implementation, this would check email history or CRM
    // For now, return mock data
    return {
      recentEmails: Math.floor(Math.random() * 10),
      lastContact: Math.random() > 0.3 ? new Date() : null
    };
  }
  
  private getProjectValue(projectReference: string): number {
    // In a real implementation, this would check a project management system
    // For now, return a random value between 1000 and 100000
    return Math.floor(Math.random() * 99000) + 1000;
  }
  
  // Description generators for factors
  
  private getSenderImportanceDescription(score: number): string {
    if (score >= 80) return 'Internal/Ufudu executive email';
    if (score >= 60) return 'Known client or internal team member';
    if (score >= 40) return 'New lead with potential';
    if (score >= 20) return 'General inquiry';
    return 'Unknown sender';
  }
  
  private getUrgencyDescription(score: number): string {
    if (score >= 80) return 'High urgency - contains critical or time-sensitive information';
    if (score >= 60) return 'Moderate urgency - may require prompt attention';
    if (score >= 40) return 'Standard priority - handle during business hours';
    return 'Low urgency - can be addressed when convenient';
  }
  
  private getRelationshipDescription(score: number): string {
    if (score >= 80) return 'Active client with ongoing projects';
    if (score >= 60) return 'Existing client relationship';
    if (score >= 40) return 'New lead with potential';
    return 'New or unestablished contact';
  }
  
  private getBusinessImpactDescription(score: number): string {
    if (score >= 80) return 'High business impact - direct revenue or critical operation';
    if (score >= 60) return 'Moderate business impact - potential revenue or important operation';
    if (score >= 40) return 'Standard business impact - routine communication';
    return 'Low business impact - informational or non-critical';
  }
  
  private getTimeSensitivityDescription(score: number): string {
    if (score >= 80) return 'Immediate attention required - time-critical';
    if (score >= 60) return 'Time-sensitive - respond within business day';
    if (score >= 40) return 'Moderate time sensitivity - respond within 48 hours';
    return 'Low time sensitivity - respond when possible';
  }
}
