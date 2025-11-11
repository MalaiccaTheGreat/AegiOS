import { db } from '../../db';
import { chatMessages, chatRooms } from '../../models/chatMessage';
import { businesses } from '../../models/business';
import { users } from '../../models/user';
import { Configuration, OpenAIApi } from 'openai';

// Initialize OpenAI
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

// Cache for storing analysis results
const analysisCache = new Map<string, any>();

export interface MessageAnalysis {
  sentiment: 'positive' | 'neutral' | 'negative';
  keyPoints: string[];
  suggestedResponses: string[];
  requiresFollowUp: boolean;
  priority: 'low' | 'medium' | 'high';
  isSensitive: boolean;
  moderation: {
    flagged: boolean;
    categories?: Record<string, boolean>;
  };
  entities: Array<{
    text: string;
    type: 'PERSON' | 'ORG' | 'GPE' | 'PRODUCT' | 'EVENT' | 'OTHER';
  }>;
  actionItems?: string[];
  sentimentScore: number; // -1 (negative) to 1 (positive)
}

export async function analyzeMessage({
  content,
  attachments,
  senderId,
  roomId,
}: {
  content: string;
  attachments: Array<{ type: string; name: string }>;
  senderId: number;
  roomId: string;
}): Promise<MessageAnalysis> {
  // Check cache first
  const cacheKey = `${roomId}:${content}`;
  const cached = analysisCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    // Get context about the conversation
    const [room, sender, recentMessages] = await Promise.all([
      db.query.chatRooms.findFirst({
        where: (chatRooms, { eq }) => eq(chatRooms.id, roomId),
      }),
      db.query.users.findFirst({
        where: (users, { eq }) => eq(users.id, senderId),
        columns: {
          id: true,
          name: true,
          email: true,
          isAdmin: true,
        },
      }),
      db.query.chatMessages.findMany({
        where: (messages, { eq, and, gt }) => 
          and(
            eq(messages.roomId, roomId),
            gt(messages.createdAt, new Date(Date.now() - 24 * 60 * 60 * 1000)) // Last 24h
          ),
        orderBy: (messages, { desc }) => [desc(messages.createdAt)],
        limit: 10,
        columns: {
          content: true,
          senderId: true,
          createdAt: true,
        },
        with: {
          sender: {
            columns: {
              name: true,
              email: true,
            },
          },
        },
      }),
    ]);

    // Check for sensitive information
    const isSensitive = await checkForSensitiveInfo(content);
    
    // Check content moderation
    const moderation = await moderateContent(content);
    
    if (moderation.flagged) {
      const result: MessageAnalysis = {
        sentiment: 'neutral',
        keyPoints: [],
        suggestedResponses: [],
        requiresFollowUp: true,
        priority: 'high',
        isSensitive: true,
        moderation,
        entities: [],
        sentimentScore: 0,
      };
      analysisCache.set(cacheKey, result);
      return result;
    }

    // Use OpenAI for advanced analysis
    const analysis = await analyzeWithAI({
      content,
      attachments,
      sender: sender?.name || 'User',
      isAdmin: sender?.isAdmin || false,
      roomName: room?.name || 'Chat',
      recentMessages: recentMessages.map(m => ({
        content: m.content,
        sender: m.sender?.name || 'User',
        timestamp: m.createdAt.toISOString(),
      })),
    });

    // Extract entities
    const entities = extractEntities(content);
    
    // Determine sentiment score
    const sentimentScore = calculateSentimentScore(content, analysis.sentiment);

    const result: MessageAnalysis = {
      ...analysis,
      isSensitive,
      moderation,
      entities,
      sentimentScore,
    };

    // Cache the result for 1 hour
    analysisCache.set(cacheKey, result);
    setTimeout(() => analysisCache.delete(cacheKey), 60 * 60 * 1000);

    return result;
  const suggestedResponses = generateSuggestedResponses(content, recentMessages);

  // Check if follow-up is needed
  const requiresFollowUp = checkIfFollowUpNeeded(content, sentiment, attachments);

  // Determine priority
  const priority = determinePriority(content, sentiment, sender, room);

  return {
    sentiment,
    keyPoints: keyPoints.length > 0 ? keyPoints : undefined,
}

// Check for sensitive information
async function checkForSensitiveInfo(content: string): Promise<boolean> {
  const sensitivePatterns = [
    /\b\d{3}-\d{2}-\d{4}\b/, // SSN
    /\b\d{16}\b/, // Credit card
    /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/, // Credit card with spaces/dashes
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // Email
    /\b\d{3}[-\.\s]?\d{3}[-\.\s]?\d{4}\b/, // Phone number
    /\b[A-Z]\d[A-Z] \d[A-Z]\d\b/, // Canadian postal code
    /\b\d{5}(?:[-\s]\d{4})?\b/, // US ZIP code
  ];

  // Check for sensitive patterns
  if (sensitivePatterns.some(pattern => pattern.test(content))) {
    return true;
  }

  // Use AI for more complex detection
  try {
    const response = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a security assistant. Does the following message contain any sensitive information like personal data, financial information, or credentials? Respond with only "true" or "false".',
        },
        {
          role: 'user',
          content: `Message: "${content}"`,
        },
      ],
      temperature: 0,
      max_tokens: 10,
    });

    const result = response.data.choices[0]?.message?.content?.toLowerCase().trim();
    return result === 'true';
  } catch (error) {
    console.error('Error checking for sensitive info:', error);
    return false;
  }
}

