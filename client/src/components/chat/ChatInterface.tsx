import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useChat } from '../../../contexts/ChatContext';
import { useAuth } from '../../../contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { FiPaperclip, FiSmile, FiSend, FiImage, FiFile, FiX } from 'react-icons/fi';
import { IoCheckmarkDone } from 'react-icons/io5';
import { motion, AnimatePresence } from 'framer-motion';

// Emoji picker component (simplified, you might want to use a library like emoji-picker-react)
const EmojiPicker = ({ onSelect }: { onSelect: (emoji: string) => void }) => {
  const emojis = ['😀', '😂', '😍', '👍', '❤️', '🙏'];
  
  return (
    <div className="absolute bottom-12 left-0 bg-white rounded-lg shadow-lg border border-gray-200 p-2 z-10">
      <div className="grid grid-cols-6 gap-1">
        {emojis.map((emoji) => (
          <button
            key={emoji}
            onClick={() => onSelect(emoji)}
            className="text-2xl p-1 hover:bg-gray-100 rounded"
            type="button"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
};

// File preview component
const FilePreview = ({ file, onRemove }: { file: File; onRemove: () => void }) => {
  const isImage = file.type.startsWith('image/');
  
  return (
    <div className="relative inline-flex items-center bg-gray-100 rounded-lg p-2 mr-2 mb-2">
      {isImage ? (
        <FiImage className="h-5 w-5 text-blue-500 mr-2" />
      ) : (
        <FiFile className="h-5 w-5 text-gray-500 mr-2" />
      )}
      <span className="text-sm text-gray-700 truncate max-w-xs">{file.name}</span>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="ml-2 text-gray-400 hover:text-gray-600"
      >
        <FiX className="h-4 w-4" />
      </button>
    </div>
  );
};

export const ChatInterface: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const { user } = useAuth();
  const { 
    messages, 
    sendMessage, 
    isConnected, 
    sendTyping, 
    isTyping, 
    uploadFile,
    currentRoom: activeRoom,
    rooms
  } = useChat();
  
  const navigate = useNavigate();
  const [newMessage, setNewMessage] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  // Get current room details
  const currentRoom = rooms.find(room => room.id === roomId);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  // Handle room changes
  useEffect(() => {
    if (roomId && !currentRoom) {
      // Room not found, redirect to chat list
      navigate('/chat');
    }
    
    // Scroll to bottom when room changes
    scrollToBottom();
    
    // Focus input when room changes
    inputRef.current?.focus();
  }, [roomId, currentRoom, navigate]);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const handleSendMessage = async () => {
    if ((!newMessage.trim() && files.length === 0) || !roomId) return;
    
    try {
      let attachments = [];
      
      // Upload files if any
      if (files.length > 0) {
        setIsUploading(true);
        const uploadPromises = files.map(file => uploadFile(file));
        attachments = await Promise.all(uploadPromises);
        setIsUploading(false);
      }
      
      // Send message
      await sendMessage(newMessage, attachments);
      
      // Reset form
      setNewMessage('');
      setFiles([]);
      setShowEmojiPicker(false);
      
    } catch (error) {
      console.error('Failed to send message:', error);
      // Show error to user
    }
  };
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...newFiles]);
      // Reset file input to allow selecting the same file again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Send message on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  // Handle typing indicator
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);
    
    // Send typing indicator
    if (!typingTimeout && roomId) {
      sendTyping();
      
      // Set a timeout to reset typing indicator after 3 seconds
      const timeout = setTimeout(() => {
        setTypingTimeout(null);
      }, 3000);
      
      setTypingTimeout(timeout);
    }
  };
  
  // Format message timestamp
  const formatTimestamp = (timestamp: string) => {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  };
  
  // Check if message is from the current user
  const isOwnMessage = (senderId: string) => {
    return senderId === user?.id;
  };
  
  // Get other participants (for group chats)
  const otherParticipants = currentRoom?.participants.filter(
    p => p.id !== user?.id
  ) || [];
  
  // Get room name or participant names
  const getRoomName = () => {
    if (!currentRoom) return 'Chat';
    if (currentRoom.name) return currentRoom.name;
    return otherParticipants.map(p => p.name).join(', ');
  };

