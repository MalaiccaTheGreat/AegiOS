import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { useBusiness } from '@/contexts/BusinessContext';
import { cn } from '@/lib/utils';

type User = {
  id: string;
  name: string;
  color: string;
  cursor?: { x: number; y: number };
  selection?: { start: number; end: number };
  lastActive: Date;
};

type CursorPosition = {
  x: number;
  y: number;
  height: number;
};

interface CollaborativeEditingProps {
  documentId: string;
  initialContent?: string;
  readOnly?: boolean;
  className?: string;
}

export function CollaborativeEditing({
  documentId,
  initialContent = '',
  readOnly = false,
  className,
}: CollaborativeEditingProps) {
  const { currentBusiness } = useBusiness();
  const { subscribe, sendMessage, isConnected } = useWebSocket();
  const [content, setContent] = useState(initialContent);
  const [users, setUsers] = useState<Record<string, User>>({});
  const [localSelection, setLocalSelection] = useState<{ start: number; end: number } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const userId = useRef(`user-${Math.random().toString(36).substr(2, 9)}`);
  const userColor = useRef(`hsl(${Math.floor(Math.random() * 360)}, 70%, 60%)`);
  const userName = useRef(`User ${Math.floor(Math.random() * 1000)}`);
  const cursorPositions = useRef<Record<string, CursorPosition>>({});
  const updateTimeout = useRef<NodeJS.Timeout>();
  const isTypingRef = useRef(false);

  // Subscribe to document updates
  useEffect(() => {
    if (!currentBusiness?.id) return;

    // Join the document
    sendMessage('document:join', {
      documentId,
      businessId: currentBusiness.id,
      userId: userId.current,
      userName: userName.current,
      userColor: userColor.current,
    });

    // Subscribe to document updates
    const unsubscribeDocument = subscribe(`document:${documentId}:update`, (data: { content: string }) => {
      if (data.content !== content) {
        setContent(data.content);
      }
    });

    // Subscribe to user presence updates
    const unsubscribePresence = subscribe(`document:${documentId}:presence`, (data: { users: Record<string, User> }) => {
      setUsers(data.users);
    });

    // Clean up on unmount
    return () => {
      sendMessage('document:leave', {
        documentId,
        userId: userId.current,
      });
      unsubscribeDocument();
      unsubscribePresence();
    };
  }, [documentId, currentBusiness?.id]);

  // Handle content changes
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    
    // Debounce the update to the server
    if (updateTimeout.current) {
      clearTimeout(updateTimeout.current);
    }
    
    updateTimeout.current = setTimeout(() => {
      if (currentBusiness?.id) {
        sendMessage('document:update', {
          documentId,
          businessId: currentBusiness.id,
          content: newContent,
          userId: userId.current,
        });
      }
    }, 300);
    
    // Update cursor position
    updateCursorPosition();
  };

  // Update cursor position
  const updateCursorPosition = useCallback(() => {
    if (!textareaRef.current) return;
    
    const selectionStart = textareaRef.current.selectionStart;
    const selectionEnd = textareaRef.current.selectionEnd;
    
    // Only update if selection changed
    if (
      localSelection?.start === selectionStart &&
      localSelection?.end === selectionEnd
    ) {
      return;
    }
    
    setLocalSelection({ start: selectionStart, end: selectionEnd });
    
    // Broadcast cursor position
    if (currentBusiness?.id) {
      sendMessage('document:cursor', {
        documentId,
        businessId: currentBusiness.id,
        userId: userId.current,
        selection: { start: selectionStart, end: selectionEnd },
      });
    }
    
    // Calculate cursor position
    const text = textareaRef.current.value;
    const lines = text.substr(0, selectionStart).split('\n');
    const line = lines.length - 1;
    const column = lines[lines.length - 1].length;
    
    // Calculate pixel position (approximate)
    const lineHeight = 24; // Should match your CSS line-height
    const charWidth = 8; // Approximate character width
    
    cursorPositions.current[userId.current] = {
      x: column * charWidth,
      y: line * lineHeight,
      height: lineHeight,
    };
    
    // Force re-render
    setUsers(prev => ({ ...prev }));
  }, [documentId, currentBusiness?.id, localSelection]);

  // Handle typing indicator
  const handleKeyDown = () => {
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      sendMessage('user:typing', {
        documentId,
        userId: userId.current,
        isTyping: true,
      });
    }
  };

  const handleKeyUp = () => {
    if (isTypingRef.current) {
      isTypingRef.current = false;
      sendMessage('user:typing', {
        documentId,
        userId: userId.current,
        isTyping: false,
      });
    }
  };

  // Get cursor position for a user
  const getUserCursorPosition = (userId: string) => {
    return cursorPositions.current[userId];
  };

  // Render user cursors
  const renderUserCursors = () => {
    return Object.entries(users)
      .filter(([id]) => id !== userId.current) // Don't show own cursor
      .map(([id, user]) => {
        const pos = getUserCursorPosition(id);
        if (!pos) return null;
        
        return (
          <motion.div
            key={`cursor-${id}`}
            className="absolute pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ 
              x: pos.x + 10, 
              y: pos.y,
              opacity: 1 
            }}
            transition={{ type: 'spring', damping: 30, stiffness: 700 }}
          >
            <div 
              className="text-xs px-2 py-0.5 rounded-full text-white whitespace-nowrap"
              style={{ backgroundColor: user.color }}
            >
              {user.name}
            </div>
            <div 
              className="w-0.5 h-6"
              style={{ backgroundColor: user.color }}
            />
          </motion.div>
        );
      });
  };

  return (
    <div className={cn('relative', className)}>
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleChange}
          onSelect={updateCursorPosition}
          onKeyDown={handleKeyDown}
          onKeyUp={handleKeyUp}
          onBlur={() => {
            setLocalSelection(null);
            sendMessage('document:cursor', {
              documentId,
              businessId: currentBusiness?.id,
              userId: userId.current,
              selection: null,
            });
          }}
          className={cn(
            'w-full min-h-[200px] p-4 rounded-lg border border-gray-200 dark:border-gray-700',
            'bg-white dark:bg-gray-800 text-gray-900 dark:text-white',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
            'resize-none',
            readOnly && 'opacity-70 cursor-not-allowed',
            'font-mono text-sm leading-relaxed',
            'whitespace-pre-wrap',
            'overflow-auto',
            'relative z-10',
          )}
          readOnly={readOnly || !isConnected}
          placeholder={!isConnected ? 'Connecting to server...' : 'Start typing...'}
        />
        
        {/* User cursors */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {renderUserCursors()}
        </div>
      </div>
      
      {/* User list */}
      <div className="mt-2 flex flex-wrap gap-2">
        {Object.entries(users).map(([id, user]) => (
          <div 
            key={`user-${id}`}
            className={cn(
              'flex items-center gap-2 px-2 py-1 rounded-full text-xs',
              'bg-opacity-20',
              id === userId.current ? 'bg-blue-500' : 'bg-gray-200 dark:bg-gray-700',
            )}
            style={{ backgroundColor: id === userId.current ? `${userColor.current}33` : undefined }}
          >
            <div 
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: user.color }}
            />
            <span className="font-medium">
              {user.name}
              {id === userId.current && ' (You)'}
            </span>
            {user.lastActive && new Date().getTime() - new Date(user.lastActive).getTime() < 5000 && (
              <span className="text-xs opacity-70">typing...</span>
            )}
          </div>
        ))}
      </div>
      
      {!isConnected && (
        <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center rounded-lg">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500 animate-pulse" />
              <span>Reconnecting to server...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
