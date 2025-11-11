'use client'

import { useState, useRef, useEffect } from 'react'
import { Mic, MicOff, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function VoiceAssistant() {
  const [isListening, setIsListening] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  useEffect(() => {
    // Cleanup function
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [])

  const startListening = () => {
    setIsListening(true)
    setIsProcessing(true)
    
    // Simulate voice recognition processing
    setTimeout(() => {
      setIsProcessing(false)
    }, 2000)
  }

  const stopListening = () => {
    setIsListening(false)
    // Simulate processing the recorded speech
    setIsProcessing(true)
    
    setTimeout(() => {
      setIsProcessing(false)
    }, 1500)
  }

  const toggleListening = () => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Button
        onClick={toggleListening}
        className={cn(
          'h-16 w-16 rounded-full shadow-lg transition-all duration-300',
          isListening 
            ? 'animate-pulse bg-red-500 hover:bg-red-600' 
            : 'bg-primary hover:bg-primary/90',
          isProcessing && 'bg-amber-500 hover:bg-amber-600'
        )}
        aria-label={isListening ? 'Stop listening' : 'Start voice assistant'}
      >
        {isProcessing ? (
          <Loader2 className="h-6 w-6 animate-spin" />
        ) : isListening ? (
          <MicOff className="h-6 w-6" />
        ) : (
          <Mic className="h-6 w-6" />
        )}
      </Button>
      
      {isListening && (
        <div className="absolute -top-2 -right-2 flex h-6 w-6">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex h-6 w-6 rounded-full bg-red-500"></span>
        </div>
      )}
      
      <div className={cn(
        'absolute bottom-20 right-0 w-64 rounded-lg bg-popover p-4 shadow-lg transition-all duration-300',
        isListening || isProcessing ? 'opacity-100' : 'pointer-events-none opacity-0'
      )}>
        <div className="flex items-center space-x-2">
          <div className="flex-1 space-y-1">
            <p className="text-sm font-medium">
              {isProcessing ? 'Processing...' : 'Listening...'}
            </p>
            <div className="flex space-x-1">
              <div className="h-1 w-1 animate-bounce rounded-full bg-foreground [animation-delay:-0.3s]"></div>
              <div className="h-1 w-1 animate-bounce rounded-full bg-foreground [animation-delay:-0.15s]"></div>
              <div className="h-1 w-1 animate-bounce rounded-full bg-foreground"></div>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6" 
            onClick={stopListening}
          >
            <span className="h-3 w-3 rounded-full bg-red-500"></span>
            <span className="sr-only">Stop</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
