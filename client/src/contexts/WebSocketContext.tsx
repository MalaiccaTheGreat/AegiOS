import { createContext, useContext, useEffect, useRef, ReactNode, useCallback } from 'react';
import { useBusiness } from './BusinessContext';
import { toast } from 'sonner';

type MessageHandler = (data: any) => void;

interface WebSocketContextType {
  subscribe: (event: string, handler: MessageHandler) => () => void;
  sendMessage: (event: string, data?: any) => void;
  isConnected: boolean;
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

  const connect = useCallback(() => {
    if (ws.current) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    try {
      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        console.log('WebSocket connected');
        isConnected.current = true;
        reconnectAttempts.current = 0;
        
        // Re-subscribe to all previous handlers on reconnect
        if (currentBusiness?.id) {
          sendMessage('subscribe', { businessId: currentBusiness.id });
        }
      };

      ws.current.onmessage = (event) => {
        try {
          const { event: eventName, data } = JSON.parse(event.data);
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

  // Connect on mount and when currentBusiness changes
  useEffect(() => {
    connect();
    
    return () => {
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [connect]);

  // Update subscription when business changes
  useEffect(() => {
    if (currentBusiness?.id && isConnected.current) {
      sendMessage('subscribe', { businessId: currentBusiness.id });
    }
  }, [currentBusiness?.id, sendMessage]);

  const value = {
    subscribe,
    sendMessage,
    isConnected: isConnected.current,
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
