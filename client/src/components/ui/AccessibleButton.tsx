import React, { forwardRef, ButtonHTMLAttributes, Ref } from 'react';
import { motion, MotionProps } from 'framer-motion';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { useI18n } from '@/contexts/I18nContext';
import { cn } from '@/lib/utils';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'link' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface AccessibleButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * The variant of the button
   * @default 'primary'
   */
  variant?: ButtonVariant;
  /**
   * The size of the button
   * @default 'md'
   */
  size?: ButtonSize;
  /**
   * Whether the button should take up the full width of its container
   * @default false
   */
  fullWidth?: boolean;
  /**
   * Whether the button is in a loading state
   * @default false
   */
  loading?: boolean;
  /**
   * The icon to display before the button text
   */
  icon?: React.ReactNode;
  /**
   * The icon to display after the button text
   */
  iconEnd?: React.ReactNode;
  /**
   * Whether to show a loading spinner instead of the icon when loading
   * @default true
   */
  showSpinner?: boolean;
  /**
   * ARIA label for the button (for screen readers)
   */
  'aria-label'?: string;
  /**
   * ARIA controls (for associating with controlled elements)
   */
  'aria-controls'?: string;
  /**
   * ARIA expanded state (for disclosure patterns)
   */
  'aria-expanded'?: boolean;
  /**
   * ARIA pressed state (for toggle buttons)
   */
  'aria-pressed'?: boolean;
  /**
   * Whether the button is currently active
   */
  isActive?: boolean;
  /**
   * Motion props for animations
   */
  motionProps?: MotionProps;
}

/**
 * A highly accessible button component with built-in support for:
 * - Keyboard navigation
 * - Screen readers
 * - Reduced motion preferences
 * - Right-to-left (RTL) languages
 * - Loading states
 * - Icons
 * - Multiple variants and sizes
 */
const AccessibleButton = forwardRef<HTMLButtonElement, AccessibleButtonProps>(
  ({
    children,
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    loading = false,
    disabled = false,
    className = '',
    icon,
    iconEnd,
    showSpinner = true,
    isActive = false,
    motionProps,
    type = 'button',
    ...props
  }, ref: Ref<HTMLButtonElement>) => {
    const { isReducedMotion } = useAccessibility();
    const { isRTL } = useI18n();
    
    const isDisabled = disabled || loading;
    
    // Button size classes
    const sizeClasses = {
      sm: 'px-2.5 py-1.5 text-xs',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base',
    };
    
    // Button variant classes
    const variantClasses = {
      primary: 'bg-primary-600 text-white hover:bg-primary-700 focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
      secondary: 'bg-secondary-600 text-white hover:bg-secondary-700 focus-visible:ring-2 focus-visible:ring-secondary-500 focus-visible:ring-offset-2',
      outline: 'bg-transparent border border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700 focus-visible:ring-2 focus-visible:ring-primary-500',
      ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700 focus-visible:ring-2 focus-visible:ring-primary-500',
      link: 'bg-transparent text-primary-600 hover:text-primary-800 hover:underline dark:text-primary-400 dark:hover:text-primary-300 focus-visible:ring-2 focus-visible:ring-primary-500',
      danger: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2',
    };
    
    // Active state classes
    const activeClasses = isActive ? {
      primary: 'ring-2 ring-offset-2 ring-primary-500',
      secondary: 'ring-2 ring-offset-2 ring-secondary-500',
      outline: 'ring-2 ring-offset-2 ring-primary-500',
      ghost: 'ring-2 ring-offset-2 ring-primary-500',
      link: 'ring-2 ring-offset-2 ring-primary-500',
      danger: 'ring-2 ring-offset-2 ring-red-500',
    }[variant] : '';
    
    // Disabled state classes
    const disabledClasses = isDisabled ? 'opacity-50 cursor-not-allowed' : '';
    
    // Focus ring classes (respects reduced motion)
    const focusRingClasses = isReducedMotion 
      ? 'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500' 
      : 'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary-500';
    
    // RTL support for icons
    const startIcon = isRTL ? iconEnd : icon;
    const endIcon = isRTL ? icon : iconEnd;
    
    // Loading spinner
    const spinner = (
      <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent">
        <span className="sr-only">Loading...</span>
      </span>
    );
    
    // Button content
    const buttonContent = (
      <>
        {loading && showSpinner ? (
          <span className="mr-2">{spinner}</span>
        ) : startIcon ? (
          <span className={cn(children ? 'mr-2' : '')} aria-hidden="true">
            {startIcon}
          </span>
        ) : null}
        
        {children}
        
        {endIcon ? (
          <span className={cn(children ? 'ml-2' : '')} aria-hidden="true">
            {endIcon}
          </span>
        ) : null}
      </>
    );
    
    // Base button props
    const buttonProps = {
      ref,
      type,
      disabled: isDisabled,
      'aria-disabled': isDisabled,
      'aria-busy': loading,
      'data-loading': loading,
      'data-variant': variant,
      'data-size': size,
      className: cn(
        'inline-flex items-center justify-center rounded-md font-medium transition-colors',
        'focus:outline-none',
        'disabled:opacity-50 disabled:pointer-events-none',
        sizeClasses[size],
        variantClasses[variant],
        activeClasses,
        disabledClasses,
        focusRingClasses,
        fullWidth && 'w-full',
        className
      ),
      ...props,
    };
    
    // Render with motion if motion props are provided and reduced motion is not enabled
    if (motionProps && !isReducedMotion) {
      return (
        <motion.button
          whileHover={!isDisabled ? { scale: 1.03 } : {}}
          whileTap={!isDisabled ? { scale: 0.98 } : {}}
          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
          {...motionProps}
          {...buttonProps}
        >
          {buttonContent}
        </motion.button>
      );
    }
    
    // Standard button render
    return (
      <button {...buttonProps}>
        {buttonContent}
      </button>
    );
  }
);

AccessibleButton.displayName = 'AccessibleButton';

export { AccessibleButton };

export type { ButtonVariant, ButtonSize };
