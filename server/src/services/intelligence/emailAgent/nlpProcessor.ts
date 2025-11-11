import { logger } from '../../../../utils/logger';
import natural from 'natural';
import { WordTokenizer, PorterStemmer } from 'natural';
import * as compromise from 'compromise';
import { Client } from '@elastic/elasticsearch';
import { config } from '../../../../config';

interface EmailContent {
  subject: string;
  from: string;
  to: string | string[] | undefined;
  text: string;
  html?: string;
  attachments: any[];
  headers: Record<string, any>;
}

interface NlpResult {
  // Basic email information
  emailId: string;
  processedAt: Date;
  
  // Extracted entities
  entities: {
    people: string[];
    organizations: string[];
    locations: string[];
    dates: Date[];
    money: Array<{ amount: number; currency: string }>;
    urls: string[];
    phoneNumbers: string[];
    emailAddresses: string[];
  };
  
  // Classification
  categories: {
    isPurchaseOrder: boolean;
    isPaymentConfirmation: boolean;
    isClientInquiry: boolean;
    isUrgent: boolean;
    isInternal: boolean;
    isNewsletter: boolean;
    isPromotional: boolean;
  };
  
  // Sentiment analysis
  sentiment: {
    score: number; // -1 (negative) to 1 (positive)
    magnitude: number; // 0 to +inf
    label: 'positive' | 'negative' | 'neutral';
  };
  
  // Key phrases extraction
  keyPhrases: string[];
  
  // Intent detection
  intents: Array<{
    intent: string;
    confidence: number;
  }>;
  
  // Attachments analysis
  attachments: Array<{
    filename: string;
    contentType: string;
    size: number;
    isPdf: boolean;
    isImage: boolean;
    isSpreadsheet: boolean;
    isDocument: boolean;
  }>;
  
  // Custom Ufudu specific fields
  ufuduMetadata: {
    isUfuduDomain: boolean;
    businessUnit?: string;
    projectReference?: string;
    clientId?: string;
    orderNumber?: string;
    paymentReference?: string;
  };
  
  // Raw text analysis
  textAnalysis: {
    wordCount: number;
    characterCount: number;
    averageWordLength: number;
    readingLevel: string;
    language: string;
  };
}

export class NlpProcessor {
  private tokenizer: natural.WordTokenizer;
  private classifier: natural.BayesClassifier;
  private elasticClient: Client;
  private ufuduDomains: string[] = [
    'ufudu.co.za',
    'ufudu.com',
    'ufudugroup.com',
    'ufudutech.com'
  ];
  
  constructor() {
    this.tokenizer = new WordTokenizer();
    this.classifier = new natural.BayesClassifier(PorterStemmer);
    this.initializeClassifier();
    
    // Initialize Elasticsearch client if configured
    if (config.elasticsearch) {
      this.elasticClient = new Client({
        node: config.elasticsearch.node,
        auth: config.elasticsearch.auth,
      });
    }
  }
  
  private initializeClassifier(): void {
    // Train the classifier with some basic categories
    // In a real application, this would be trained on a larger dataset
    
    // Purchase Order examples
    this.classifier.addDocument('please find attached our purchase order', 'purchase_order');
    this.classifier.addDocument('attached is our official purchase order', 'purchase_order');
    this.classifier.addDocument('we would like to order the following items', 'purchase_order');
    
    // Payment examples
    this.classifier.addDocument('please find attached proof of payment', 'payment_confirmation');
    this.classifier.addDocument('we have made the payment', 'payment_confirmation');
    this.classifier.addDocument('transaction reference number', 'payment_confirmation');
    
    // Client inquiry examples
    this.classifier.addDocument('I would like to inquire about', 'client_inquiry');
    this.classifier.addDocument('can you please provide more information', 'client_inquiry');
    this.classifier.addDocument('I have a question about', 'client_inquiry');
    
    // Train the classifier
    this.classifier.train();
  }
  
