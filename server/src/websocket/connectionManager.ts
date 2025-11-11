import { Server, Socket } from 'socket.io';
import { verifyToken } from '../middleware/auth';
import { logger } from '../utils/logger';

type SocketWithUser = Socket & {
  userId?: string;
  businessId?: string;
};

class ConnectionManager {
  private io: Server;
  private connections: Map<string, Set<string>> = new Map(); // businessId -> Set of socketIds
  private userSockets: Map<string, string> = new Map(); // userId -> socketId
  private heartbeatIntervals: Map<string, NodeJS.Timeout> = new Map();

  constructor(io: Server) {
    this.io = io;
    this.setupConnectionHandlers();
  }

  private setupConnectionHandlers() {
    this.io.use(this.authenticateSocket);
    this.io.on('connection', this.handleConnection.bind(this));
  }

  private authenticateSocket(socket: SocketWithUser, next: (err?: Error) => void) {
    const token = socket.handshake.auth.token || 
                 socket.handshake.headers.authorization?.split(' ')[1];
    
    if (!token) {
      logger.warn('WebSocket connection attempt without token');
      return next(new Error('Authentication error: No token provided'));
    }

    try {
      const decoded = verifyToken(token);
      socket.userId = decoded.userId;
      socket.businessId = decoded.businessId;
      next();
    } catch (error) {
      logger.error('WebSocket authentication failed:', error);
      next(new Error('Authentication error: Invalid token'));
    }
  }

  private handleConnection(socket: SocketWithUser) {
    if (!socket.userId || !socket.businessId) {
      logger.warn('WebSocket connection missing user or business ID');
      return socket.disconnect(true);
    }

    const { userId, businessId } = socket;
    
    // Track connection
    if (!this.connections.has(businessId)) {
      this.connections.set(businessId, new Set());
    }
    this.connections.get(businessId)?.add(socket.id);
    this.userSockets.set(userId, socket.id);

    // Setup heartbeat
    this.setupHeartbeat(socket);

    // Handle disconnection
    socket.on('disconnect', () => this.handleDisconnection(socket));

    // Handle custom events
    this.setupEventHandlers(socket);

    logger.info(`Client connected: ${socket.id}, User: ${userId}, Business: ${businessId}`);
  }

  private handleDisconnection(socket: SocketWithUser) {
    if (!socket.userId || !socket.businessId) return;

    const { userId, businessId } = socket;
    
    // Clean up connection tracking
    const businessSockets = this.connections.get(businessId);
    if (businessSockets) {
      businessSockets.delete(socket.id);
      if (businessSockets.size === 0) {
        this.connections.delete(businessId);
      }
    }
    
    if (this.userSockets.get(userId) === socket.id) {
      this.userSockets.delete(userId);
    }

    // Clear heartbeat interval
    const interval = this.heartbeatIntervals.get(socket.id);
    if (interval) {
      clearInterval(interval);
      this.heartbeatIntervals.delete(socket.id);
    }

    logger.info(`Client disconnected: ${socket.id}, User: ${userId}`);
  }

  private setupHeartbeat(socket: SocketWithUser) {
    // Send ping every 25 seconds (Heroku closes idle connections after 30s)
    const interval = setInterval(() => {
      if (socket.connected) {
        socket.emit('ping', { timestamp: Date.now() });
      }
    }, 25000);

    this.heartbeatIntervals.set(socket.id, interval);

    // Handle pong from client
    socket.on('pong', () => {
      // Client is still alive
    });
  }

  private setupEventHandlers(socket: SocketWithUser) {
    // Handle join room events
    socket.on('join:room', (room: string) => {
      socket.join(room);
      logger.debug(`Socket ${socket.id} joined room ${room}`);
    });

    // Handle leave room events
    socket.on('leave:room', (room: string) => {
      socket.leave(room);
      logger.debug(`Socket ${socket.id} left room ${room}`);
    });
  }

  // Broadcast to all sockets in a business
  public broadcastToBusiness(businessId: string, event: string, data: any) {
    const sockets = this.connections.get(businessId);
    if (sockets) {
      sockets.forEach(socketId => {
        this.io.to(socketId).emit(event, data);
      });
    }
  }

  // Send to a specific user
  public sendToUser(userId: string, event: string, data: any) {
    const socketId = this.userSockets.get(userId);
    if (socketId) {
      this.io.to(socketId).emit(event, data);
    }
  }

  // Get all connected business IDs
  public getConnectedBusinesses(): string[] {
    return Array.from(this.connections.keys());
  }

  // Get all connected user IDs
  public getConnectedUsers(): string[] {
    return Array.from(this.userSockets.keys());
  }
}

let connectionManager: ConnectionManager | null = null;

export const setupWebSocket = (io: Server) => {
  if (!connectionManager) {
    connectionManager = new ConnectionManager(io);
  }
  return connectionManager;
};

export const getConnectionManager = (): ConnectionManager => {
  if (!connectionManager) {
    throw new Error('WebSocket connection manager not initialized');
  }
  return connectionManager;
};
