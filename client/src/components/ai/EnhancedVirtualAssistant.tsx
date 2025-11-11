import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Bot, Mic, MicOff, Send, X, Loader2, MessageSquare, Volume2, Paperclip, Image as ImageIcon, FileText, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useVoiceAssistant } from '@/hooks/useVoiceAssistant';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';

export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  timestamp: Date;
  isProcessing?: boolean;
  type?: 'text' | 'image' | 'file' | 'command' | 'error';
  metadata?: {
    fileName?: string;
    fileSize?: string;
    fileType?: string;
    url?: string;
    command?: string;
    status?: 'success' | 'error' | 'processing';
  };
}

interface CommandSuggestion {
  command: string;
  description: string;
  icon?: React.ReactNode;
  category: 'accounting' | 'business' | 'general' | 'settings';
}

interface EnhancedVirtualAssistantProps {
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
  commands?: CommandSuggestion[];
  onCommand?: (command: string) => Promise<void> | void;
  onFileUpload?: (file: File) => Promise<string>;
  languages?: { code: string; name: string; flag?: string }[];
  onLanguageChange?: (languageCode: string) => void;
  defaultLanguage?: string;
  showTabs?: boolean;
  tabs?: { id: string; label: string; icon?: React.ReactNode; content: React.ReactNode }[];
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  customActions?: { icon: React.ReactNode; label: string; onClick: () => void }[];
  showCommandSuggestions?: boolean;
  showFileUpload?: boolean;
  showLanguageSelector?: boolean;
}

const defaultCommands: CommandSuggestion[] = [
  {
    command: 'Create a new invoice',
    description: 'Start creating a new invoice',
    category: 'accounting',
  },
  {
    command: 'Show me the sales report',
    description: 'View the latest sales report',
    category: 'business',
  },
  {
    command: 'What can you do?',
    description: 'Learn about my capabilities',
    category: 'general',
  },
  {
    command: 'Help me with accounting',
    description: 'Get help with accounting tasks',
    category: 'accounting',
  },
];

const defaultLanguages = [
  { code: 'en-US', name: 'English', flag: '🇺🇸' },
  { code: 'es-ES', name: 'Español', flag: '🇪🇸' },
  { code: 'fr-FR', name: 'Français', flag: '🇫🇷' },
  { code: 'de-DE', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'zh-CN', name: '中文', flag: '🇨🇳' },
];