  public async processEmail(email: EmailContent, bodyText: string): Promise<NlpResult> {
    const processedAt = new Date();
    const emailId = email.headers['message-id'] || `local-${Date.now()}`;
    
    // Basic text analysis
    const words = this.tokenizer.tokenize(bodyText) || [];
    const wordCount = words.length;
    const characterCount = bodyText.length;
    const averageWordLength = wordCount > 0 
      ? words.reduce((sum, word) => sum + word.length, 0) / wordCount 
      : 0;
    
    // Analyze with compromise
    const doc = compromise.default(bodyText);
    
    // Extract entities
    const entities = {
      people: this.extractPeople(doc),
      organizations: this.extractOrganizations(doc),
      locations: this.extractLocations(doc),
      dates: this.extractDates(doc),
      money: this.extractMoney(doc),
      urls: this.extractUrls(bodyText),
      phoneNumbers: this.extractPhoneNumbers(bodyText),
      emailAddresses: this.extractEmailAddresses(bodyText),
    };
    
    // Classify email
    const classification = this.classifyEmail(email.subject, bodyText);
    
    // Analyze sentiment
    const sentiment = this.analyzeSentiment(bodyText);
    
    // Extract key phrases
    const keyPhrases = this.extractKeyPhrases(bodyText);
    
    // Detect intents
    const intents = this.detectIntents(bodyText);
    
    // Analyze attachments
    const attachments = this.analyzeAttachments(email.attachments);
    
    // Extract Ufudu specific metadata
    const ufuduMetadata = this.extractUfuduMetadata(email, bodyText);
    
    // Text analysis
    const textAnalysis = {
      wordCount,
      characterCount,
      averageWordLength,
      readingLevel: this.calculateReadingLevel(bodyText),
      language: this.detectLanguage(bodyText),
    };
    
    const result: NlpResult = {
      emailId,
      processedAt,
      entities,
      categories: classification,
      sentiment,
      keyPhrases,
      intents,
      attachments,
      ufuduMetadata,
      textAnalysis,
    };
    
    // Index in Elasticsearch if available
    if (this.elasticClient) {
      try {
        await this.elasticClient.index({
          index: 'emails',
          id: emailId,
          body: {
            ...result,
            email: {
              subject: email.subject,
              from: email.from,
              to: email.to,
              date: new Date(),
              hasAttachments: attachments.length > 0,
            },
            timestamp: processedAt.toISOString(),
          },
        });
      } catch (error) {
        logger.error('Error indexing email in Elasticsearch:', error);
      }
    }
    
    return result;
  }
  
  private extractPeople(doc: any): string[] {
    // Extract people using compromise
    const people = doc.people().out('array');
    return Array.from(new Set(people)); // Remove duplicates
  }
  
  private extractOrganizations(doc: any): string[] {
    // Extract organizations using compromise
    const orgs = doc.organizations().out('array');
    return Array.from(new Set(orgs));
  }
  
  private extractLocations(doc: any): string[] {
    // Extract locations using compromise
    const places = doc.places().out('array');
    return Array.from(new Set(places));
  }
  
  private extractDates(doc: any): Date[] {
    // Extract dates using compromise
    const dateStrings = doc.dates().out('array');
    return dateStrings
      .map((dateStr: string) => {
        try {
          return new Date(dateStr);
        } catch (e) {
          return null;
        }
      })
      .filter((date: Date | null): date is Date => date !== null && !isNaN(date.getTime()));
  }
  
  private extractMoney(doc: any): Array<{ amount: number; currency: string }> {
    // Extract monetary values using compromise
    const money = doc.values().toNumber().out('array');
    
    // This is a simplified version - in a real app, you'd need more sophisticated parsing
    return money
      .filter((m: any) => m.unit === 'dollar' || m.unit === 'rand' || m.unit === 'euro')
      .map((m: any) => ({
        amount: parseFloat(m.number) * (m.prefix === '-' ? -1 : 1),
        currency: m.unit.toUpperCase(),
      }));
  }
  
  private extractUrls(text: string): string[] {
    // Simple URL extraction
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.match(urlRegex) || [];
  }
  
  private extractPhoneNumbers(text: string): string[] {
    // Simple phone number extraction (South African format)
    const phoneRegex = /(\+27|0)[\s-]?[1-9][\s-]?\d{8}/g;
    return text.match(phoneRegex) || [];
  }
  
  private extractEmailAddresses(text: string): string[] {
    // Simple email extraction
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    return text.match(emailRegex) || [];
  }
  
