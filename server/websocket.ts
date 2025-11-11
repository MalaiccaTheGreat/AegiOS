import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { verify } from 'jsonwebtoken';
import { JWT_SECRET } from './config';
import { db } from './db';
import { chatMessages } from './models/chatMessage';

export interface Client extends WebSocket {
  isAlive: boolean;
  userId: string;
  businessId: string;
  roomIds: Set<string>;
}

type Message = {
  type: 'message' | 'typing' | 'message_updated' | 'message_deleted' | 'user_joined' | 'user_left';
  payload: any;
};

// Store active connections
const clients = new Set<Client>();
// Map of room IDs to connected client IDs
const roomClients = new Map<string, Set<string>>();
// Map of user IDs to their active connections
const userConnections = new Map<string, Set<Client>>();

function broadcastToRoom(roomId: string, message: Message, excludeClient?: Client) {
  const clientsInRoom = roomClients.get(roomId);
  if (!clientsInRoom) return;

  const messageStr = JSON.stringify(message);
  
  clientsInRoom.forEach(clientId => {
    const userConnectionsSet = userConnections.get(clientId);
    if (!userConnectionsSet) return;

    userConnectionsSet.forEach(client => {
      if (client !== excludeClient && client.readyState === WebSocket.OPEN) {
        client.send(messageStr);
      }
    });
  });
}

function joinRoom(client: Client, roomId: string) {
  if (!client.roomIds) {
    client.roomIds = new Set();
  }
  
  client.roomIds.add(roomId);
  
  let roomClientsSet = roomClients.get(roomId);
  if (!roomClientsSet) {
    roomClientsSet = new Set();
    roomClients.set(roomId, roomClientsSet);
  }
  
  roomClientsSet.add(client.userId);
  
  // Notify others in the room
  broadcastToRoom(roomId, {
    type: 'user_joined',
    payload: { userId: client.userId, roomId }
  }, client);
}

function leaveRoom(client: Client, roomId: string) {
  if (!client.roomIds) return;
  
  client.roomIds.delete(roomId);
  
  const roomClientsSet = roomClients.get(roomId);
  if (roomClientsSet) {
    roomClientsSet.delete(client.userId);
    
    if (roomClientsSet.size === 0) {
      roomClients.delete(roomId);
    }
  }
  
  // Notify others in the room
  broadcastToRoom(roomId, {
    type: 'user_left',
    payload: { userId: client.userId, roomId }
  }, client);
}

export function setupWebSocket(server: any) {
  const wss = new WebSocketServer({ server });
  
  // Heartbeat to detect disconnected clients
  const interval = setInterval(() => {
    wss.clients.forEach((ws: WebSocket) => {
      const client = ws as Client;
      
      if (client.isAlive === false) {
        return client.terminate();
      }
      
      client.isAlive = false;
      client.ping();
    });
  }, 30000);
  
  wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
    const client = ws as Client;
    client.isAlive = true;
    
    // Extract JWT token from query params
    const token = new URL(`http://dummy${req.url}`).searchParams.get('token');
    
    if (!token) {
      client.close(1008, 'Authentication required');
      return;
    }
    
    try {
      // Verify JWT token
      const decoded = verify(token, JWT_SECRET) as { userId: string; businessId: string };
      client.userId = decoded.userId;
      client.businessId = decoded.businessId;
      client.roomIds = new Set();
      
      // Add to clients set
      clients.add(client);
      
      // Add to user connections
      if (!userConnections.has(client.userId)) {
        userConnections.set(client.userId, new Set());
      }
      userConnections.get(client.userId)?.add(client);
      
      // Handle messages
      client.on('message', async (data: string) => {
        try {
          const message = JSON.parse(data.toString());
          
          switch (message.type) {
            case 'join':
              if (message.roomId) {
                joinRoom(client, message.roomId);
              }
              break;
              
            case 'leave':
              if (message.roomId) {
                leaveRoom(client, message.roomId);
              }
              break;
              
            case 'message':
              if (message.roomId && message.content) {
                // Save message to database
                const [savedMessage] = await db.insert(chatMessages).values({
                  roomId: message.roomId,
                  senderId: client.userId,
                  content: message.content,
                  businessId: client.businessId
                }).returning();
                
                // Broadcast to room
                broadcastToRoom(message.roomId, {
                  type: 'message',
                  payload: savedMessage
                }, client);
              }
              break;
              
            default:
              console.warn('Unknown message type:', message.type);
          }
        } catch (error) {
          console.error('Error processing message:', error);
        }
      });
      
      // Handle pong for heartbeat
      client.on('pong', () => {
        client.isAlive = true;
      });
      
      // Handle client disconnection
      client.on('close', () => {
        // Remove from clients set
        clients.delete(client);
        
        // Remove from user connections
        const userConnectionsSet = userConnections.get(client.userId);
        if (userConnectionsSet) {
          userConnectionsSet.delete(client);
          if (userConnectionsSet.size === 0) {
            userConnections.delete(client.userId);
          }
        }
        
        // Leave all rooms
        if (client.roomIds) {
          client.roomIds.forEach(roomId => leaveRoom(client, roomId));
        }
      });
      
    } catch (error) {
      console.error('WebSocket authentication error:', error);
      client.close(1008, 'Invalid token');
    }
  });
  
  // Clean up on server close
  wss.on('close', () => {
    clearInterval(interval);
  });
  
  // Extend WebSocketServer type with our custom methods
  interface ExtendedWebSocketServer extends WebSocketServer {
    broadcast: (businessId: string, event: string, data: any) => void;
    sendToUser: (userId: string, message: any) => boolean;
  }
  
  // Add broadcast helper function
  (wss as unknown as ExtendedWebSocketServer).broadcast = function(businessId: string, event: string, data: any) {
    const message = JSON.stringify({ event, data });
    this.clients.forEach(client => {
      const wsClient = client as unknown as Client;
      if (wsClient.businessId === businessId && wsClient.readyState === WebSocket.OPEN) {
        wsClient.send(message);
      }
    });
  };
  
  // Add helper to send a message to a specific user
  (wss as unknown as ExtendedWebSocketServer).sendToUser = function(userId: string, message: any) {
    const userConnectionsSet = userConnections.get(userId);
    if (!userConnectionsSet) return false;
    
    const messageStr = typeof message === 'string' ? message : JSON.stringify(message);
    let sent = false;
    
    userConnectionsSet.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(messageStr);
        sent = true;
      }
    });
    
    return sent;
  };
  
  return wss as unknown as ExtendedWebSocketServer;
}
