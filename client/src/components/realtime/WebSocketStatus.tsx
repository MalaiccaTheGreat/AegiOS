import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { useResponsive } from '@/contexts/BusinessContext';
import { cn } from '@/lib/utils';

export function WebSocketStatus() {
  const { isConnected, connectionState } = useWebSocket();
  const { isMobile } = useResponsive();
  const [showStatus, setShowStatus] = useState(false);
  const [lastConnectedAt, setLastConnectedAt] = useState<Date | null>(null);
  const [lastDisconnectedAt, setLastDisconnectedAt] = useState<Date | null>(null);
  const [connectionStats, setConnectionStats] = useState({
    uptime: 0,
    downtime: 0,
    reconnects: 0,
  });
  
  // Use connectionState from context if available
  const { lastMessageAt, ping } = connectionState || {};

  // Track connection status changes
  useEffect(() => {
    const now = new Date();
    
    if (isConnected) {
      setLastConnectedAt(now);
      setShowStatus(false);
      
      // Show connection status briefly on reconnect
      if (lastDisconnectedAt) {
        setShowStatus(true);
        const timer = setTimeout(() => setShowStatus(false), 3000);
        return () => clearTimeout(timer);
      }
    } else {
      setLastDisconnectedAt(now);
      setShowStatus(true);
      
      // Show reconnecting status
      setConnectionStats(prev => ({
        ...prev,
        reconnects: prev.reconnects + 1,
      }));
    }
  }, [isConnected]);

  // Update connection stats
  useEffect(() => {
    const interval = setInterval(() => {
      if (isConnected && lastConnectedAt) {
        const uptime = Math.floor((Date.now() - lastConnectedAt.getTime()) / 1000);
        setConnectionStats(prev => ({
          ...prev,
          uptime,
        }));
      } else if (!isConnected && lastDisconnectedAt) {
        const downtime = Math.floor((Date.now() - lastDisconnectedAt.getTime()) / 1000);
        setConnectionStats(prev => ({
          ...prev,
          downtime,
        }));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isConnected, lastConnectedAt, lastDisconnectedAt]);

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  };

  if (!showStatus && isConnected) return null;

  return (
    <AnimatePresence>
      <motion.div
        className={cn(
          'fixed z-50 right-4 flex items-center gap-2 px-3 py-2 rounded-lg shadow-lg',
          isConnected 
            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
          isMobile ? 'bottom-16' : 'bottom-4',
          'backdrop-blur-sm border border-opacity-20',
          isConnected ? 'border-green-200' : 'border-yellow-200'
        )}
        initial={{ opacity: 0, y: 20, x: 0 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className={cn(
          'w-2 h-2 rounded-full animate-pulse',
          isConnected ? 'bg-green-500' : 'bg-yellow-500'
        )} />
        
        <div className="flex flex-col
         min-w-0">
          <div className="text-sm font-medium truncate">
            {isConnected ? 'Connected to AegisOS' : 'Reconnecting...'}
          </div>
          
          {!isMobile && (
            <div className="text-xs opacity-70 flex items-center gap-2">
              {isConnected ? (
                <>
                  <span>Uptime: {formatTime(connectionStats.uptime)}</span>
                  <span>•</span>
                  <span>Reconnects: {connectionStats.reconnects}</span>
                </>
              ) : (
                <span>Disconnected for {formatTime(connectionStats.downtime)}</span>
              )}
            </div>
          )}
        </div>
        
        {isConnected && (
          <button 
            onClick={() => setShowStatus(false)}
            className="ml-2 opacity-50 hover:opacity-100 transition-opacity"
            aria-label="Dismiss"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

// Extend the WebSocket context to expose connection state
declare module '@/contexts/WebSocketContext' {
  interface WebSocketContextType {
    connectionState?: {
      lastMessageAt?: Date;
      ping?: number;
      url?: string;
    };
  }
}