  private classifyEmail(subject: string, body: string) {
    // Use the trained classifier
    const classification = this.classifier.classify(`${subject} ${body}`);
    
    // Additional rules can be added here
    const isPurchaseOrder = 
      classification === 'purchase_order' || 
      /purchase\s*order|p\.?o\.?\s*#?\d+/i.test(subject) ||
      /please\s+find\s+attached\s+(our\s+)?purchase\s+order/i.test(body);
      
    const isPaymentConfirmation = 
      classification === 'payment_confirmation' ||
      /payment\s+confirmation|proof\s+of\s+payment|p\.?o\.?p/i.test(subject) ||
      /(attached|find)\s+(is\s+)?(the\s+)?(proof\s+of\s+)?payment/i.test(body);
      
    const isClientInquiry = 
      classification === 'client_inquiry' ||
      /inquiry|question|help|support/i.test(subject) ||
      /i\s+have\s+a\s+question|can\s+you\s+help|need\s+information/i.test(body);
    
    // Additional heuristics
    const isUrgent = /urgent|asap|immediate|important/i.test(subject) || 
                    /urgent|asap|immediate|important/i.test(body);
                    
    const isNewsletter = /newsletter|update|digest|bulletin/i.test(subject) ||
                       /unsubscribe|subscribe|newsletter/i.test(body);
                       
    const isPromotional = /sale|discount|offer|promotion|limited time/i.test(subject) ||
                         /sale|discount|offer|promotion|limited time|% off/i.test(body);
    
    // Check if it's internal communication
    const from = subject.toLowerCase();
    const isInternal = this.ufuduDomains.some(domain => from.includes(domain));
    
    return {
      isPurchaseOrder,
      isPaymentConfirmation,
      isClientInquiry,
      isUrgent,
      isInternal,
      isNewsletter,
      isPromotional,
    };
  }
  
  private analyzeSentiment(text: string) {
    // Simple sentiment analysis
    // In a real application, you might use a more sophisticated library or API
    const positiveWords = ['great', 'good', 'excellent', 'awesome', 'thanks', 'thank you', 'happy', 'pleased'];
    const negativeWords = ['bad', 'poor', 'terrible', 'awful', 'disappointed', 'unhappy', 'angry'];
    
    const words = text.toLowerCase().split(/\s+/);
    let positiveScore = 0;
    let negativeScore = 0;
    
    words.forEach(word => {
      if (positiveWords.includes(word)) positiveScore++;
      if (negativeWords.includes(word)) negativeScore++;
    });
    
    const totalWords = words.length;
    const positiveRatio = positiveScore / totalWords;
    const negativeRatio = negativeScore / totalWords;
    
    let score = 0;
    let label: 'positive' | 'negative' | 'neutral' = 'neutral';
    
    if (positiveRatio > 0.1) {
      score = positiveRatio;
      label = 'positive';
    } else if (negativeRatio > 0.1) {
      score = -negativeRatio;
      label = 'negative';
    }
    
    return {
      score: Math.max(-1, Math.min(1, score)), // Clamp between -1 and 1
      magnitude: positiveScore + negativeScore,
      label,
    };
  }
  
  private extractKeyPhrases(text: string): string[] {
    // Simple key phrase extraction
    // In a real application, you might use a more sophisticated approach
    const sentences = text.split(/[.!?]+/);
    return sentences
      .filter(sentence => {
        const words = sentence.trim().split(/\s+/);
        return words.length >= 3 && words.length <= 10;
      })
      .slice(0, 5); // Return top 5 phrases
  }
  
  private detectIntents(text: string) {
    // Simple intent detection
    // In a real application, you might use a more sophisticated approach
    const intents: Array<{intent: string; confidence: number}> = [];
    
    // Check for request for information
    if (/what|how|when|where|who|can you|could you|please send/i.test(text)) {
      intents.push({ intent: 'request_information', confidence: 0.8 });
    }
    
    // Check for complaint
    if (/problem|issue|error|not working|doesn't work|broken/i.test(text)) {
      intents.push({ intent: 'report_issue', confidence: 0.9 });
    }
    
    // Check for appreciation
    if (/thank|thanks|appreciate|great job|well done/i.test(text)) {
      intents.push({ intent: 'express_gratitude', confidence: 0.95 });
    }
    
    // If no specific intent detected, classify as general inquiry
    if (intents.length === 0) {
      intents.push({ intent: 'general_inquiry', confidence: 0.7 });
    }
    
    return intents;
  }
  