// Moderate content for inappropriate content
async function moderateContent(content: string): Promise<{ flagged: boolean; categories?: Record<string, boolean> }> {
  try {
    const response = await openai.createModeration({
      input: content,
    });

    const result = response.data.results[0];
    if (!result) {
      return { flagged: false };
    }

    return {
      flagged: result.flagged,
      categories: result.categories,
    };
  } catch (error) {
    console.error('Error moderating content:', error);
    return { flagged: false };
  }
}

// Analyze message with AI
async function analyzeWithAI({
  content,
  attachments,
  sender,
  isAdmin,
  roomName,
  recentMessages,
}: {
  content: string;
  attachments: Array<{ type: string; name: string }>;
  sender: string;
  isAdmin: boolean;
  roomName: string;
  recentMessages: Array<{ content: string; sender: string; timestamp: string }>;
}): Promise<Omit<MessageAnalysis, 'isSensitive' | 'moderation' | 'entities' | 'sentimentScore'>> {
  try {
    const context = recentMessages
      .slice(0, 5) // Last 5 messages for context
      .map(m => `${m.sender}: ${m.content}`)
      .join('\n');

    const response = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `You are an advanced chat analysis AI. Analyze the following message and provide:
          1. Sentiment (positive, neutral, negative)
          2. Key points (up to 3)
          3. Suggested responses (3 options)
          4. Whether follow-up is needed (true/false)
          5. Priority (low, medium, high)
          6. Any action items (list)
          
          Format as JSON with these exact keys: sentiment, keyPoints, suggestedResponses, requiresFollowUp, priority, actionItems`,
        },
        {
          role: 'user',
          content: `Room: ${roomName}
          Sender: ${sender} ${isAdmin ? '(Admin)' : ''}
          Message: "${content}"
          ${attachments.length > 0 ? `\nAttachments: ${attachments.map(a => a.name).join(', ')}` : ''}
          ${context ? `\nRecent messages for context:\n${context}` : ''}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 500,
    });

    const content = response.data.choices[0]?.message?.content || '{}';
    const result = JSON.parse(content);

    // Validate and sanitize the response
    return {
      sentiment: ['positive', 'neutral', 'negative'].includes(result.sentiment?.toLowerCase())
        ? (result.sentiment.toLowerCase() as 'positive' | 'neutral' | 'negative')
        : 'neutral',
      keyPoints: Array.isArray(result.keyPoints)
        ? result.keyPoints.slice(0, 3)
        : [],
      suggestedResponses: Array.isArray(result.suggestedResponses)
        ? result.suggestedResponses.slice(0, 3)
        : [],
      requiresFollowUp: Boolean(result.requiresFollowUp),
      priority: ['low', 'medium', 'high'].includes(result.priority?.toLowerCase())
        ? (result.priority.toLowerCase() as 'low' | 'medium' | 'high')
        : 'medium',
      actionItems: Array.isArray(result.actionItems) ? result.actionItems : [],
    };
  } catch (error) {
    console.error('Error analyzing message with AI:', error);
    // Fallback to simple analysis
    return {
      sentiment: analyzeSentiment(content),
      keyPoints: extractKeyPoints(content),
      suggestedResponses: generateSuggestedResponses(content, []),
      requiresFollowUp: checkIfFollowUpNeeded(content, 'neutral', attachments),
      priority: 'medium',
      actionItems: [],
    };
  }
}

// Extract named entities from text
function extractEntities(text: string): Array<{ text: string; type: string }> {
  // This is a simplified version. In production, use a proper NER library or API
  const entities: Array<{ text: string; type: string }> = [];
  
  // Simple regex patterns for common entities
  const patterns: Array<[RegExp, string]> = [
    [/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g, 'PERSON'], // Names (Title Case)
    [/\b(?:https?|ftp):\/\/[^\s/$.?#].[^\s]*\b/gi, 'URL'], // URLs
    [/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, 'EMAIL'], // Emails
    [/\b\d{3}[-\.\s]?\d{3}[-\.\s]?\d{4}\b/g, 'PHONE'], // Phone numbers
    [/\b\d{1,5}\s+[A-Za-z]+(?:\s+[A-Za-z]+)*\b/g, 'ADDRESS'], // Street addresses
  ];
  
  for (const [pattern, type] of patterns) {
    const matches = text.match(pattern) || [];
    for (const match of matches) {
      if (!entities.some(e => e.text === match)) {
        entities.push({ text: match, type });
      }
    }
  }
  
  return entities;
}

// Calculate sentiment score (-1 to 1)
function calculateSentimentScore(text: string, sentiment: string): number {
  // Simple implementation - in production, use a proper sentiment analysis library
  const positiveWords = ['good', 'great', 'awesome', 'happy', 'excellent', 'love', 'like', 'perfect'];
  const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'angry', 'upset', 'sad', 'poor'];
  
  const words = text.toLowerCase().split(/\s+/);
  let score = 0;
  
  for (const word of words) {
    if (positiveWords.includes(word)) score += 1;
    if (negativeWords.includes(word)) score -= 1;
  }
  
  // Normalize to -1 to 1 range
  const normalizedScore = Math.max(-1, Math.min(1, score / 10));
  
  // Adjust based on sentiment if available
  if (sentiment === 'positive') return Math.max(0.1, normalizedScore);
  if (sentiment === 'negative') return Math.min(-0.1, normalizedScore);
  return normalizedScore;
}

// Fallback analysis functions (used when AI is not available)
function analyzeSentiment(text: string): 'positive' | 'neutral' | 'negative' {
  const positiveWords = ['happy', 'great', 'awesome', 'thanks', 'thank you', 'good', 'excellent'];
  const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'angry', 'upset'];
  
  const words = text.toLowerCase().split(/\s+/);
  const positiveCount = words.filter(word => positiveWords.includes(word)).length;
  const negativeCount = words.filter(word => negativeWords.includes(word)).length;
  
  if (positiveCount > negativeCount) return 'positive';
  if (negativeCount > positiveCount) return 'negative';
  return 'neutral';
}

function extractKeyPoints(text: string): string[] {
  // Simple implementation - in production, use NLP to extract key points
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  return sentences.slice(0, 3);
}

function generateSuggestedResponses(
  currentMessage: string,
  recentMessages: Array<{ content: string }>
): string[] {
  // Simple implementation - in production, use AI to generate contextual responses
  const responses = [
    'Thanks for letting me know!',
    'I understand.',
    'Could you tell me more about that?',
    'I appreciate your message.',
    'Let me think about that.',
    'That makes sense.',
    'Interesting point!',
    'I see what you mean.',
    'Thanks for sharing!',
    'Got it, thanks!',
  ];
  
  // Shuffle and return 3 responses
  return responses
    .sort(() => 0.5 - Math.random())
    .slice(0, 3);
}

function checkIfFollowUpNeeded(
  content: string,
  sentiment: string,
  attachments: Array<{ type: string }>
): boolean {
  // Check for questions
  if (content.includes('?') || 
      /\b(can you|could you|would you|please|help|advice|suggest)\b/i.test(content)) {
    return true;
  }
  
  // Check for negative sentiment
  if (sentiment === 'negative') {
    return true;
  }
  
  // Check for attachments that might need review
  if (attachments.some(a => 
    ['application/pdf', 'image/', 'video/'].some(t => a.type.startsWith(t))
  )) {
    return true;
  }
  
  return false;
}

function determinePriority(
  content: string,
  sentiment: string,
  sender: { isAdmin?: boolean } | undefined,
  room: { isGroup?: boolean } | undefined
): 'low' | 'medium' | 'high' {
  // High priority for negative sentiment or admin messages
  if (sentiment === 'negative' || sender?.isAdmin) {
    return 'high';
  }
  
  // Check for urgency indicators
  const urgencyIndicators = ['urgent', 'asap', 'immediately', 'right away'];
  const isUrgent = urgencyIndicators.some(word => 
    content.toLowerCase().includes(word)
  );
  
  if (isUrgent) {
    return 'high';
  }
  
  // Group messages might be lower priority
  if (room?.isGroup) {
    return 'low';
  }
  
  return 'medium';
}

export default {
  analyzeMessage,
};