export function ChatInterface() {
  const { user } = useUser();
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [activeRoom, setActiveRoom] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [suggestedResponses, setSuggestedResponses] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const ws = useRef<WebSocket | null>(null);
  const { toast } = useToast();

  // Connect to WebSocket
  useEffect(() => {
    if (!user) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws?token=${user.token}`;
    
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      console.log('WebSocket connected');
      // Join all rooms the user is part of
      rooms.forEach(room => {
        ws.current?.send(JSON.stringify({
          type: 'join_room',
          roomId: room.id,
        }));
      });
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'new_message':
          setMessages(prev => [...prev, {
            ...data.data,
            isOwn: data.data.sender.id === user.id,
          }]);
          break;
          
        case 'user_typing':
          // Handle typing indicator
          break;
          
        case 'message_read':
          // Update read status
          break;
      }
    };

    ws.current.onclose = () => {
      console.log('WebSocket disconnected');
      // Attempt to reconnect
      setTimeout(() => {
        if (ws.current?.readyState === WebSocket.CLOSED) {
          // Reconnect logic here
        }
      }, 3000);
    };

    return () => {
      ws.current?.close();
    };
  }, [user, rooms]);

  // Load initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        // Fetch user's chat rooms
        const roomsResponse = await fetch('/api/chat/rooms');
        const roomsData = await roomsResponse.json();
        setRooms(roomsData);
        
        if (roomsData.length > 0) {
          setActiveRoom(roomsData[0].id);
          // Load messages for the first room
          await loadMessages(roomsData[0].id);
        }
      } catch (error) {
        console.error('Error loading chat data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load chat data',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const loadMessages = async (roomId: string) => {
    try {
      const response = await fetch(`/api/chat/${roomId}/messages`);
      const data = await response.json();
      setMessages(data.map((msg: any) => ({
        ...msg,
        isOwn: msg.sender.id === user?.id,
      })));
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !activeRoom || !user) return;

    const newMessage = {
      id: Date.now(), // Temporary ID, will be replaced by server
      content: message,
      sender: {
        id: user.id,
        name: user.name,
        avatarUrl: user.avatarUrl,
      },
      attachments: [],
      metadata: {},
      createdAt: new Date().toISOString(),
      isOwn: true,
    };

    // Optimistic update
    setMessages(prev => [...prev, newMessage]);
    setMessage('');
    setSuggestedResponses([]);

    try {
      // Send message to server
      const response = await fetch(`/api/chat/${activeRoom}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: message,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      // The server will broadcast the message via WebSocket
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive',
      });
      
      // Remove the optimistic update on error
      setMessages(prev => prev.filter(m => m.id !== newMessage.id));
    }
  };

  const handleTyping = useCallback(
    debounce(() => {
      if (!activeRoom || !ws.current) return;
      
      ws.current.send(
        JSON.stringify({
          type: 'typing',
          roomId: activeRoom,
        })
      );
    }, 500),
    [activeRoom]
  );

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeRoom) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`/api/chat/${activeRoom}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('File upload failed');
      }

      const { url } = await response.json();
      
      // Add file to message input
      setMessage(prev => `${prev} ${url}`.trim());
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload file',
        variant: 'destructive',
      });
    }
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Update suggested responses when AI analysis is available
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.metadata?.aiAnalysis?.suggestedResponses) {
      setSuggestedResponses(lastMessage.metadata.aiAnalysis.suggestedResponses || []);
    }
  }, [messages]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-200px)] border rounded-lg overflow-hidden">
      {/* Sidebar with chat list */}
      <div className="w-80 border-r bg-gray-50 dark:bg-gray-900">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Messages</h2>
        </div>
        <div className="overflow-y-auto h-[calc(100%-60px)]">
          {rooms.map((room) => (
            <div
              key={room.id}
              className={`p-4 border-b cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 ${
                activeRoom === room.id ? 'bg-blue-50 dark:bg-blue-900/30' : ''
              }`}
              onClick={() => {
                setActiveRoom(room.id);
                loadMessages(room.id);
              }}
            >
              <div className="flex items-center justify-between">
                <div className="font-medium">{room.name}</div>
                {room.unreadCount > 0 && (
                  <span className="bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {room.unreadCount}
                  </span>
                )}
              </div>
              <div className="text-sm text-gray-500 truncate">
                {room.lastMessage}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                {room.lastMessageAt && formatDistanceToNow(new Date(room.lastMessageAt), { addSuffix: true })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        {activeRoom ? (
          <>
            {/* Chat header */}
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Avatar>
                  <AvatarImage src={rooms.find(r => r.id === activeRoom)?.participants[0]?.avatarUrl} />
                  <AvatarFallback>
                    {rooms.find(r => r.id === activeRoom)?.name
                      .split(' ')
                      .map(n => n[0])
                      .join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">
                    {rooms.find(r => r.id === activeRoom)?.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {isTyping ? 'typing...' : 'Online'}
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4 overflow-y-auto">
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}
                  >
                    {!msg.isOwn && (
                      <Avatar className="h-8 w-8 mr-2 self-end">
                        <AvatarImage src={msg.sender.avatarUrl} />
                        <AvatarFallback>{msg.sender.name[0]}</AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={`max-w-xs md:max-w-md lg:max-w-lg xl:max-w-xl rounded-lg px-4 py-2 ${
                        msg.isOwn
                          ? 'bg-primary text-primary-foreground rounded-tr-none'
                          : 'bg-muted rounded-tl-none'
                      }`}
                    >
                      {!msg.isOwn && (
                        <div className="font-medium text-xs text-muted-foreground">
                          {msg.sender.name}
                        </div>
                      )}
                      <div className="whitespace-pre-wrap break-words">
                        {msg.content}
                      </div>
                      {msg.attachments?.map((file, i) => (
                        <div key={i} className="mt-2">
                          <a
                            href={file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-500 hover:underline flex items-center"
                          >
                            <FileText className="h-4 w-4 mr-1" />
                            {file.name}
                          </a>
                        </div>
                      ))}
                      <div className="text-xs mt-1 opacity-70 flex items-center justify-end space-x-1">
                        {formatDistanceToNow(new Date(msg.createdAt), {
                          addSuffix: true,
                        })}
                        {msg.isOwn && (
                          <span className="ml-1">
                            {msg.metadata?.readBy?.length > 1 ? (
                              <CheckCheck className="h-3 w-3 text-blue-500" />
                            ) : (
                              <Check className="h-3 w-3" />
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Suggested responses */}
            {suggestedResponses.length > 0 && (
              <div className="px-4 pb-2 flex flex-wrap gap-2">
                {suggestedResponses.map((response, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    size="sm"
                    className="text-xs h-auto py-1 px-2 whitespace-normal text-left"
                    onClick={() => setMessage(response)}
                  >
                    {response}
                  </Button>
                ))}
              </div>
            )}

            {/* Message input */}
            <div className="p-4 border-t">
              <form onSubmit={handleSendMessage} className="flex space-x-2">
                <div className="relative flex-1">
                  <Input
                    value={message}
                    onChange={(e) => {
                      setMessage(e.target.value);
                      handleTyping();
                    }}
                    placeholder="Type a message..."
                    className="pr-10"
                  />
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex space-x-1">
                    <label className="cursor-pointer">
                      <Paperclip className="h-5 w-5 text-muted-foreground" />
                      <input
                        type="file"
                        className="hidden"
                        onChange={handleFileUpload}
                      />
                    </label>
                    <Button type="button" variant="ghost" size="icon">
                      <Smile className="h-5 w-5 text-muted-foreground" />
                    </Button>
                  </div>
                </div>
                <Button type="submit" disabled={!message.trim()}>
                  <Send className="h-4 w-4 mr-2" /> Send
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            Select a chat to start messaging
          </div>
        )}
    </div>
    
    {/* Message input */}
    <div className="border-t border-gray-200 p-4 bg-white">
      {/* File previews */}
      {files.length > 0 && (
        <div className="flex flex-wrap mb-3">
          {files.map((file, index) => (
            <FilePreview
              key={index}
              file={file}
              onRemove={() => removeFile(index)}
            />
          ))}
        </div>
      )}
      
      <div className="relative flex items-end">
        <div className="flex-shrink-0 flex space-x-2 mr-2">
          <button
            type="button"
            className="text-gray-400 hover:text-gray-500"
            onClick={() => fileInputRef.current?.click()}
          >
            <FiPaperclip className="h-5 w-5" />
            <span className="sr-only">Attach file</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
            multiple
          />
          
          <button
            type="button"
            className="text-gray-400 hover:text-gray-500"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          >
            <FiSmile className="h-5 w-5" />
            <span className="sr-only">Add emoji</span>
          </button>
          
          {showEmojiPicker && (
            <div className="absolute bottom-10 left-0 z-10">
              <EmojiPicker
                onSelect={(emoji) => {
                  setNewMessage(prev => prev + emoji);
                  setShowEmojiPicker(false);
                }}
              />
            </div>
          )}
        </div>
        
        <div className="flex-1 relative">
          <textarea
            ref={inputRef}
            rows={1}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm resize-none max-h-32 py-2 pr-10"
            placeholder="Type a message..."
            value={newMessage}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              // Auto-expand textarea
              const textarea = inputRef.current;
              if (textarea) {
                textarea.style.height = 'auto';
                textarea.style.height = `${Math.min(textarea.scrollHeight, 128)}px`;
              }
            }}
          />
          
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            <button
              type="button"
              onClick={handleSendMessage}
              disabled={!newMessage.trim() && files.length === 0}
              className={`inline-flex items-center justify-center rounded-full p-1.5 ${
                newMessage.trim() || files.length > 0
                  ? 'text-blue-600 hover:bg-blue-50'
                  : 'text-gray-400 cursor-not-allowed'
              }`}
            >
              {isUploading ? (
                <svg className="h-5 w-5 animate-spin text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <FiSend className="h-5 w-5" />
              )}
              <span className="sr-only">Send message</span>
            </button>
          </div>
        </div>
      </div>
      
      {!isConnected && (
        <div className="mt-2 text-center">
          <div className="inline-flex items-center text-xs text-yellow-700 bg-yellow-50 px-2 py-1 rounded">
            <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>Connecting to chat...</span>
          </div>
        </div>
      )}
    </div>
  </div>
);

// Utility function for debouncing
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return function (this: any, ...args: Parameters<T>) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}
