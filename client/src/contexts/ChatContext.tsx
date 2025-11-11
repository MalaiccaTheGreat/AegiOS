import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useBusiness } from './BusinessContext';
import { chatService, Message } from '../services/chatService';

type ChatContextType = {
  messages: Message[];
  sendMessage: (content: string, attachments?: any[]) => Promise<string>;
  isConnected: boolean;
  currentRoom: string | null;
  joinRoom: (roomId: string) => void;
  leaveRoom: (roomId: string) => void;
  sendTyping: () => void;
  isTyping: { [userId: string]: boolean };
  rooms: Array<{
    id: string;
    name: string;
    lastMessage?: {
      content: string;
      timestamp: Date;
      sender: {
        id: string;
        name: string;
      };
    };
    unreadCount: number;
    participants: Array<{
      id: string;
      name: string;
      avatar?: string;
    }>;
  }>;
  createRoom: (participantIds: string[], name?: string) => Promise<string>;
  uploadFile: (file: File) => Promise<{
    url: string;
    name: string;
    type: string;
    size: number;
  }>;
};

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { currentBusiness } = useBusiness();
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentRoom, setCurrentRoom] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState<{ [userId: string]: boolean }>({});
  const [rooms, setRooms] = useState<ChatContextType['rooms']>([]);

  // Connect to chat service when user is authenticated
  useEffect(() => {
    if (!user || !currentBusiness) return;

    // Connect to chat service
    chatService.connect(user.id, currentBusiness.id);

    // Set up event listeners
    const unsubscribeMessage = chatService.onMessage((message) => {
      setMessages(prev => [...prev, message]);
      
      // Update last message in rooms
      setRooms(prev => 
        prev.map(room => 
          room.id === message.roomId 
            ? { 
                ...room, 
                lastMessage: {
                  content: message.content,
                  timestamp: message.timestamp,
                  sender: {
                    id: message.senderId,
                    name: 'You' // This will be updated with actual sender name
                  }
                },
                unreadCount: room.id === currentRoom ? 0 : (room.unreadCount || 0) + 1
              } 
            : room
        )
      );
    });

    const unsubscribeTyping = chatService.onTyping((userId, userName) => {
      setIsTyping(prev => ({
        ...prev,
        [userId]: true
      }));

      // Clear typing indicator after 3 seconds
      setTimeout(() => {
        setIsTyping(prev => ({
          ...prev,
          [userId]: false
        }));
      }, 3000);
    });

    const unsubscribeConnect = chatService.onConnect(() => {
      setIsConnected(true);
      // Fetch rooms when connected
      fetchRooms();
    });

    // Clean up on unmount
    return () => {
      unsubscribeMessage();
      unsubscribeTyping();
      unsubscribeConnect();
      chatService.disconnect();
    };
  }, [user?.id, currentBusiness?.id, currentRoom]);

  // Fetch chat rooms
  const fetchRooms = useCallback(async () => {
    if (!user || !currentBusiness) return;

    try {
      const response = await fetch(`/api/chat/rooms?businessId=${currentBusiness.id}&userId=${user.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setRooms(data);
      }
    } catch (error) {
      console.error('Failed to fetch chat rooms:', error);
    }
  }, [user?.id, currentBusiness?.id]);

  // Send a message
  const sendMessage = useCallback(async (content: string, attachments: any[] = []) => {
    if (!currentRoom) throw new Error('No active room');
    
    const messageId = chatService.sendMessage(currentRoom, content, attachments);
    return messageId;
  }, [currentRoom]);

  // Send typing indicator
  const sendTyping = useCallback(() => {
    if (!currentRoom || !user) return;
    chatService.sendTyping(currentRoom, user.name || 'User');
  }, [currentRoom, user?.name]);

  // Join a room
  const joinRoom = useCallback((roomId: string) => {
    setCurrentRoom(roomId);
    chatService.joinRoom(roomId);
    
    // Mark messages as read
    setRooms(prev => 
      prev.map(room => 
        room.id === roomId 
          ? { ...room, unreadCount: 0 } 
          : room
      )
    );
    
    // Fetch messages for the room
    fetch(`/api/chat/rooms/${roomId}/messages`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
      .then(res => res.json())
      .then(data => setMessages(data))
      .catch(console.error);
  }, []);

  // Leave a room
  const leaveRoom = useCallback((roomId: string) => {
    if (currentRoom === roomId) {
      setCurrentRoom(null);
      setMessages([]);
    }
    chatService.leaveRoom(roomId);
  }, [currentRoom]);

  // Create a new chat room
  const createRoom = useCallback(async (participantIds: string[], name?: string) => {
    if (!currentBusiness?.id) throw new Error('No business selected');

    const response = await fetch('/api/chat/rooms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        businessId: currentBusiness.id,
        participantIds,
        name
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create room');
    }

    const { roomId } = await response.json();
    await fetchRooms(); // Refresh rooms list
    return roomId;
  }, [currentBusiness?.id, fetchRooms]);

  // Upload a file
  const uploadFile = useCallback(async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: formData
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to upload file');
    }

    return response.json();
  }, []);

  return (
    <ChatContext.Provider
      value={{
        messages,
        sendMessage,
        isConnected,
        currentRoom,
        joinRoom,
        leaveRoom,
        sendTyping,
        isTyping,
        rooms,
        createRoom,
        uploadFile
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = (): ChatContextType => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
