import { motion } from 'framer-motion';
import Image from 'next/image';

type LoadingSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface LoadingSpinnerProps {
  size?: LoadingSize;
  className?: string;
  withText?: boolean;
  text?: string;
}

const sizeMap = {
  xs: 'h-6 w-6',
  sm: 'h-8 w-8',
  md: 'h-12 w-12',
  lg: 'h-16 w-16',
  xl: 'h-20 w-20',
};

const textSizeMap = {
  xs: 'text-xs',
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
};

export function LoadingSpinner({
  size = 'md',
  className = '',
  withText = false,
  text = 'Loading...',
}: LoadingSpinnerProps) {
  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <motion.div
        className={`${sizeMap[size]} relative`}
        animate={{
          rotate: 360,
          scale: [1, 1.1, 1],
        }}
        transition={{
          rotate: {
            duration: 2,
            ease: 'linear',
            repeat: Infinity,
          },
          scale: {
            duration: 1.5,
            ease: 'easeInOut',
            repeat: Infinity,
            repeatType: 'reverse',
          },
        }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            className="absolute inset-0 bg-blue-100 rounded-full opacity-20"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{
              duration: 2,
              ease: 'easeInOut',
              repeat: Infinity,
              repeatType: 'reverse',
            }}
          />
        </div>
        <div className="relative z-10 w-full h-full flex items-center justify-center">
          <img 
            src="/AegisOS Logo.png" 
            alt="Loading..." 
            className="w-3/4 h-3/4 object-contain"
          />
        </div>
      </motion.div>
      
      {withText && (
        <motion.span 
          className={`mt-3 text-gray-600 font-medium ${textSizeMap[size]}`}
          animate={{
            opacity: [0.6, 1, 0.6],
          }}
          transition={{
            duration: 2,
            ease: 'easeInOut',
            repeat: Infinity,
            repeatType: 'reverse',
          }}
        >
          {text}
        </motion.span>
      )}
    </div>
  );
}

export function PageLoader({ className = '' }: { className?: string }) {
  return (
    <div className={`min-h-screen flex items-center justify-center bg-gray-50 ${className}`}>
      <LoadingSpinner size="lg" withText text="Loading AegisOS..." />
    </div>
  );
}

export function ButtonLoader({ size = 'sm' }: { size?: 'sm' | 'md' | 'lg' }) {
  const loaderSize = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  }[size];

  return (
    <motion.span
      className={`inline-block ${loaderSize}`}
      animate={{ rotate: 360 }}
      transition={{ duration: 1, ease: 'linear', repeat: Infinity }}
    >
      <img 
        src="/AegisOS Logo.png" 
        alt="Loading..." 
        className="w-full h-full object-contain"
      />
    </motion.span>
  );
}

export function SkeletonLoader({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse ${className}`}>
      <div className="bg-gray-200 rounded-lg h-full w-full"></div>
    </div>
  );
}
