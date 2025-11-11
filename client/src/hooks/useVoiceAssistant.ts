import { useState, useCallback, useEffect, useRef } from 'react';

interface VoiceAssistantMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isProcessing?: boolean;
}

interface UseVoiceAssistantProps {
  initialMessages?: VoiceAssistantMessage[];
  autoStartListening?: boolean;
  onError?: (error: Error) => void;
}

export const useVoiceAssistant = ({
  initialMessages = [],
  autoStartListening = false,
  onError,
}: UseVoiceAssistantProps = {}) => {
  const [messages, setMessages] = useState<VoiceAssistantMessage[]>(initialMessages);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sessionId, setSessionId] = useState<string>();
  const [error, setError] = useState<Error | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Handle errors
  const handleError = useCallback(
    (err: unknown) => {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      onError?.(error);
      console.error('Voice Assistant Error:', error);
    },
    [onError]
  );

  // Add a message to the conversation
  const addMessage = useCallback(
    (message: Omit<VoiceAssistantMessage, 'timestamp'>) => {
      setMessages((prev) => [
        ...prev,
        { ...message, timestamp: new Date() },
      ]);
    },
    []
  );

  // Process text input
  const processText = useCallback(
    async (text: string) => {
      if (!text.trim()) return;

      // Add user message
      const userMessage: VoiceAssistantMessage = {
        role: 'user',
        content: text,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);

      // Add temporary assistant message
      const tempAssistantMessage: VoiceAssistantMessage = {
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        isProcessing: true,
      };
      setMessages((prev) => [...prev, tempAssistantMessage]);

      try {
        setIsProcessing(true);

        // Simulate API response for now
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
        
        const mockResponse = {
          textResponse: `I received your message: "${text}"`,
          sessionId: sessionId || `sess_${Date.now()}`
        };

        // Update session ID if this is a new session
        if (mockResponse.sessionId && mockResponse.sessionId !== sessionId) {
          setSessionId(mockResponse.sessionId);
        }

        // Update the temporary assistant message
        setMessages((prev) => {
          const updated = [...prev];
          const lastMessageIndex = updated.findIndex(
            (msg) => msg.isProcessing && msg.role === 'assistant'
          );
          
          if (lastMessageIndex !== -1) {
            updated[lastMessageIndex] = {
              role: 'assistant',
              content: mockResponse.textResponse,
              timestamp: new Date(),
            };
          } else {
            // If for some reason we couldn't find the temp message, add a new one
            updated.push({
              role: 'assistant',
              content: mockResponse.textResponse,
              timestamp: new Date(),
            });
          }
          
          return updated;
        });
      } catch (err) {
        handleError(err);
      } finally {
        setIsProcessing(false);
      }
    },
    [handleError, sessionId]
  );

  // Process audio input (simplified for now)
  const processAudio = useCallback(
    async (audioBlob: Blob) => {
      try {
        setIsProcessing(true);
        
        // Simulate audio processing
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const mockResponse = {
          textResponse: "I heard your voice message! Currently, I can only process text. Please type your message instead.",
          sessionId: sessionId || `sess_${Date.now()}`
        };

        // Update session ID if this is a new session
        if (mockResponse.sessionId && mockResponse.sessionId !== sessionId) {
          setSessionId(mockResponse.sessionId);
        }

        // Add assistant response to messages
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: mockResponse.textResponse,
            timestamp: new Date(),
          },
        ]);
      } catch (err) {
        handleError(err);
      } finally {
        setIsProcessing(false);
      }
    },
    [handleError, sessionId]
  );

  // Start voice recording
  const startListening = useCallback(async () => {
    try {
      if (isListening) return;

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Initialize MediaRecorder
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      // Handle data available event
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      // Handle recording stop
      mediaRecorder.onstop = async () => {
        if (audioChunksRef.current.length > 0) {
          const audioBlob = new Blob(audioChunksRef.current, {
            type: 'audio/wav',
          });
          await processAudio(audioBlob);
        }
        audioChunksRef.current = [];
      };

      // Start recording
      mediaRecorder.start();
      setIsListening(true);

      // Set a timer to stop recording after 5 seconds of silence
      // This is a simplified approach - in a real app, you'd use the Web Audio API
      // to detect silence more accurately
      const silenceTimer = setTimeout(() => {
        if (mediaRecorder.state !== 'inactive') {
          mediaRecorder.stop();
          setIsListening(false);
        }
      }, 5000);

      // Clean up
      return () => {
        clearTimeout(silenceTimer);
        if (mediaRecorder.state !== 'inactive') {
          mediaRecorder.stop();
        }
        stream.getTracks().forEach((track) => track.stop());
      };
    } catch (err) {
      handleError(err);
      setIsListening(false);
    }
  }, [isListening, processAudio, handleError]);

  // Stop voice recording
  const stopListening = useCallback(() => {
    if (!isListening || !mediaRecorderRef.current) return;

    // Stop the media recorder
    if (mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
    // Stop all tracks in the stream
    if (mediaRecorderRef.current.stream) {
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
    }
    
    setIsListening(false);
  }, [isListening]);

  // Toggle voice recording
  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  // Auto-start listening if enabled
  useEffect(() => {
    if (autoStartListening) {
      startListening().catch(handleError);
    }
    
    // Clean up on unmount
    return () => {
      stopListening();
    };
  }, [autoStartListening, handleError, startListening, stopListening]);

  return {
    // State
    messages,
    isListening,
    isProcessing,
    sessionId,
    error,
    
    // Actions
    processText,
    processAudio,
    startListening,
    stopListening,
    toggleListening,
    addMessage,
    clearError: () => setError(null),
  };
};

export default useVoiceAssistant;
