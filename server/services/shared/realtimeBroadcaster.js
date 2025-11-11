const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');

class RealtimeBroadcaster {
  constructor(server) {
    this.wss = new WebSocket.Server({ server, path: '/ws' });
    this.clients = new Map(); // userId -> Set of WebSocket connections
    this.subscriptions = new Map(); // channel -> Set of clientIds
    this.setupHandlers();
  }

  setupHandlers() {
    this.wss.on('connection', (ws, req) => {
      const clientId = uuidv4();
      const userId = req.headers['user-id'] || 'anonymous';
      
      // Store the WebSocket connection
      if (!this.clients.has(userId)) {
        this.clients.set(userId, new Set());
      }
      this.clients.get(userId).add({ id: clientId, ws });

      // Handle messages
      ws.on('message', (message) => this.handleMessage(userId, clientId, message));
      
      // Handle disconnection
      ws.on('close', () => this.handleDisconnect(userId, clientId));
      
      // Send welcome message with clientId
      ws.send(JSON.stringify({
        type: 'connection_established',
        clientId,
        timestamp: new Date().toISOString()
      }));
    });
  }

  handleMessage(userId, clientId, message) {
    try {
      const { type, channel, data } = JSON.parse(message);
      
      switch (type) {
        case 'subscribe':
          this.subscribe(clientId, channel);
          break;
          
        case 'unsubscribe':
          this.unsubscribe(clientId, channel);
          break;
          
        case 'publish':
          this.broadcast(channel, data, userId);
          break;
          
        case 'direct_message':
          this.sendDirectMessage(data.recipientId, {
            type: 'direct_message',
            from: userId,
            message: data.message,
            timestamp: new Date().toISOString()
          });
          break;
      }
    } catch (error) {
      console.error('Error handling message:', error);
    }
  }

  subscribe(clientId, channel) {
    if (!this.subscriptions.has(channel)) {
      this.subscriptions.set(channel, new Set());
    }
    this.subscriptions.get(channel).add(clientId);
  }

  unsubscribe(clientId, channel) {
    if (this.subscriptions.has(channel)) {
      this.subscriptions.get(channel).delete(clientId);
    }
  }

  broadcast(channel, data, excludeUserId = null) {
    if (!this.subscriptions.has(channel)) return;
    
    const message = JSON.stringify({
      type: 'broadcast',
      channel,
      data,
      timestamp: new Date().toISOString()
    });

    // Find all clients subscribed to this channel
    for (const [userId, clients] of this.clients.entries()) {
      if (userId === excludeUserId) continue;
      
      for (const client of clients) {
        if (this.subscriptions.get(channel).has(client.id)) {
          if (client.ws.readyState === WebSocket.OPEN) {
            client.ws.send(message);
          }
        }
      }
    }
  }

  sendDirectMessage(userId, message) {
    if (!this.clients.has(userId)) return;
    
    const clients = this.clients.get(userId);
    const messageStr = JSON.stringify(message);
    
    for (const client of clients) {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(messageStr);
      }
    }
  }

  handleDisconnect(userId, clientId) {
    // Remove from clients map
    if (this.clients.has(userId)) {
      const userClients = this.clients.get(userId);
      for (const client of userClients) {
        if (client.id === clientId) {
          userClients.delete(client);
          break;
        }
      }
      
      if (userClients.size === 0) {
        this.clients.delete(userId);
      }
    }
    
    // Remove from all subscriptions
    for (const [_, clientIds] of this.subscriptions.entries()) {
      clientIds.delete(clientId);
    }
  }
}

module.exports = RealtimeBroadcaster;