export const EnhancedVirtualAssistant: React.FC<EnhancedVirtualAssistantProps> = ({
  className,
  initialMessages = [],
  onClose,
  onError,
  showHeader = true,
  showCloseButton = true,
  position = 'bottom-right',
  width = 450,
  height = 650,
  title = 'Aegis Assistant',
  subtitle = 'How can I help you today?',
  commands = defaultCommands,
  onCommand,
  onFileUpload,
  languages = defaultLanguages,
  onLanguageChange,
  defaultLanguage = 'en-US',
  showTabs = false,
  tabs = [],
  activeTab,
  onTabChange,
  customActions = [],
  showCommandSuggestions = true,
  showFileUpload = true,
  showLanguageSelector = true,
}) => {
  const [textInput, setTextInput] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [language, setLanguage] = useState(defaultLanguage);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isProcessingText, setIsProcessingText] = useState(false);
  
  const {
    messages: voiceMessages,
    isListening,
    isProcessing,
    error,
    startListening,
    stopListening,
    processText: processTextWithAssistant,
    clearError,
  } = useVoiceAssistant({
    autoStartListening: false,
    onError: (err) => {
      console.error('Virtual Assistant Error:', err);
      onError?.(err);
      addSystemMessage({
        content: `Error: ${err.message}`,
        type: 'error',
        metadata: { status: 'error' },
      });
    },
  });

  // Combine initial messages with voice messages
  const [messages, setMessages] = useState<Message[]>(() => {
    return voiceMessages.length > 0
      ? voiceMessages.map(msg => ({
          id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          content: msg.content,
          role: msg.role,
          timestamp: msg.timestamp,
          isProcessing: msg.isProcessing,
        }))
      : initialMessages;
  });

  // Add a system message
  const addSystemMessage = useCallback((message: Omit<Message, 'id' | 'timestamp' | 'role'>) => {
    const newMessage: Message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...message,
      role: 'system',
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, newMessage]);
    return newMessage;
  }, []);

  // Handle file selection
  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const newFiles = Array.from(files);
    setSelectedFiles(prev => [...prev, ...newFiles]);
    
    // Auto-upload if onFileUpload is provided
    if (onFileUpload) {
      setIsProcessingFile(true);
      
      Promise.all(
        newFiles.map(file => 
          onFileUpload(file)
            .then(url => ({
              success: true,
              file,
              url,
              error: null,
            }))
            .catch(error => ({
              success: false,
              file,
              url: null,
              error: error.message || 'Failed to upload file',
            }))
        )
      )
      .then(results => {
        results.forEach((result, index) => {
          if (result.success) {
            addSystemMessage({
              content: `File "${result.file.name}" uploaded successfully`,
              type: 'file',
              metadata: {
                fileName: result.file.name,
                fileSize: formatFileSize(result.file.size),
                fileType: result.file.type,
                url: result.url,
                status: 'success',
              },
            });
          } else {
            addSystemMessage({
              content: `Failed to upload "${result.file.name}": ${result.error}`,
              type: 'error',
              metadata: { status: 'error' },
            });
          }
        });
      })
      .finally(() => {
        setIsProcessingFile(false);
        setSelectedFiles([]);
      });
    }
  }, [onFileUpload, addSystemMessage]);

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Handle drag and drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  }, [isDragging]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files);
    }
  }, [handleFileSelect]);

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
    // Reset the input value to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle language change
  const handleLanguageChange = (langCode: string) => {
    setLanguage(langCode);
    onLanguageChange?.(langCode);
    addSystemMessage({
      content: `Language changed to ${languages.find(l => l.code === langCode)?.name || langCode}`,
      type: 'command',
      metadata: { status: 'success' },
    });
  };

  // Handle command execution
  const handleCommand = useCallback(async (command: string) => {
    if (!command.trim()) return;
    
    // Add user command to chat
    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      content: command,
      role: 'user',
      timestamp: new Date(),
      type: 'command',
    };
    
    setMessages(prev => [...prev, userMessage]);
    setTextInput('');
    
    try {
      setIsProcessingText(true);
      
      // If there's a custom command handler, use it
      if (onCommand) {
        await onCommand(command);
      } else {
        // Otherwise, use the default voice assistant processing
        await processTextWithAssistant(command);
      }
    } catch (err) {
      console.error('Error executing command:', err);
      onError?.(err instanceof Error ? err : new Error(String(err)));
      
      addSystemMessage({
        content: `Failed to execute command: ${err instanceof Error ? err.message : 'Unknown error'}`,
        type: 'error',
        metadata: { status: 'error' },
      });
    } finally {
      setIsProcessingText(false);
    }
  }, [onCommand, processTextWithAssistant, onError, addSystemMessage]);

  // Handle text submission
  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    const text = textInput.trim();
    if (!text) return;
    
    await handleCommand(text);
  }, [textInput, handleCommand]);

  // Toggle listening state
  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening().catch((err) => {
        console.error('Failed to start listening:', err);
        onError?.(err instanceof Error ? err : new Error(String(err)));
      });
    }
  }, [isListening, startListening, stopListening, onError]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle listening with Ctrl+Space (when not focused on input)
      if (e.ctrlKey && e.code === 'Space' && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        toggleListening();
      }
      
      // Open command palette with Ctrl+K
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleListening]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-focus input when component mounts or when un-minimized
  useEffect(() => {
    if (!isMinimized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isMinimized]);

  // Toggle between minimized and expanded states
  const toggleMinimize = useCallback(() => {
    setIsMinimized(!isMinimized);
  }, [isMinimized]);

  // Format message timestamp
  const formatTime = useCallback((date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }, []);

  // Get position classes based on the position prop
  const getPositionClasses = useCallback(() => {
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
  }, [position]);

  // Get file icon based on file type
  const getFileIcon = (file: File) => {
    const type = file.type.split('/')[0];
    switch (type) {
      case 'image':
        return <ImageIcon className="h-4 w-4" />;
      case 'application':
        if (file.type.includes('pdf')) {
          return <FileText className="h-4 w-4 text-red-500" />;
        }
        if (file.type.includes('word') || file.type.includes('document')) {
          return <FileText className="h-4 w-4 text-blue-500" />;
        }
        if (file.type.includes('excel') || file.type.includes('spreadsheet')) {
          return <FileText className="h-4 w-4 text-green-600" />;
        }
        return <FileText className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  // Filter commands by active category
  const filteredCommands = activeCategory === 'all' 
    ? commands 
    : commands.filter(cmd => cmd.category === activeCategory);

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
              <p className="text-xs text-muted-foreground">Press Ctrl+Space to talk</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'fixed flex flex-col bg-background border rounded-lg shadow-xl overflow-hidden',
        'transition-all duration-300 ease-in-out',
        getPositionClasses(),
        className
      )}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag and drop overlay */}
      {isDragging && (
        <div className="absolute inset-0 bg-primary/10 backdrop-blur-sm z-50 flex items-center justify-center border-2 border-dashed border-primary rounded-lg m-2">
          <div className="text-center p-6 bg-background/90 rounded-lg shadow-lg">
            <FileText className="h-12 w-12 mx-auto mb-4 text-primary" />
            <p className="font-medium">Drop files to upload</p>
            <p className="text-sm text-muted-foreground">Supported formats: images, PDFs, documents</p>
          </div>
        </div>
      )}

      {/* Header */}
      {showHeader && (
        <div className="flex items-center justify-between p-4 border-b bg-muted/50">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Avatar className="h-8 w-8">
                <AvatarImage src="/assets/logo.png" alt="Aegis Logo" />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  <Bot className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <span
                className={cn(
                  'absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-background',
                  isListening ? 'bg-green-500' : 'bg-muted-foreground',
                  isProcessing && 'bg-amber-500'
                )}
              />
            </div>
            <div>
              <h3 className="font-medium">{title}</h3>
              <p className="text-xs text-muted-foreground">
                {isListening ? 'Listening...' : isProcessing ? 'Thinking...' : subtitle}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            {showLanguageSelector && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-xs"
                    aria-label="Change language"
                  >
                    {languages.find(l => l.code === language)?.flag || '🌐'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Command>
                    <CommandInput placeholder="Search languages..." />
                    <CommandEmpty>No language found.</CommandEmpty>
                    <CommandGroup className="max-h-[200px] overflow-y-auto">
                      {languages.map((lang) => (
                        <CommandItem
                          key={lang.code}
                          onSelect={() => handleLanguageChange(lang.code)}
                          className="flex items-center space-x-2"
                        >
                          <span>{lang.flag}</span>
                          <span>{lang.name}</span>
                          {lang.code === language && (
                            <span className="ml-auto text-primary">✓</span>
                          )}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            )}
            
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={toggleMinimize}
              aria-label="Minimize"
            >
              <span className="sr-only">Minimize</span>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Tabs */}
      {showTabs && tabs.length > 0 && (
        <Tabs 
          value={activeTab || tabs[0]?.id} 
          onValueChange={onTabChange}
          className="border-b"
        >
          <TabsList className="w-full justify-start rounded-none bg-transparent p-0">
            {tabs.map((tab) => (
              <TabsTrigger 
                key={tab.id} 
                value={tab.id}
                className="relative h-10 rounded-none border-b-2 border-transparent bg-transparent px-4 pb-3 pt-2 font-semibold text-muted-foreground shadow-none transition-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
              >
                <div className="flex items-center space-x-2">
                  {tab.icon}
                  <span>{tab.label}</span>
                </div>
              </TabsTrigger>
            ))}
          </TabsList>
          
          {tabs.map((tab) => (
            <TabsContent key={tab.id} value={tab.id} className="m-0 p-4">
              {tab.content}
            </TabsContent>
          ))}
        </Tabs>
      )}

      {/* Messages */}
      <ScrollArea className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center text-muted-foreground">
              <Bot className="h-10 w-10 mb-2 opacity-50" />
              <h4 className="font-medium">How can I help you today?</h4>
              <p className="text-sm">Ask me anything about your business, accounting, or more.</p>
              
              {showCommandSuggestions && (
                <div className="mt-6 w-full max-w-xs">
                  <h5 className="text-sm font-medium mb-2">Try saying:</h5>
                  <div className="space-y-2">
                    {commands.slice(0, 3).map((cmd, i) => (
                      <button
                        key={i}
                        onClick={() => handleCommand(cmd.command)}
                        className="w-full text-left p-2 text-sm rounded-md border hover:bg-muted/50 transition-colors"
                      >
                        <div className="font-medium">{cmd.command}</div>
                        <div className="text-xs text-muted-foreground">{cmd.description}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'flex items-start gap-2',
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {message.role === 'assistant' && (
                  <Avatar className="h-6 w-6 mt-1">
                    <AvatarImage src="/assets/logo.png" alt="Aegis" />
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      <Bot className="h-3 w-3" />
                    </AvatarFallback>
                  </Avatar>
                )}
                
                <div
                  className={cn(
                    'rounded-lg px-4 py-2 max-w-[80%]',
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-tr-none'
                      : message.role === 'system' && message.type === 'error'
                      ? 'bg-destructive/10 text-destructive border border-destructive/20'
                      : message.role === 'system' 
                      ? 'bg-muted/50 text-muted-foreground'
                      : 'bg-muted',
                    message.isProcessing && 'animate-pulse',
                    message.type === 'command' && 'border border-primary/30'
                  )}
                >
                  {message.type === 'file' && message.metadata?.fileName ? (
                    <div className="flex items-center space-x-2">
                      <div className="p-2 bg-muted/50 rounded-md">
                        {message.metadata.fileType?.startsWith('image/') ? (
                          <img 
                            src={message.metadata.url} 
                            alt={message.metadata.fileName} 
                            className="h-12 w-12 object-cover rounded"
                          />
                        ) : (
                          <FileText className="h-6 w-6 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{message.metadata.fileName}</p>
                        <p className="text-xs text-muted-foreground">
                          {message.metadata.fileSize}
                        </p>
                        {message.metadata.url && (
                          <a 
                            href={message.metadata.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline mt-1 inline-block"
                          >
                            View file
                          </a>
                        )}
                      </div>
                    </div>
                  ) : message.type === 'error' ? (
                    <div className="flex items-center space-x-2">
                      <XCircle className="h-4 w-4 flex-shrink-0" />
                      <span>{message.content}</span>
                    </div>
                  ) : (
                    <div className="prose prose-sm max-w-none">
                      {message.content || (
                        <span className="flex items-center space-x-1 text-muted-foreground">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          <span>Thinking...</span>
                        </span>
                      )}
                    </div>
                  )}
                  
                  <div className={cn(
                    "text-xs opacity-70 mt-1 text-right",
                    message.role === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                  )}>
                    {formatTime(message.timestamp)}
                    {message.metadata?.status === 'success' && (
                      <span className="ml-1 text-green-500">✓</span>
                    )}
                    {message.metadata?.status === 'error' && (
                      <span className="ml-1 text-destructive">✗</span>
                    )}
                  </div>
                </div>
                
                {message.role === 'user' && (
                  <Avatar className="h-6 w-6 mt-1">
                    <AvatarFallback className="bg-primary/10 text-foreground text-xs">
                      You
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input area */}
      <div className="border-t p-3 bg-background">
        {/* Selected files */}
        {selectedFiles.length > 0 && (
          <div className="mb-3 p-2 bg-muted/30 rounded-md">
            <div className="flex flex-wrap gap-2 mb-2">
              {selectedFiles.map((file, index) => (
                <div 
                  key={index}
                  className="flex items-center gap-2 bg-background border rounded-md px-2 py-1 text-xs"
                >
                  {getFileIcon(file)}
                  <span className="max-w-[120px] truncate">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFiles(prev => prev.filter((_, i) => i !== index));
                    }}
                    className="text-muted-foreground hover:text-destructive"
                    aria-label="Remove file"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          {/* File upload button */}
          {showFileUpload && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="shrink-0"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessing || isListening || isProcessingFile}
                    aria-label="Attach file"
                  >
                    {isProcessingFile ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Paperclip className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">Attach file</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileInputChange}
            multiple
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
          />
          
          <div className="relative flex-1">
            <Input
              ref={inputRef}
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Type your message..."
              className="pr-10"
              disabled={isProcessing || isListening || isProcessingText || isProcessingFile}
              aria-label="Type your message"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
            />
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={toggleListening}
                    disabled={isProcessing || isProcessingText || isProcessingFile}
                    className={cn(
                      'absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full transition-colors',
                      isListening
                        ? 'text-destructive hover:bg-destructive/10'
                        : 'text-muted-foreground hover:bg-muted',
                      (isProcessing || isProcessingText || isProcessingFile) && 'opacity-50 cursor-not-allowed'
                    )}
                    aria-label={isListening ? 'Stop listening' : 'Start voice input'}
                  >
                    {isListening ? (
                      <MicOff className="h-4 w-4" />
                    ) : (
                      <Mic className="h-4 w-4" />
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  {isListening ? 'Stop listening' : 'Start voice input'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          <Button
            type="submit"
            size="icon"
            disabled={(!textInput.trim() && selectedFiles.length === 0) || isProcessing || isListening || isProcessingText || isProcessingFile}
            className="shrink-0"
            aria-label="Send message"
          >
            {isProcessingText || isProcessingFile ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
        
        <div className="text-xs text-muted-foreground mt-2 flex items-center justify-between">
          <span>
            {isListening
              ? 'Listening...'
              : isProcessing
              ? 'Processing...'
              : isProcessingFile
              ? 'Uploading files...'
              : 'Press the mic button or type a message'}
          </span>
          <div className="flex items-center">
            <span className="hidden sm:inline-flex items-center mr-2">
              <kbd className="bg-muted px-1.5 py-0.5 text-xs rounded border">Ctrl</kbd>
              <span className="mx-1">+</span>
              <kbd className="bg-muted px-1.5 py-0.5 text-xs rounded border">Space</kbd>
              <span className="mx-1">to talk</span>
            </span>
            <span className="flex items-center">
              <Volume2 className="h-3 w-3 mr-1" />
              <span>Voice input ready</span>
            </span>
          </div>
        </div>
      </div>
      
      {/* Command Palette */}
      <Popover open={isCommandPaletteOpen} onOpenChange={setIsCommandPaletteOpen}>
        <PopoverContent className="w-[400px] p-0" align="end" side="top">
          <Command className="rounded-lg border shadow-md">
            <CommandInput 
              placeholder="Type a command or search..." 
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                  const value = e.currentTarget.value;
                  if (value) {
                    handleCommand(value);
                    setIsCommandPaletteOpen(false);
                  }
                }
              }}
            />
            
            <Tabs 
              defaultValue="all" 
              className="w-full"
              onValueChange={setActiveCategory}
            >
              <div className="border-b px-2">
                <TabsList className="w-full justify-start bg-transparent p-0 h-auto">
                  <TabsTrigger 
                    value="all" 
                    className="text-xs px-3 py-1.5 h-auto data-[state=active]:shadow-none"
                  >
                    All
                  </TabsTrigger>
                  <TabsTrigger 
                    value="accounting" 
                    className="text-xs px-3 py-1.5 h-auto data-[state=active]:shadow-none"
                  >
                    Accounting
                  </TabsTrigger>
                  <TabsTrigger 
                    value="business" 
                    className="text-xs px-3 py-1.5 h-auto data-[state=active]:shadow-none"
                  >
                    Business
                  </TabsTrigger>
                  <TabsTrigger 
                    value="settings" 
                    className="text-xs px-3 py-1.5 h-auto data-[state=active]:shadow-none"
                  >
                    Settings
                  </TabsTrigger>
                </TabsList>
              </div>
            </Tabs>
            
            <CommandEmpty>No commands found.</CommandEmpty>
            
            <CommandGroup heading="Suggested Commands" className="max-h-[300px] overflow-y-auto">
              {filteredCommands.map((cmd, index) => (
                <CommandItem
                  key={index}
                  onSelect={() => {
                    handleCommand(cmd.command);
                    setIsCommandPaletteOpen(false);
                  }}
                  className="flex flex-col items-start gap-1 cursor-pointer"
                >
                  <div className="flex items-center">
                    {cmd.icon && <span className="mr-2">{cmd.icon}</span>}
                    <span className="font-medium">{cmd.command}</span>
                  </div>
                  <span className="text-xs text-muted-foreground ml-6">
                    {cmd.description}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
            
            <div className="px-2 py-1.5 text-xs text-muted-foreground border-t flex items-center justify-between">
              <span>Press Esc to close</span>
              <div className="flex items-center">
                <kbd className="bg-muted px-1.5 py-0.5 rounded border text-xs">↑</kbd>
                <kbd className="bg-muted px-1.5 py-0.5 rounded border text-xs mx-1">↓</kbd>
                <span>to navigate</span>
                <kbd className="bg-muted px-1.5 py-0.5 rounded border text-xs ml-2">Enter</kbd>
                <span>to select</span>
              </div>
            </div>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default EnhancedVirtualAssistant;
