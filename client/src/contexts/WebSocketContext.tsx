import { createContext, useContext, useEffect, useRef, ReactNode, useCallback, useState } from 'react';
import { useBusiness } from './BusinessContext';

type MessageHandler = (data: any) => void;

interface WebSocketContextType {
  subscribe: (event: string, handler: MessageHandler) => () => void;
  sendMessage: (event: string, data?: any) => void;
  isConnected: boolean;
  connectionState?: {
    lastMessageAt?: Date;
    ping?: number;
    url?: string;
  };
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const { currentBusiness } = useBusiness();
  const ws = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectTimeout = useRef<NodeJS.Timeout>();
  const messageHandlers = useRef<Map<string, Set<MessageHandler>>>(new Map());
  const isConnected = useRef(false);
  const [connectionState, setConnectionState] = useState<WebSocketContextType['connectionState']>({
    url: undefined,
    lastMessageAt: undefined,
    ping: undefined
  });

  const connect = useCallback(() => {
    if (ws.current) {
      // If already connected or connecting, don't create a new connection
      if (ws.current.readyState === WebSocket.OPEN || ws.current.readyState === WebSocket.CONNECTING) {
        return;
      }
      // Clean up existing connection if in closing/closed state
      if (ws.current.readyState === WebSocket.CLOSING || ws.current.readyState === WebSocket.CLOSED) {
        ws.current = null;
      }
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // Use the same host as the current page for WebSocket connection
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    // Update connection state before attempting to connect
    setConnectionState(prev => ({
      ...prev,
      url: wsUrl,
      lastMessageAt: undefined,
      ping: undefined
    }));
    
    try {
      console.log(`Attempting to connect to WebSocket at ${wsUrl}...`);
      ws.current = new WebSocket(wsUrl);
      
      // Set a connection timeout
      const connectionTimeout = setTimeout(() => {
        if (ws.current?.readyState !== WebSocket.OPEN) {
          console.error('WebSocket connection timeout');
          ws.current?.close();
          handleReconnect();
        }
      }, 5000); // 5 second timeout
      
      ws.current.onopen = () => {
        console.log('WebSocket connected');
        clearTimeout(connectionTimeout);
        isConnected.current = true;
        reconnectAttempts.current = 0; // Reset reconnect attempts on successful connection
        
        setConnectionState(prev => ({
          ...prev,
          lastMessageAt: new Date(),
          ping: 0
        }));
        
        // Start ping-pong to keep connection alive
        startPingPong();
      };

      ws.current.onopen = () => {
        console.log('WebSocket connected');
        isConnected.current = true;
        reconnectAttempts.current = 0;
        
        // Re-subscribe to all previous handlers on reconnect
        if (currentBusiness?.id) {
          sendMessage('subscribe', { businessId: currentBusiness.id });
        }
      };

      ws.current.onmessage = (event: MessageEvent) => {
        try {
          const { event: eventName, data, timestamp } = JSON.parse(event.data);
          
          // Update last message timestamp
          setConnectionState((prev: WebSocketContextType['connectionState']) => ({
            ...prev,
            lastMessageAt: timestamp ? new Date(timestamp) : new Date()
          }));
          
          const handlers = messageHandlers.current.get(eventName);
          if (handlers) {
            handlers.forEach(handler => handler(data));
          }
        } catch (error) {
          console.error('Error processing WebSocket message:', error);
        }
      };

      ws.current.onclose = () => {
        console.log('WebSocket disconnected');
        isConnected.current = false;
        ws.current = null;
        
        // Attempt to reconnect with exponential backoff
        if (reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
          reconnectTimeout.current = setTimeout(() => {
            reconnectAttempts.current++;
            connect();
          }, delay);
        }
      };

      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        ws.current?.close();
      };
    } catch (error) {
      console.error('WebSocket connection error:', error);
      ws.current = null;
    }
  }, [currentBusiness?.id]);

