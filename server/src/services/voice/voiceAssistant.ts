import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../../utils/logger';
import { speechToText } from './speechToText';
import { textToSpeech } from './textToSpeech';
import { commandProcessor, type CommandContext, type CommandResponse } from './commandProcessor';

interface VoiceAssistantOptions {
  language?: string;
  voiceName?: string;
  enableVoiceResponse?: boolean;
  sessionTimeoutMs?: number;
}

export class VoiceAssistant {
  private options: Required<VoiceAssistantOptions>;
  private sessions: Map<string, {
    context: CommandContext;
    lastActive: number;
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string; timestamp: Date }>;
  }> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor(options: VoiceAssistantOptions = {}) {
    this.options = {
      language: 'en-US',
      voiceName: 'en-US-Wavenet-D',
      enableVoiceResponse: true,
      sessionTimeoutMs: 15 * 60 * 1000, // 15 minutes
      ...options,
    };

    // Clean up inactive sessions periodically
    this.cleanupInterval = setInterval(() => this.cleanupInactiveSessions(), 5 * 60 * 1000); // Every 5 minutes
  }

  /**
   * Process audio input and return a response
   * @param audioData The audio data to process
   * @param sessionId Optional session ID for continuing a conversation
   * @param context Additional context for the command
   */
  async processAudio(
    audioData: Buffer,
    sessionId?: string,
    context: Partial<CommandContext> = {}
  ): Promise<{
    sessionId: string;
    textResponse: string;
    audioResponse?: Buffer;
    followUpQuestions?: string[];
    context: CommandContext;
  }> {
    // Get or create session
    const session = this.getOrCreateSession(sessionId, context);
    session.lastActive = Date.now();

    try {
      // Convert speech to text
      const { text: userText, isFinal } = await speechToText.recognize(audioData, {
        language: this.options.language,
      });

      if (!isFinal) {
        return {
          sessionId: sessionId || session.context.sessionId,
          textResponse: 'Could not understand audio. Please try again.',
          context: session.context,
        };
      }

      // Add user message to conversation history
      session.conversationHistory.push({
        role: 'user',
        content: userText,
        timestamp: new Date(),
      });

      // Process the command
      const commandResponse = await this.processCommand(userText, session.context);

      // Generate response
      const response = await this.generateResponse(commandResponse, session.context);

      // Add assistant response to conversation history
      session.conversationHistory.push({
        role: 'assistant',
        content: response.textResponse,
        timestamp: new Date(),
      });

      // Update session context
      if (commandResponse.contextUpdates) {
        session.context = { ...session.context, ...commandResponse.contextUpdates };
      }

      return {
        sessionId: session.context.sessionId,
        ...response,
        context: session.context,
      };
    } catch (error) {
      logger.error('Error processing audio:', error);
      
      return {
        sessionId: session.context.sessionId,
        textResponse: 'Sorry, I encountered an error processing your request. Please try again.',
        context: session.context,
      };
    }
  }

  /**
   * Process text input and return a response
   * @param text The text to process
   * @param sessionId Optional session ID for continuing a conversation
   * @param context Additional context for the command
   */
  async processText(
    text: string,
    sessionId?: string,
    context: Partial<CommandContext> = {}
  ): Promise<{
    sessionId: string;
    textResponse: string;
    audioResponse?: Buffer;
    followUpQuestions?: string[];
    context: CommandContext;
  }> {
    // Get or create session
    const session = this.getOrCreateSession(sessionId, context);
    session.lastActive = Date.now();

    try {
      // Add user message to conversation history
      session.conversationHistory.push({
        role: 'user',
        content: text,
        timestamp: new Date(),
      });

      // Process the command
      const commandResponse = await this.processCommand(text, session.context);

      // Generate response
      const response = await this.generateResponse(commandResponse, session.context);

      // Add assistant response to conversation history
      session.conversationHistory.push({
        role: 'assistant',
        content: response.textResponse,
        timestamp: new Date(),
      });

      // Update session context
      if (commandResponse.contextUpdates) {
        session.context = { ...session.context, ...commandResponse.contextUpdates };
      }

      return {
        sessionId: session.context.sessionId,
        ...response,
        context: session.context,
      };
    } catch (error) {
      logger.error('Error processing text:', error);
      
      return {
        sessionId: session.context.sessionId,
        textResponse: 'Sorry, I encountered an error processing your request. Please try again.',
        context: session.context,
      };
    }
  }

  /**
   * Process a command and return a response
   * @param text The command text to process
   * @param context The command context
   */
  private async processCommand(
    text: string,
    context: CommandContext
  ): Promise<CommandResponse> {
    try {
      // Process the command using the command processor
      const response = await commandProcessor.processCommand(text, context);
      
      return response;
    } catch (error) {
      logger.error('Error processing command:', error);
      
      return {
        success: false,
        message: 'Sorry, I encountered an error processing your command. Please try again.',
      };
    }
  }

  /**
   * Generate a response based on the command response
   * @param commandResponse The command response
   * @param context The command context
   */
  private async generateResponse(
    commandResponse: CommandResponse,
    context: CommandContext
  ): Promise<{
    textResponse: string;
    audioResponse?: Buffer;
    followUpQuestions?: string[];
  }> {
    const { message, followUpQuestions = [] } = commandResponse;
    
    // Generate speech response if enabled
    let audioResponse: Buffer | undefined;
    if (this.options.enableVoiceResponse) {
      try {
        const speechResponse = await textToSpeech.synthesize(message, {
          language: this.options.language,
          voiceName: this.options.voiceName,
        });
        audioResponse = speechResponse.audioContent;
      } catch (error) {
        logger.error('Error generating speech response:', error);
        // Continue with text-only response if speech synthesis fails
      }
    }

    return {
      textResponse: message,
      audioResponse,
      followUpQuestions,
    };
  }

  /**
   * Get or create a session
   * @param sessionId Optional existing session ID
   * @param context Additional context for the session
   */
  private getOrCreateSession(
    sessionId?: string,
    context: Partial<CommandContext> = {}
  ) {
    const existingSession = sessionId ? this.sessions.get(sessionId) : null;
    
    if (existingSession) {
      // Update existing session context with any new context values
      existingSession.context = { ...existingSession.context, ...context };
      existingSession.lastActive = Date.now();
      return existingSession;
    }

    // Create a new session
    const newSessionId = sessionId || `sess_${uuidv4()}`;
    const newSession = {
      context: {
        sessionId: newSessionId,
        userId: context.userId || '',
        businessId: context.businessId || '',
        timestamp: new Date(),
        previousContext: {},
        ...context,
      },
      lastActive: Date.now(),
      conversationHistory: [],
    };

    this.sessions.set(newSessionId, newSession);
    return newSession;
  }

  /**
   * Clean up inactive sessions
   */
  private cleanupInactiveSessions(): void {
    const now = Date.now();
    const inactiveSessionIds: string[] = [];

    for (const [sessionId, session] of this.sessions.entries()) {
      if (now - session.lastActive > this.options.sessionTimeoutMs) {
        inactiveSessionIds.push(sessionId);
      }
    }

    // Remove inactive sessions
    for (const sessionId of inactiveSessionIds) {
      this.sessions.delete(sessionId);
    }

    if (inactiveSessionIds.length > 0) {
      logger.info(`Cleaned up ${inactiveSessionIds.length} inactive sessions`);
    }
  }

  /**
   * Get session by ID
   * @param sessionId The session ID
   */
  getSession(sessionId: string) {
    return this.sessions.get(sessionId);
  }

  /**
   * End a session
   * @param sessionId The session ID to end
   */
  endSession(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    clearInterval(this.cleanupInterval);
    this.sessions.clear();
  }
}

// Export a singleton instance
export const voiceAssistant = new VoiceAssistant();

export default voiceAssistant;
