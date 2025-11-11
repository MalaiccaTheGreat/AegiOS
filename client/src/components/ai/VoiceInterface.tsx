import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Send, X, Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useVoiceAssistant } from '@/hooks/useVoiceAssistant';

interface VoiceInterfaceProps {
  onClose?: () => void;
  className?: string;
  onTextSubmit?: (text: string) => void;
  onError?: (error: Error) => void;
  autoStart?: boolean;
  showCloseButton?: boolean;
}

export const VoiceInterface: React.FC<VoiceInterfaceProps> = ({
  onClose,
  className,
  onTextSubmit,
  onError,
  autoStart = false,
  showCloseButton = true,
}) => {
  const [textInput, setTextInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const [isProcessingText, setIsProcessingText] = useState(false);
  
  const {
    isListening,
    isProcessing,
    error,
    startListening,
    stopListening,
    processText,
    clearError,
  } = useVoiceAssistant({
    autoStartListening: autoStart,
    onError: (err) => {
      console.error('Voice interface error:', err);
      onError?.(err);
    },
  });

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

  // Auto-focus input when component mounts
  useEffect(() => {
    if (inputRef.current && !autoStart) {
      inputRef.current.focus();
    }
  }, [autoStart]);

  // Toggle listening state
  const toggleListening = () => {
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
  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    const text = textInput.trim();
    if (!text) return;
    
    try {
      setIsProcessingText(true);
      await processText(text);
      onTextSubmit?.(text);
      setTextInput('');
    } catch (err) {
      console.error('Error processing text:', err);
      onError?.(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsProcessingText(false);
    }
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle listening with Ctrl+Space (when not focused on input)
      if (e.ctrlKey && e.code === 'Space' && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        toggleListening();
      }
      
      // Submit with Enter when input is focused
      if (e.key === 'Enter' && document.activeElement === inputRef.current) {
        handleSubmit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isListening, textInput]);

  return (
    <div
      className={cn(
        'relative flex flex-col p-4 bg-background border rounded-lg shadow-lg w-full max-w-lg mx-auto',
        className
      )}
    >
      {/* Close button */}
      {showCloseButton && onClose && (
        <button
          type="button"
          onClick={onClose}
          className="absolute top-2 right-2 p-1 rounded-full hover:bg-muted transition-colors"
          aria-label="Close voice interface"
        >
          <X className="h-4 w-4" />
        </button>
      )}

      {/* Status indicator */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div
            className={cn(
              'h-3 w-3 rounded-full',
              isListening ? 'bg-green-500 animate-pulse' : 'bg-muted-foreground',
              isProcessing && 'bg-amber-500'
            )}
            aria-hidden="true"
          />
          <span className="text-sm text-muted-foreground">
            {isListening ? 'Listening...' : isProcessing ? 'Processing...' : 'Ready'}
          </span>
        </div>
        {error && (
          <div className="text-xs text-destructive">
            {error.message}
          </div>
        )}
      </div>

      {/* Text input */}
      <form onSubmit={handleSubmit} className="flex items-center space-x-2 mb-4">
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Type your message or use voice..."
            className="w-full px-4 py-2 pr-12 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
            disabled={isProcessing || isListening || isProcessingText}
          />
          <button
            type="button"
            onClick={toggleListening}
            disabled={isProcessing || isProcessingText}
            className={cn(
              'absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full transition-colors',
              isListening
                ? 'bg-destructive/10 text-destructive hover:bg-destructive/20'
                : 'text-muted-foreground hover:bg-muted',
              (isProcessing || isProcessingText) && 'opacity-50 cursor-not-allowed'
            )}
            aria-label={isListening ? 'Stop listening' : 'Start listening'}
          >
            {isListening ? (
              <MicOff className="h-4 w-4" />
            ) : (
              <Mic className="h-4 w-4" />
            )}
          </button>
        </div>
        <Button
          type="submit"
          size="icon"
          disabled={!textInput.trim() || isProcessing || isListening || isProcessingText}
          className="shrink-0"
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>

      {/* Status messages */}
      <div className="text-xs text-muted-foreground flex items-center justify-between">
        <span>
          {isListening
            ? 'Speak now...'
            : isProcessing
            ? 'Processing your request...'
            : 'Press the mic button or Ctrl+Space to speak'}
        </span>
        <span className="flex items-center">
          <Volume2 className="h-3 w-3 mr-1" />
          <span>Voice input ready</span>
        </span>
      </div>
    </div>
  );
};

export default VoiceInterface;
