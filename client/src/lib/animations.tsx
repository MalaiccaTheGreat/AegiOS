import { motion, AnimatePresence } from 'framer-motion';
import { ReactNode, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

export const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.16, 1, 0.3, 1]
    }
  },
  exit: { 
    opacity: 0, 
    y: -20,
    transition: {
      duration: 0.3,
      ease: [0.7, 0, 0.84, 0]
    }
  }
};

export const fadeIn = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: {
      duration: 0.5,
      ease: [0.16, 1, 0.3, 1]
    }
  },
  exit: { 
    opacity: 0,
    transition: {
      duration: 0.3,
      ease: [0.7, 0, 0.84, 0]
    }
  }
};

export const slideIn = {
  hidden: { opacity: 0, x: 24 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: {
      type: 'spring',
      damping: 25,
      stiffness: 300
    }
  },
  exit: { 
    opacity: 0, 
    x: 24,
    transition: {
      duration: 0.2
    }
  }
};

// Voice Command Animation Components
export const VoiceWave = ({ isListening = false, className = '' }: { isListening?: boolean; className?: string }) => {
  return (
    <div className={cn("flex items-end h-8 gap-1", className)}>
      {[1, 2, 3, 4, 5].map((i) => (
        <motion.span
          key={i}
          className="w-1 bg-primary-500 rounded-full"
          animate={isListening ? 'listening' : 'idle'}
          variants={{
            listening: {
              height: ['20%', `${20 + Math.random() * 80}%`, '20%'],
              transition: {
                duration: 1.5,
                repeat: Infinity,
                repeatType: 'reverse',
                delay: i * 0.1,
                ease: 'easeInOut'
              }
            },
            idle: {
              height: '20%',
              transition: { duration: 0.5 }
            }
          }}
        />
      ))}
    </div>
  );
};

// Data Streaming Visualization
export const DataStream = ({ data, className = '' }: { data: number[]; className?: string }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      setWidth(containerRef.current.offsetWidth);
    }
  }, []);

  const points = data.map((value, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - value; // Invert y-axis
    return `${x}% ${y}%`;
  }).join(',');

  return (
    <div ref={containerRef} className={cn("w-full h-24 relative overflow-hidden", className)}>
      <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <motion.polyline
          fill="none"
          stroke="url(#dataGradient)"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
          points={points}
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.5, ease: 'easeInOut' }}
        />
        <defs>
          <linearGradient id="dataGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
      </svg>
      <motion.div 
        className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-background/80"
        initial={{ x: '-100%' }}
        animate={{ x: '100%' }}
        transition={{ 
          duration: 2, 
          repeat: Infinity, 
          ease: 'linear' 
        }}
      />
    </div>
  );
};

// Business Context Transition
export const BusinessTransition = ({ children, key }: { children: ReactNode; key: string }) => {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={key}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

// AI Processing States
export const AIProcessing = ({ className = '' }: { className?: string }) => {
  return (
    <div className={cn("flex items-center justify-center space-x-2", className)}>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-2 h-2 bg-primary-500 rounded-full"
          animate={{
            y: ['0%', '-50%', '0%'],
            opacity: [0.4, 1, 0.4],
          }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            delay: i * 0.15,
            ease: 'easeInOut'
          }}
        />
      ))}
    </div>
  );
};

// Toast Notification System
type ToastType = 'success' | 'error' | 'info' | 'warning';

type Toast = {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
};

type ToastProps = {
  toast: Toast;
  onDismiss: (id: string) => void;
};

export const Toast = ({ toast, onDismiss }: ToastProps) => {
  const icons = {
    success: '✓',
    error: '✕',
    info: 'i',
    warning: '!'
  };

  const colors = {
    success: 'bg-green-500/10 text-green-500 border-green-500/20',
    error: 'bg-red-500/10 text-red-500 border-red-500/20',
    info: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    warning: 'bg-amber-500/10 text-amber-500 border-amber-500/20'
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 250, transition: { duration: 0.2 } }}
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-lg border backdrop-blur-lg shadow-lg',
        colors[toast.type]
      )}
    >
      <span className="text-lg font-bold">{icons[toast.type]}</span>
      <span className="text-sm">{toast.message}</span>
      <button 
        onClick={() => onDismiss(toast.id)}
        className="ml-2 text-current opacity-50 hover:opacity-100"
      >
        ✕
      </button>
    </motion.div>
  );
};

export const ToastContainer = ({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) => {
  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2 w-80">
      <AnimatePresence>
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onDismiss={onDismiss} />
        ))}
      </AnimatePresence>
    </div>
  );
};

// Page Transition Wrapper
export const PageTransition = ({ children }: { children: ReactNode }) => {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

// Loading Spinner with Particle Effect
export const LoadingSpinner = ({ className = '' }: { className?: string }) => {
  const particles = Array(12).fill(0);
  
  return (
    <div className={cn("relative w-12 h-12", className)}>
      {particles.map((_, i) => (
        <motion.span
          key={i}
          className="absolute w-1.5 h-1.5 bg-primary-500 rounded-full"
          style={{
            left: '50%',
            top: '15%',
            transform: 'translate(-50%, -50%)',
          }}
          animate={{
            rotate: 360,
            x: ['0%', '200%', '0%'],
            y: ['0%', '200%', '0%'],
            opacity: [0.2, 1, 0.2],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: i * 0.1,
            ease: 'easeInOut',
          }}
        />
      ))}
      <motion.div
        className="absolute inset-0 border-2 border-primary-500/30 rounded-full"
        animate={{ rotate: 360 }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
    </div>
  );
};

export const AnimatedText = ({ text, className = '' }: { text: string; className?: string }) => {
  const letters = text.split('');
  
  return (
    <div className={cn("flex", className)}>
      {letters.map((letter, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.5,
            delay: i * 0.03,
            ease: [0.16, 1, 0.3, 1]
          }}
        >
          {letter === ' ' ? '\u00A0' : letter}
        </motion.span>
      ))}
    </div>
  );
};

export const MorphingShapes = ({ className = '' }: { className?: string }) => {
  const shapes = [
    'M0 0h24v24H0z',
    'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5',
    'M12 2a10 10 0 100 20 10 10 0 000-20zm0 18a8 8 0 110-16 8 8 0 010 16z',
    'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z',
  ];
  
  const [currentShape, setCurrentShape] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentShape((prev) => (prev + 1) % shapes.length);
    }, 2000);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className={cn("w-12 h-12", className)}>
      <motion.svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full text-primary-500"
      >
        <motion.path
          d={shapes[currentShape]}
          initial={false}
          animate={{ d: shapes[currentShape] }}
          transition={{
            duration: 0.8,
            ease: [0.16, 1, 0.3, 1]
          }}
          fill="currentColor"
        />
      </motion.svg>
    </div>
  );
};
