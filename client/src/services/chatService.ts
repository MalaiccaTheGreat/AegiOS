import { v4 as uuidv4 } from 'uuid';

// Define types for WebSocket messages
type WsMessage = {
  type: string;
  payload?: any;
  timestamp?: number;
};

export type Message = {
  id: string;
  roomId: string;
  senderId: string;
  senderName?: string;
  senderAvatar?: string;
  content: string;
  timestamp: Date;
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  error?: string;
  attachments?: Array<{
    id: string;
    name: string;
    url: string;
    type: string;
    size: number;
    thumbnailUrl?: string;
    uploadProgress?: number;
  }>;
  metadata?: {
    aiAnalysis?: {
      sentiment: 'positive' | 'neutral' | 'negative';
      sentimentScore?: number;
      keyPoints?: string[];
      suggestedResponses?: string[];
      requiresFollowUp?: boolean;
      actionItems?: string[];
    };
    readBy?: Array<{
      userId: string;
      timestamp: Date;
    }>;
    reactions?: Array<{
      emoji: string;
      userId: string;
      timestamp: Date;
    }>;
    editHistory?: Array<{
      previousContent: string;
      editedAt: Date;
    }>;
    replyTo?: string; // Message ID being replied to
  };
};

type MessageHandler = (message: Message) => void;
type TypingHandler = (roomId: string, userId: string, userName: string) => void;
type ConnectionHandler = () => void; // Simplified to not require arguments
type MessageStatusHandler = (messageId: string, status: Message['status']) => void;
type RoomUpdateHandler = (room: Room) => void;

export type Room = {
  id: string;
  name: string;
  type: 'direct' | 'group' | 'channel';
  participants: Array<{
    id: string;
    name: string;
    avatar?: string;
    role?: 'admin' | 'member' | 'moderator';
    isOnline?: boolean;
    lastSeen?: Date;
  }>;
  lastMessage?: {
    id: string;
    content: string;
    senderId: string;
    timestamp: Date;
  };
  unreadCount: number;
  isMuted?: boolean;
  isPinned?: boolean;
  createdAt: Date;
  updatedAt: Date;
};

class ChatService {
  private socket: WebSocket | null = null;
  private messageHandlers: Set<MessageHandler> = new Set();
  private typingHandlers: Set<TypingHandler> = new Set();
  private connectionHandlers: Set<ConnectionHandler> = new Set();
  private messageStatusHandlers: Set<MessageStatusHandler> = new Set();
  private roomUpdateHandlers: Set<RoomUpdateHandler> = new Set();
  
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout: number | null = null;
  private heartbeatInterval: number | null = null;
  private readonly HEARTBEAT_INTERVAL = 30000; // 30 seconds
  
