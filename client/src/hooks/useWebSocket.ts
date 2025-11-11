import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';

type MessageHandler = (data: any) => void;

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const messageHandlers = useRef<Map<string, Set<MessageHandler>>>(new Map());
  const { user } = useAuth();
  const { toast } = useToast();
  const reconnectAttempts = useRef(0);
  const reconnectTimeout = useRef<NodeJS.Timeout>();

  const connect = useCallback(() => {
    if (socket) {
      socket.close();
    }

    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//${window.location.host}/ws`;
    const newSocket = new WebSocket(wsUrl);

    newSocket.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      reconnectAttempts.current = 0;
      
      // Re-subscribe to channels on reconnect
      messageHandlers.current.forEach((_, channel) => {
        subscribe(channel);
      });
    };

    newSocket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        
        // Handle connection established
        if (message.type === 'connection_established') {
          console.log('WebSocket connection established');
          return;
        }
        
        // Handle notifications
        if (message.type === 'notification') {
          toast({
            title: message.data.title,
            description: message.data.message,
          });
        }
        
        // Call registered handlers
        const handlers = messageHandlers.current.get(message.channel || message.type) || [];
        handlers.forEach(handler => handler(message.data || message));
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    };

    newSocket.onclose = () => {
      setIsConnected(false);
      
      // Implement exponential backoff for reconnection
      const maxReconnectAttempts = 5;
      const baseDelay = 1000; // 1 second
      
      if (reconnectAttempts.current < maxReconnectAttempts) {
        const delay = Math.min(baseDelay * Math.pow(2, reconnectAttempts.current), 30000);
        reconnectAttempts.current++;
        
        reconnectTimeout.current = setTimeout(() => {
          console.log(`Attempting to reconnect (${reconnectAttempts.current}/${maxReconnectAttempts})`);
          connect();
        }, delay);
      } else {
        console.error('Max reconnection attempts reached');
      }
    };

    newSocket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    setSocket(newSocket);

    return () => {
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
      newSocket.close();
    };
  }, [socket, toast]);

  useEffect(() => {
    if (user) {
      connect();
      
      return () => {
        if (socket) {
          socket.close();
        }
        if (reconnectTimeout.current) {
          clearTimeout(reconnectTimeout.current);
        }
      };
    }
  }, [user]);

  const subscribe = useCallback((channel: string, handler?: MessageHandler) => {
    if (!socket) return;
    
    // Add handler if provided
    if (handler) {
      if (!messageHandlers.current.has(channel)) {
        messageHandlers.current.set(channel, new Set());
      }
      messageHandlers.current.get(channel)?.add(handler);
    }
    
    // Send subscription message
    socket.send(JSON.stringify({
      type: 'subscribe',
      channel,
    }));
    
    // Return unsubscribe function
    return () => {
      if (handler) {
        messageHandlers.current.get(channel)?.delete(handler);
      }
      
      // If no more handlers for this channel, unsubscribe
      if (!messageHandlers.current.get(channel)?.size) {
        socket.send(JSON.stringify({
          type: 'unsubscribe',
          channel,
        }));
      }
    };
  }, [socket]);

  const publish = useCallback((channel: string, data: any) => {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket is not connected');
      return false;
    }
    
    socket.send(JSON.stringify({
      type: 'publish',
      channel,
      data,
    }));
    
    return true;
  }, [socket]);

  const sendDirectMessage = useCallback((recipientId: string, message: string) => {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket is not connected');
      return false;
    }
    
    socket.send(JSON.stringify({
      type: 'direct_message',
      data: {
        recipientId,
        message,
      },
    }));
    
    return true;
  }, [socket]);

  return {
    isConnected,
    subscribe,
    publish,
    sendDirectMessage,
  };
}
