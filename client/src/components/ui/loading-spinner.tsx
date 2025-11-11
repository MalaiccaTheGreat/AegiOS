import { motion } from 'framer-motion';
import Image from 'next/image';

export default function LoadingSpinner({ className = '', size = 'md' }: { className?: string; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <motion.div
        animate={{
          rotate: 360,
        }}
        transition={{
          duration: 2,
          ease: 'linear',
          repeat: Infinity,
        }}
        className={`${sizeClasses[size]} relative`}
      >
        <img 
          src="/AegisOS Logo.png" 
          alt="Loading..." 
          className="w-full h-full object-contain"
        />
      </motion.div>
    </div>
  );
}
