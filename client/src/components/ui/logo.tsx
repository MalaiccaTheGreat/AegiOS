import React from 'react';
import { Link } from 'wouter';
import { motion } from 'framer-motion';

interface LogoProps {
  className?: string;
  withText?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  isAnimated?: boolean;
  onClick?: () => void;
}

export const Logo = ({ 
  className = '', 
  withText = true, 
  size = 'md',
  isAnimated = false,
  onClick
}: LogoProps) => {
  const sizeClasses = {
    xs: 'h-6 w-6',
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
    xl: 'h-20 w-20',
  };

  const textSizes = {
    xs: 'text-base',
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
    xl: 'text-4xl',
  };

  const Wrapper = onClick ? 'button' : Link;
  const wrapperProps = {
    className: `flex items-center gap-3 ${className} ${onClick ? 'focus:outline-none' : ''}`,
    ...(onClick ? { onClick, type: 'button' } : { href: '/' })
  };

  return (
    <Wrapper {...wrapperProps}>
      <div className={`${sizeClasses[size]} flex items-center justify-center`}>
        <motion.div
          animate={isAnimated ? {
            scale: [1, 1.1, 1],
            rotate: [0, 10, -10, 0],
          } : {}}
          transition={isAnimated ? {
            duration: 2,
            ease: "easeInOut",
            times: [0, 0.2, 0.5, 0.8, 1],
            repeat: Infinity,
            repeatType: "loop"
          } : {}}
          className="relative"
        >
          <img 
            src="/AegisOS Logo.png" 
            alt="AegisOS Logo" 
            className="w-full h-full object-contain"
          />
        </motion.div>
      </div>
      {withText && (
        <h1 className={`font-bold ${textSizes[size]} bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent`}>
          AegisOS
        </h1>
      )}
    </Wrapper>
  );
};

export default Logo;
