'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X, MessageSquare, Sparkles } from 'lucide-react';
import VirtualAssistant from './VirtualAssistant';
import { Button } from '@/components/ui/button';

export default function FloatingAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Only render on client to avoid hydration issues
  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="absolute bottom-20 right-0 w-80 h-[500px]"
          >
            <VirtualAssistant
              onClose={() => setIsOpen(false)}
              width="100%"
              height="100%"
              showHeader={true}
              showCloseButton={true}
              title="Aegis Assistant"
              subtitle="How can I help you today?"
            />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        className="relative"
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
      >
        {/* Floating action button */}
        <motion.button
          className={cn(
            'w-16 h-16 rounded-full flex items-center justify-center shadow-xl',
            'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary/50',
            isOpen 
              ? 'bg-gradient-to-br from-red-500 to-red-600' 
              : 'bg-gradient-to-br from-primary to-blue-600 hover:from-blue-700 hover:to-blue-600',
            'transition-all duration-300',
            'relative overflow-hidden'
          )}
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? 'Close Assistant' : 'Open Assistant'}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {/* Animated background effect */}
          <motion.div 
            className="absolute inset-0 rounded-full bg-white/20"
            animate={{
              scale: isHovered ? 1.5 : 1,
              opacity: isHovered ? 0 : 0.4,
            }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
          
          {/* Main icon */}
          <motion.div
            animate={{
              y: isOpen ? 0 : [0, -5, 0],
            }}
            transition={{
              duration: 2,
              repeat: isOpen ? 0 : Infinity,
              ease: 'easeInOut',
            }}
          >
            {isOpen ? (
              <X className="h-6 w-6 text-white" />
            ) : (
              <div className="relative">
                <Bot className="h-6 w-6 text-white" />
                <motion.span 
                  className="absolute -top-1 -right-1 h-3 w-3 bg-green-400 rounded-full border-2 border-white"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.8, 1, 0.8],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    repeatType: 'reverse',
                  }}
                />
              </div>
            )}
          </motion.div>

          {/* Pulsing ring effect */}
          {!isOpen && (
            <motion.span
              className="absolute inset-0 rounded-full border-2 border-primary/30"
              animate={{
                scale: [1, 1.4, 1],
                opacity: [0.4, 0, 0.4],
              }}
              transition={{
                duration: 2,
                ease: 'easeInOut',
                repeat: Infinity,
                repeatType: 'reverse',
              }}
            />
          )}
        </motion.button>

        {/* Tooltip */}
        <AnimatePresence>
          {!isOpen && isHovered && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="absolute right-20 top-1/2 transform -translate-y-1/2 bg-white shadow-lg rounded-lg px-4 py-2 whitespace-nowrap"
            >
              <div className="flex items-center">
                <Sparkles className="h-4 w-4 text-yellow-500 mr-2" />
                <span className="text-sm font-medium text-gray-800">Need help? Ask me!</span>
              </div>
              <div className="absolute right-0 top-1/2 w-2 h-2 transform translate-x-1/2 -translate-y-1/2 rotate-45 bg-white" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

// Helper function to merge class names
function cn(...classes: (string | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