  const sendMessage = useCallback((event: string, data?: any) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ event, data }));
      return true;
    } else {
      console.warn('WebSocket is not connected');
      return false;
    }
  }, []);

  const subscribe = useCallback((event: string, handler: MessageHandler) => {
    if (!messageHandlers.current.has(event)) {
      messageHandlers.current.set(event, new Set());
    }
    messageHandlers.current.get(event)?.add(handler);

    // Return unsubscribe function
    return () => {
      const handlers = messageHandlers.current.get(event);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          messageHandlers.current.delete(event);
        }
      }
    };
  }, []);

  // Handle reconnection with exponential backoff
  const handleReconnect = useCallback(() => {
    if (reconnectAttempts.current >= maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000); // Max 30s delay
    console.log(`Reconnecting in ${delay}ms...`);
    
    reconnectTimeout.current = setTimeout(() => {
      reconnectAttempts.current++;
      connect();
    }, delay);
  }, [connect]);

  // Handle WebSocket errors and close events
  const handleError = useCallback((error: Event) => {
    console.error('WebSocket error:', error);
    isConnected.current = false;
    handleReconnect();
  }, [handleReconnect]);

  const handleClose = useCallback((event: CloseEvent) => {
    console.log(`WebSocket closed: ${event.code} ${event.reason}`);
    isConnected.current = false;
    
    if (event.code !== 1000) { // Don't reconnect on normal closure
      handleReconnect();
    }
    
    setConnectionState(prev => ({
      ...prev,
      lastMessageAt: new Date(),
      ping: undefined
    }));
  }, [handleReconnect]);

  // Start ping-pong to keep connection alive
  const startPingPong = useCallback(() => {
    if (!ws.current || ws.current.readyState !== WebSocket.OPEN) return;
    
    const pingInterval = setInterval(() => {
      if (ws.current?.readyState === WebSocket.OPEN) {
        const startTime = Date.now();
        try {
          ws.current.send(JSON.stringify({ type: 'ping', timestamp: startTime }));
          
          // Set a timeout to detect if pong isn't received
          const pongTimeout = setTimeout(() => {
            if (ws.current?.readyState === WebSocket.OPEN) {
              console.warn('Pong timeout, reconnecting...');
              ws.current.close();
            }
          }, 5000); // 5 second pong timeout
          
          // Store the timeout to clear it when pong is received
          (ws.current as any).pongTimeout = pongTimeout;
        } catch (error) {
          console.error('Error sending ping:', error);
        }
      } else {
        clearInterval(pingInterval);
      }
    }, 30000); // Send ping every 30 seconds
    
    return () => clearInterval(pingInterval);
  }, []);

  // Set up WebSocket event listeners
  useEffect(() => {
    if (!ws.current) return;
    
    const socket = ws.current;
    
    socket.onerror = handleError;
    socket.onclose = handleClose;
    
    return () => {
      socket.onerror = null;
      socket.onclose = null;
    };
  }, [handleError, handleClose]);

  // Connect on mount and when currentBusiness changes
  useEffect(() => {
    if (currentBusiness) {
      connect();
    } else {
      // If no business is selected and we have a connection, close it
      if (ws.current) {
        ws.current.close();
        ws.current = null;
      }
    }

    return () => {
      if (ws.current) {
        // Clear any pending pong timeouts
        if ((ws.current as any).pongTimeout) {
          clearTimeout((ws.current as any).pongTimeout);
        }
        
        // Only close if we're not already closing/closed
        if (ws.current.readyState === WebSocket.OPEN) {
          ws.current.close(1000, 'Component unmounting');
        }
        ws.current = null;
      }
      
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
    };
  }, [connect, currentBusiness]);
  useEffect(() => {
    if (currentBusiness?.id && isConnected.current) {
      sendMessage('subscribe', { businessId: currentBusiness.id });
    }
  }, [currentBusiness?.id, sendMessage]);

  const value = {
    subscribe,
    sendMessage,
    isConnected: isConnected.current,
    connectionState
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
}