  private userId: string | null = null;
  private businessId: string | null = null;
  private token: string | null = null;
  private isConnected = false;
  private pendingMessages: Map<string, Message> = new Map();
  private activeRooms: Set<string> = new Set();
  private messageQueue: Array<{ type: string; data: any }> = [];
  private lastHeartbeat: number = 0;
  private connectionPromise: Promise<void> | null = null;
  private connectionResolve: (() => void) | null = null;
  private connectionReject: ((error: Error) => void) | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('token');
      // Reconnect on page visibility change
      document.addEventListener('visibilitychange', this.handleVisibilityChange);
      // Reconnect when coming back online
      window.addEventListener('online', this.handleOnline);
    }
  }

  private handleVisibilityChange = (): void => {
    if (document.visibilityState === 'visible' && !this.isConnected) {
      this.handleReconnect();
    }
  };

  private handleOnline = (): void => {
    if (!this.isConnected) {
      this.handleReconnect();
    }
  };

  private handleReconnect = (): void => {
    if (this.userId && this.businessId) {
      this.connect(this.userId, this.businessId, this.token || undefined)
        .catch(error => {
          console.error('Reconnection failed:', error);
          this.reconnectAttempts++;
          this.attemptReconnect();
        });
    }
  };

  private handleConnectionError = (error: Error): void => {
    console.error('Connection error:', error);
    if (this.connectionReject) {
      this.connectionReject(error);
      this.connectionResolve = null;
      this.connectionReject = null;
    }
    this.connectionPromise = null;
    this.attemptReconnect();
  };

  private setupEventHandlers(): void {
    if (!this.socket) return;

    this.socket.onopen = () => {
      console.log('WebSocket connected');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.lastHeartbeat = Date.now();
      
      // Authenticate with the server
      this.authenticate();
      
      // Set up ping/pong
      this.setupHeartbeat();
      
      // Notify connection handlers
      this.notifyConnectionChange();
      
      // Resolve the connection promise
      if (this.connectionResolve) {
        this.connectionResolve();
        this.connectionResolve = null;
        this.connectionReject = null;
      }
    };

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as WsMessage;
        this.handleIncomingMessage(data);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    this.socket.onclose = (event) => {
      console.log(`WebSocket disconnected (code: ${event.code}, reason: ${event.reason || 'No reason provided'})`);
      this.handleDisconnection();
    };

    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.handleDisconnection();
    };
  }

  public async connect(userId: string, businessId: string, token?: string): Promise<void> {
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = new Promise<void>((resolve, reject) => {
      this.connectionResolve = resolve;
      this.connectionReject = reject;

      try {
        if (this.socket) {
          this.disconnect();
        }

        this.userId = userId;
        this.businessId = businessId;
        
        if (token) {
          this.token = token;
          if (typeof window !== 'undefined') {
            localStorage.setItem('token', token);
          }
        }

        const protocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
        const wsUrl = `${protocol}${window.location.host}/api/ws`;
        
        this.socket = new WebSocket(wsUrl);
        this.setupEventHandlers();
      } catch (error) {
        this.handleConnectionError(error as Error);
      }
    }

    this.userId = userId;
    this.businessId = businessId;
    if (token) {
      this.token = token;
    }

    if (!this.token) {
      console.error('No authentication token available');
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/chat?token=${this.token}`;
    
    this.socket = new WebSocket(wsUrl);
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.onopen = () => {
      console.log('WebSocket connected');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.lastHeartbeat = Date.now();
      
      // Authenticate with the server
      this.authenticate();
      
      // Set up ping/pong
      this.setupHeartbeat();
      
      // Notify connection handlers
      this.notifyConnectionChange();
      
      // Resolve the connection promise
      if (this.connectionResolve) {
        this.connectionResolve();
        this.connectionResolve = null;
        this.connectionReject = null;
      }
    };

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handleIncomingMessage(data);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    this.socket.onclose = (event) => {
      console.log(`WebSocket disconnected (code: ${event.code}, reason: ${event.reason || 'No reason provided'})`);
      this.handleDisconnection();
    };

    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.handleDisconnection();
    };
  }

  private authenticate(): void {
    if (!this.socket || !this.token || !this.userId || !this.businessId) {
      console.error('Missing authentication data');
      return;
    }

    try {
      this.socket.send(JSON.stringify({
        type: 'authenticate',
        payload: {
          token: this.token,
          userId: this.userId,
          businessId: this.businessId,
        },
      }));
    } catch (error) {
      console.error('Authentication error:', error);
    }
  }

  private handleIncomingMessage(data: WsMessage): void {
    if (!data || !data.type) return;

    switch (data.type) {
      case 'pong':
        this.handlePong(data.timestamp);
        break;
        
      case 'message':
        this.handleNewMessage(data.payload);
        break;
        
      case 'message_update':
        this.handleMessageUpdate(data.payload);
        break;
        
      case 'typing':
        this.handleTypingIndicator(data.payload);
        break;
        
      case 'message_status':
        this.handleMessageStatus(data.payload);
        break;
        
      case 'room_update':
        this.handleRoomUpdate(data.payload);
        break;
        
      case 'error':
        console.error('Server error:', data.payload);
        this.handleServerError(data.payload);
        break;
        
      default:
        console.warn('Unknown message type:', data.type);
    }
  }

  private handleNewMessage(message: Message & { timestamp?: string | number | Date }): void {
    if (!message || !message.id) return;

    const formattedMessage: Message = {
      ...message,
      timestamp: new Date(message.timestamp || Date.now()),
      status: 'delivered',
      metadata: {
        ...message.metadata,
        readBy: message.metadata?.readBy?.map((r: any) => ({
          userId: r.userId,
          timestamp: new Date(r.timestamp),
        })) || [],
      },
    };

    // Update any pending message with the same ID
    if (this.pendingMessages.has(message.id)) {
      this.pendingMessages.delete(message.id);
    }

    this.notifyMessageHandlers(formattedMessage);
  }

  private handleMessageUpdate(update: { messageId: string; content?: string; metadata?: Message['metadata'] }): void {
    // Handle message updates (edits, deletions, etc.)
    // This would be implemented based on your application's needs
  }

  private handleTypingIndicator(payload: { roomId: string; userId: string; userName: string }): void {
    const { roomId, userId, userName } = payload;
    if (!roomId || !userId || !userName) return;
    
    this.typingHandlers.forEach(handler => handler(roomId, userId, userName));
  }

  private handleMessageStatus(update: { messageId: string; status: Message['status']; timestamp?: string }): void {
    const { messageId, status, timestamp } = update;
    if (!messageId || !status) return;

    // Update status in pending messages
    if (this.pendingMessages.has(messageId)) {
      const message = this.pendingMessages.get(messageId);
      if (message) {
        message.status = status;
        this.pendingMessages.set(messageId, message);
        this.notifyMessageStatusHandlers(messageId, status);
        
        // Remove delivered messages from pending after a delay
        if (status === 'delivered' || status === 'read') {
          setTimeout(() => {
            this.pendingMessages.delete(messageId);
          }, 5000);
        }
      }
    }
  }

  private handleRoomUpdate(room: Room): void {
    if (!room || !room.id) return;
    
    const formattedRoom: Room = {
      ...room,
      lastMessage: room.lastMessage ? {
        ...room.lastMessage,
        timestamp: new Date(room.lastMessage.timestamp),
      } : undefined,
      createdAt: new Date(room.createdAt),
      updatedAt: new Date(room.updatedAt),
    };
    
    this.notifyRoomUpdateHandlers(formattedRoom);
  }

  private handleServerError(error: { code: string; message: string }): void {
    console.error('Server error:', error);
    // Handle specific error codes
    if (error.code === 'AUTH_ERROR') {
      // Handle authentication error (e.g., token expired)
      this.handleAuthError();
    }
  }

  private handleAuthError(): void {
    // Clear invalid token
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
    
    // Notify the app to handle re-authentication
    this.notifyConnectionError(new Error('Authentication failed. Please log in again.'));
    this.disconnect();
  }

  private notifyMessageHandlers(message: Message): void {
    this.messageHandlers.forEach(handler => {
      try {
        handler(message);
      } catch (error) {
        console.error('Error in message handler:', error);
      }
    });
  }

  private notifyMessageStatusHandlers(messageId: string, status: Message['status']): void {
    this.messageStatusHandlers.forEach(handler => {
      try {
        handler(messageId, status);
      } catch (error) {
        console.error('Error in message status handler:', error);
      }
    });
  }

  private notifyRoomUpdateHandlers(room: Room): void {
    this.roomUpdateHandlers.forEach(handler => {
      try {
        handler(room);
      } catch (error) {
        console.error('Error in room update handler:', error);
      }
    });
  }

  private notifyConnectionChange = (): void => {
    this.connectionHandlers.forEach(handler => {
      try {
        handler();
      } catch (error) {
        console.error('Error in connection handler:', error);
      }
    });
  };

  private notifyConnectionError(error: Error): void {
    if (this.connectionReject) {
      this.connectionReject(error);
      this.connectionResolve = null;
      this.connectionReject = null;
      this.connectionPromise = null;
    }
  }

  private processMessageQueue(): void {
    if (!this.isConnected || !this.socket) return;

    while (this.messageQueue.length > 0) {
      const item = this.messageQueue.shift();
      if (!item) continue;
      
      const { type, data } = item;
      
      try {
        switch (type) {
          case 'message':
            this.sendMessage(
              data.roomId as string, 
              data.content as string, 
              data.attachments as Array<{ id: string; name: string; url: string; type: string; size: number }>, 
              data.messageId as string
            );
            break;
            
          case 'join_room':
            this.joinRoom(data.roomId as string);
            break;
            
          default:
            console.warn('Unknown queued message type:', type);
        }
      } catch (error) {
        console.error('Error processing queued message:', error);
      }
    }
  }

  public sendMessage(
    roomId: string, 
    content: string, 
    attachments: any[] = [], 
    messageId: string = uuidv4()
  ): string {
    if (!content.trim() && (!attachments || attachments.length === 0)) {
      throw new Error('Message cannot be empty');
    }
    
    const timestamp = new Date();
    const message: Message = {
      id: messageId,
      roomId,
      senderId: this.userId || '',
      content,
      timestamp,
      status: 'sending',
      attachments: attachments.map(attachment => ({
        id: attachment.id || uuidv4(),
        name: attachment.name,
        url: attachment.url,
        type: attachment.type,
        size: attachment.size,
        thumbnailUrl: attachment.thumbnailUrl,
        uploadProgress: 100, // Assume uploaded if sending
      })),
    };

    // Add to pending messages
    this.pendingMessages.set(messageId, message);
    
    // Notify immediately for optimistic UI update
    this.notifyMessageHandlers(message);

    if (this.isConnected && this.socket) {
      try {
        this.socket.send(JSON.stringify({
          type: 'message',
          payload: {
            roomId,
            content,
            messageId,
            attachments: message.attachments,
            timestamp: timestamp.toISOString(),
          },
        }));
      } catch (error) {
        console.error('Error sending message:', error);
        this.handleMessageSendError(messageId, error as Error);
      }
    } else {
      // Queue the message if not connected
      this.messageQueue.push({
        type: 'message',
        data: { roomId, content, messageId, attachments },
      });
      
      // Start reconnection if needed
      if (this.reconnectAttempts === 0) {
        this.attemptReconnect();
      }
    }

    return messageId;
  }

  private handleMessageSendError(messageId: string, error: Error): void {
    const message = this.pendingMessages.get(messageId);
    if (message) {
      message.status = 'failed';
      message.error = error.message;
      this.notifyMessageHandlers(message);
      
      // Remove from pending after a delay
      setTimeout(() => {
        this.pendingMessages.delete(messageId);
      }, 5000);
    }
  }

  public editMessage(messageId: string, newContent: string): void {
    const message = this.pendingMessages.get(messageId);
    if (!message) return;

    // Update local message
    const previousContent = message.content;
    message.content = newContent;
    
    // Add to edit history
    message.metadata = message.metadata || {};
    message.metadata.editHistory = message.metadata.editHistory || [];
    message.metadata.editHistory.push({
      previousContent,
      editedAt: new Date(),
    });

    if (this.isConnected && this.socket) {
      try {
        this.socket.send(JSON.stringify({
          type: 'edit_message',
          payload: {
            messageId,
            newContent,
            timestamp: new Date().toISOString(),
          },
        }));
      } catch (error) {
        console.error('Error editing message:', error);
      }
    }
  }

  public deleteMessage(messageId: string): void {
    if (this.isConnected && this.socket) {
      try {
        this.socket.send(JSON.stringify({
          type: 'delete_message',
          payload: { messageId },
        }));
      } catch (error) {
        console.error('Error deleting message:', error);
      }
    }
  }

  public sendTyping(roomId: string, userName: string): void {
    if (!roomId || !userName) return;

    if (this.isConnected && this.socket) {
      try {
        this.socket.send(JSON.stringify({
          type: 'typing',
          payload: {
            roomId,
            userId: this.userId,
            userName,
            timestamp: new Date().toISOString(),
          },
        }));
      } catch (error) {
        console.error('Error sending typing indicator:', error);
      }
    }
  }

  public markAsRead(roomId: string, messageIds: string | string[]): void {
    if (this.isConnected && this.socket) {
      try {
        this.socket.send(JSON.stringify({
          type: 'mark_read',
          payload: {
            roomId,
            messageIds: Array.isArray(messageIds) ? messageIds : [messageIds],
            timestamp: new Date().toISOString(),
          },
        }));
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    }
  }

  public joinRoom(roomId: string): void {
    if (!roomId) return;

    if (this.isConnected && this.socket) {
      try {
        this.socket.send(JSON.stringify({
          type: 'join_room',
          payload: { roomId },
        }));
        this.activeRooms.add(roomId);
      } catch (error) {
        console.error('Error joining room:', error);
      }
    } else {
      // Queue the join request
      this.messageQueue.push({
        type: 'join_room',
        data: { roomId },
      });
      
      // Start reconnection if needed
      if (this.reconnectAttempts === 0) {
        this.attemptReconnect();
      }
    }
  }

  public leaveRoom(roomId: string): void {
    if (!roomId) return;

    if (this.isConnected && this.socket) {
      try {
        this.socket.send(JSON.stringify({
          type: 'leave_room',
          payload: { roomId },
        }));
        this.activeRooms.delete(roomId);
      } catch (error) {
        console.error('Error leaving room:', error);
      }
    } else {
      // Remove from queue if not yet processed
      const index = this.messageQueue.findIndex(
        item => item.type === 'join_room' && item.data.roomId === roomId
      );
      
      if (index !== -1) {
        this.messageQueue.splice(index, 1);
      }
    }
  }

  // Event subscription methods
  public onMessage(handler: MessageHandler): () => void {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  public onTyping(handler: TypingHandler): () => void {
    this.typingHandlers.add(handler);
    return () => this.typingHandlers.delete(handler);
  }

  public onConnect(handler: () => void): () => void {
    const wrappedHandler: ConnectionHandler = () => handler();
    this.connectionHandlers.add(wrappedHandler);
    return () => this.connectionHandlers.delete(wrappedHandler);
  }

  public onMessageStatus(handler: MessageStatusHandler): () => void {
    this.messageStatusHandlers.add(handler);
    return () => this.messageStatusHandlers.delete(handler);
  }

  public onRoomUpdate(handler: RoomUpdateHandler): () => void {
    this.roomUpdateHandlers.add(handler);
    return () => this.roomUpdateHandlers.delete(handler);
  }

  // Getters
  public get connectionStatus(): boolean {
    return this.isConnected;
  }

  public get pendingMessageCount(): number {
    return this.pendingMessages.size;
  }

  public get activeRoomIds(): string[] {
    return Array.from(this.activeRooms);
  }

  public get isAuthenticated(): boolean {
    return !!this.token && !!this.userId && !!this.businessId;
  }

  // Clean up on destroy
  public destroy(): void {
    this.disconnect();
    
    // Remove event listeners
    if (typeof window !== 'undefined') {
      document.removeEventListener('visibilitychange', this.handleVisibilityChange);
      window.removeEventListener('online', this.handleOnline);
    }
    
    // Clear all handlers
    this.messageHandlers.clear();
    this.typingHandlers.clear();
    this.connectionHandlers.clear();
    this.messageStatusHandlers.clear();
    this.roomUpdateHandlers.clear();
    
    // Clear data
    this.pendingMessages.clear();
    this.activeRooms.clear();
    this.messageQueue = [];
  }

  private setupHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.heartbeatInterval = window.setInterval(() => {
      if (this.isConnected && this.socket) {
        const now = Date.now();
        // If we haven't received a heartbeat in 2x the interval, assume disconnected
        if (now - this.lastHeartbeat > this.HEARTBEAT_INTERVAL * 2) {
          console.warn('No heartbeat received, reconnecting...');
          this.handleDisconnection();
          return;
        }
        
        // Send ping
        this.sendPing();
      }
    }, this.HEARTBEAT_INTERVAL);
  }

  private sendPing(): void {
    if (this.isConnected && this.socket) {
      try {
        this.socket.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
      } catch (error) {
        console.error('Error sending ping:', error);
        this.handleDisconnection();
      }
    }
  }

  private handlePong(timestamp: number): void {
    const latency = Date.now() - timestamp;
    console.debug(`Ping: ${latency}ms`);
    this.lastHeartbeat = Date.now();
  }

  private handleDisconnection(): void {
    this.isConnected = false;
    this.cleanup();
    this.notifyConnectionChange();
    this.attemptReconnect();
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      this.notifyConnectionError(new Error('Unable to connect to chat server'));
      return;
    }

    this.clearReconnectTimeout();
    
    // Exponential backoff with jitter
    const baseDelay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    const jitter = Math.random() * 1000;
    const delay = baseDelay + jitter;
    
    console.log(`Attempting to reconnect in ${Math.round(delay / 1000)}s...`);
    
    this.reconnectTimeout = window.setTimeout(() => {
      if (this.userId && this.businessId) {
        this.connect(this.userId, this.businessId, this.token || undefined)
          .catch(error => {
            console.error('Reconnection failed:', error);
            this.reconnectAttempts++;
            this.attemptReconnect();
          });
      }
    }, delay);
  }

  private cleanup(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    
    this.clearReconnectTimeout();
  }

  private clearReconnectTimeout(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }

  public disconnect(): void {
    this.cleanup();
    
    if (this.socket) {
      this.socket.onclose = null; // Prevent reconnect on manual disconnect
      this.socket.close();
      this.socket = null;
    }
    
    this.isConnected = false;
    this.connectionPromise = null;
    this.notifyConnectionChange(false);
  }
}

export const chatService = new ChatService();