  private analyzeAttachments(attachments: any[]) {
    return attachments.map(attachment => ({
      filename: attachment.filename || 'unnamed',
      contentType: attachment.contentType || 'application/octet-stream',
      size: attachment.size || 0,
      isPdf: (attachment.contentType || '').toLowerCase().includes('pdf'),
      isImage: (attachment.contentType || '').startsWith('image/'),
      isSpreadsheet: (attachment.contentType || '').includes('spreadsheet') || 
                   (attachment.filename || '').match(/\.(xlsx?|ods|csv)$/i) !== null,
      isDocument: (attachment.contentType || '').includes('document') || 
                 (attachment.filename || '').match(/\.(docx?|odt|rtf|txt)$/i) !== null,
    }));
  }
  
  private extractUfuduMetadata(email: EmailContent, bodyText: string) {
    // Check if from Ufudu domain
    const from = typeof email.from === 'string' ? email.from : '';
    const ufuduDomain = this.ufuduDomains.find(domain => from.includes(domain));
    
    // Extract project references (e.g., PRJ-1234)
    const projectRefMatch = bodyText.match(/PRJ-\d+/i) || [];
    const projectReference = projectRefMatch[0] || undefined;
    
    // Extract client IDs (e.g., CLT-1234)
    const clientIdMatch = bodyText.match(/CLT-\d+/i) || [];
    const clientId = clientIdMatch[0] || undefined;
    
    // Extract order numbers (e.g., ORD-1234, PO-1234)
    const orderNumberMatch = bodyText.match(/(?:ORD|PO|ORDER)[-\s]?\d+/i) || [];
    const orderNumber = orderNumberMatch[0] || undefined;
    
    // Extract payment references
    const paymentRefMatch = bodyText.match(/(?:PAY|PAYMENT|REF)[-\s]?[A-Z0-9]+/i) || [];
    const paymentReference = paymentRefMatch[0] || undefined;
    
    // Determine business unit based on email or content
    let businessUnit: string | undefined;
    const businessUnits = ['construction', 'retail', 'education', 'accounting', 'intelligence', 'ai'];
    for (const unit of businessUnits) {
      if (from.includes(unit) || bodyText.toLowerCase().includes(unit)) {
        businessUnit = unit;
        break;
      }
    }
    
    return {
      isUfuduDomain: !!ufuduDomain,
      businessUnit,
      projectReference,
      clientId,
      orderNumber,
      paymentReference,
    };
  }
  
  private calculateReadingLevel(text: string): string {
    // Simple Flesch-Kincaid reading level approximation
    const words = text.split(/\s+/).filter(word => word.length > 0);
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const syllables = words.reduce((count, word) => count + this.countSyllables(word), 0);
    
    if (sentences.length === 0 || words.length === 0) return 'Unknown';
    
    const wordsPerSentence = words.length / sentences.length;
    const syllablesPerWord = syllables / words.length;
    
    // Flesch-Kincaid Grade Level
    const fkGrade = 0.39 * wordsPerSentence + 11.8 * syllablesPerWord - 15.59;
    
    if (fkGrade < 6) return 'Elementary';
    if (fkGrade < 9) return 'Middle School';
    if (fkGrade < 13) return 'High School';
    if (fkGrade < 16) return 'College';
    return 'Graduate';
  }
  
  private countSyllables(word: string): number {
    // Simple syllable counter (approximate)
    word = word.toLowerCase().replace(/'/g, '');
    if (word.length <= 3) return 1;
    
    word = word.replace(/(?:[^laeiouy]|ed|[^laeiouy]e)$/, '');
    word = word.replace(/^y/, '');
    const syllables = word.match(/[aeiouy]{1,2}/g);
    return syllables ? syllables.length : 1;
  }
  
  private detectLanguage(text: string): string {
    // Simple language detection (English by default)
    // In a real application, you might use a library like franc or cld
    const commonEnglishWords = ['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'any', 'can'];
    const words = text.toLowerCase().split(/\s+/);
    const englishWordCount = words.filter(word => commonEnglishWords.includes(word)).length;
    
    // If more than 20% of common words are English, assume English
    return (englishWordCount / words.length) > 0.2 ? 'en' : 'unknown';
  }
}
