import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Send, X, MessageSquare, Sparkles, Bot, Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useVoiceAssistant } from '@/hooks/useVoiceAssistant';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { motion, AnimatePresence } from 'framer-motion';
import { ButtonLoader } from '@/components/ui/loading';

export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  isProcessing?: boolean;
}

interface VirtualAssistantProps {
  className?: string;
  initialMessages?: Message[];
  onClose?: () => void;
  onError?: (error: Error) => void;
  showHeader?: boolean;
  showCloseButton?: boolean;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  width?: number | string;
  height?: number | string;
  title?: string;
  subtitle?: string;
}

export const VirtualAssistant: React.FC<VirtualAssistantProps> = ({
  className,
  initialMessages = [],
  onClose,
  onError,
  showHeader = true,
  showCloseButton = true,
  position = 'bottom-right',
  width = 400,
  height = 600,
  title = 'Aegis Assistant',
  subtitle = 'How can I help you today?',
}) => {
  const [textInput, setTextInput] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isProcessingText, setIsProcessingText] = useState(false);

  const {
    messages: voiceMessages,
    isListening,
    isProcessing,
    error,
    startListening,
    stopListening,
    processText,
    clearError,
  } = useVoiceAssistant({
    onError: (err) => {
      console.error('Virtual Assistant Error:', err);
      onError?.(err);
    },
  });

  // Combine initial messages with voice messages
  const [messages, setMessages] = useState<Message[]>(() => {
    // Only use initialMessages if there are no voice messages yet
    return voiceMessages.length > 0
      ? voiceMessages.map((msg) => ({
          id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          content: msg.content,
          role: msg.role,
          timestamp: msg.timestamp,
          isProcessing: msg.isProcessing,
        }))
      : initialMessages;
  });

  // Update messages when voice messages change
  useEffect(() => {
    if (voiceMessages.length > 0) {
      setMessages((prev) => {
        // Don't add duplicates
        const newMessages = voiceMessages.filter(
          (vm) =>
            !prev.some((pm) =>
              pm.content === vm.content &&
              pm.role === vm.role &&
              pm.timestamp.getTime() === vm.timestamp.getTime()
            )
        );

        if (newMessages.length === 0) return prev;

        return [
          ...prev,
          ...newMessages.map((msg) => ({
            id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            content: msg.content,
            role: msg.role,
            timestamp: msg.timestamp,
            isProcessing: msg.isProcessing,
          })),
        ];
      });
    }
  }, [voiceMessages]);

  // Handle errors
  useEffect(() => {
    if (error) {
      onError?.(error);
      // Auto-clear error after 5 seconds
      const timer = setTimeout(() => {
        clearError();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, onError, clearError]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-focus input when component mounts or when un-minimized
  useEffect(() => {
    if (!isMinimized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isMinimized]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Toggle listening state
  const handleToggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening().catch((err) => {
        console.error('Failed to start listening:', err);
        onError?.(err instanceof Error ? err : new Error(String(err)));
      });
    }
  };

  // Handle text submission
  const handleSendMessage = async () => {
    const text = textInput.trim();
    if (!text) return;

    try {
      setIsProcessingText(true);

      // Add user message immediately for better UX
      const userMessage: Message = {
        id: `msg-${Date.now()}`,
        content: text,
        role: 'user',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setTextInput('');

      // Process the text and get the assistant's response
      await processText(text);
    } catch (err) {
      console.error('Error processing text:', err);
      onError?.(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsProcessingText(false);
    }
  };

  // Handle key down event
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  // Toggle between minimized and expanded states
  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  // Format message timestamp
  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  // Get position classes based on the position prop
  const getPositionClasses = () => {
    switch (position) {
      case 'bottom-right':
        return 'bottom-6 right-6';
      case 'bottom-left':
        return 'bottom-6 left-6';
      case 'top-right':
        return 'top-6 right-6';
      case 'top-left':
        return 'top-6 left-6';
      default:
        return 'bottom-6 right-6';
    }
  };

  // If minimized, show a small floating button
  if (isMinimized) {
    return (
      <div className={`fixed ${getPositionClasses()} z-50`}>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={toggleMinimize}
                className="rounded-full h-14 w-14 p-0 bg-primary hover:bg-primary/90 shadow-lg"
                aria-label="Open virtual assistant"
              >
                <MessageSquare className="h-6 w-6" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>Chat with Aegis Assistant</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex flex-col bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden',
        'border border-gray-200/50',
        'transform transition-all duration-300',
        className
      )}
      style={{ width, height }}
    >
      {showHeader && (
        <div className="bg-gradient-to-r from-primary to-blue-600 text-white p-4 flex justify-between items-center border-b border-white/10">
          <div className="flex items-center space-x-3">
            <motion.div
              className="bg-white/20 p-2 rounded-full"
              animate={{
                rotate: [0, 10, -10, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatType: 'reverse',
              }}
            >
              <Sparkles className="h-5 w-5 text-yellow-300" />
            </motion.div>
            <div>
              <h3 className="font-bold text-lg">{title}</h3>
              <p className="text-xs text-white/90">{subtitle}</p>
            </div>
          </div>
          {showCloseButton && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white/90 hover:bg-white/20 hover:text-white"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-hidden flex flex-col bg-gradient-to-b from-white to-gray-50">
        <ScrollArea className="flex-1 p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <div className="relative mb-6">
                <div className="absolute -inset-4 bg-blue-100 rounded-full opacity-70 animate-pulse"></div>
                <div className="relative bg-gradient-to-br from-blue-500 to-blue-600 p-4 rounded-2xl">
                  <Sparkles className="h-10 w-10 text-yellow-300" />
                </div>
              </div>
              <h4 className="font-bold text-gray-800 text-lg mb-2">How can I help you today?</h4>
              <p className="text-sm text-gray-500 max-w-xs">
                I'm your AI assistant, here to help with any questions about your business.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  className={cn(
                    'flex',
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div
                    className={cn(
                      'max-w-[85%] rounded-2xl p-4 relative',
                      message.role === 'user'
                        ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-br-none shadow-lg'
                        : 'bg-white text-gray-800 rounded-bl-none shadow-md border border-gray-100',
                      message.isProcessing && 'animate-pulse',
                      'group'
                    )}
                  >
                    {message.role === 'assistant' && (
                      <div className="absolute -left-2 top-0 w-4 h-4 transform -translate-y-1/2 rotate-45 bg-white border-l border-t border-gray-100"></div>
                    )}
                    {message.role === 'user' && (
                      <div className="absolute -right-2 top-0 w-4 h-4 transform -translate-y-1/2 rotate-45 bg-blue-500"></div>
                    )}
                    <p className="text-sm leading-relaxed">{message.content}</p>
                    <div className={cn(
                      'text-xs mt-2 flex justify-end items-center space-x-1',
                      message.role === 'user' ? 'text-blue-100' : 'text-gray-400'
                    )}>
                      <span>
                        {message.timestamp.toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      {message.role === 'assistant' && (
                        <span className="text-blue-400">•</span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>

        <div className="border-t border-gray-200/50 p-4 bg-white/80 backdrop-blur-sm">
          <div className="flex items-center space-x-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className={cn(
                      'h-12 w-12 rounded-full transition-all duration-200',
                      isListening
                        ? 'bg-red-100 border-red-200 text-red-500 hover:bg-red-50'
                        : 'hover:bg-gray-100',
                      (isProcessing || isProcessingText) && 'opacity-50 cursor-not-allowed'
                    )}
                    onClick={handleToggleListening}
                    disabled={isProcessingText || isProcessing}
                  >
                    {isListening ? (
                      <motion.div
                        animate={{
                          scale: [1, 1.1, 1],
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          repeatType: 'reverse',
                        }}
                      >
                        <MicOff className="h-5 w-5" />
                      </motion.div>
                    ) : (
                      <Mic className="h-5 w-5" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isListening ? 'Stop Listening' : 'Start Voice Input'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <div className="flex-1 relative">
              <Input
                ref={inputRef}
                type="text"
                placeholder="Ask me anything..."
                className={cn(
                  'h-12 pl-4 pr-12 rounded-full border-2 border-gray-200 focus-visible:ring-2 focus-visible:ring-primary/50',
                  'transition-all duration-200',
                  'focus:border-primary/50',
                  'placeholder-gray-400',
                  'text-gray-800',
                  'shadow-sm',
                  'hover:border-gray-300',
                  (isProcessing || isProcessingText) && 'opacity-70'
                )}
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isProcessingText || isProcessing}
              />
              {isProcessing && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <ButtonLoader size="sm" />
                </div>
              )}
            </div>

            <Button
              variant="default"
              size="icon"
              className={cn(
                'h-12 w-12 rounded-full bg-gradient-to-r from-blue-600 to-blue-500',
                'hover:from-blue-700 hover:to-blue-600',
                'transition-all duration-200',
                'shadow-md',
                'transform hover:scale-105',
                'flex items-center justify-center',
                (!textInput.trim() || isProcessingText || isProcessing) && 'opacity-70 cursor-not-allowed'
              )}
              onClick={handleSendMessage}
              disabled={!textInput.trim() || isProcessingText || isProcessing}
            >
              {isProcessingText ? (
                <ButtonLoader size="sm" />
              ) : (
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Send className="h-5 w-5 text-white" />
                </motion.div>
              )}
            </Button>
          </div>
        </div>
        <div className="text-xs text-muted-foreground mt-2 flex items-center justify-between">
          <span>
            {isListening
              ? 'Listening...'
              : isProcessing
              ? 'Processing...'
              : 'Press the mic button or type a message'}
          </span>
          <span className="flex items-center">
            <Volume2 className="h-3 w-3 mr-1" />
            <span>Voice input ready</span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default VirtualAssistant;
