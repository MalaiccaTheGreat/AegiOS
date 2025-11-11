import React, { forwardRef, InputHTMLAttributes, Ref, useState, useEffect } from 'react';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { useI18n } from '@/contexts/I18nContext';
import { cn } from '@/lib/utils';

type InputVariant = 'default' | 'filled' | 'outline' | 'ghost';
type InputSize = 'sm' | 'md' | 'lg';

interface AccessibleInputProps extends InputHTMLAttributes<HTMLInputElement> {
  /**
   * The variant of the input
   * @default 'default'
   */
  variant?: InputVariant;
  /**
   * The size of the input
   * @default 'md'
   */
  size?: InputSize;
  /**
   * The label for the input (required for accessibility)
   */
  label: string;
  /**
   * Helper text to display below the input
   */
  helperText?: string;
  /**
   * Error message to display when there's a validation error
   */
  error?: string;
  /**
   * Whether the input is required
   * @default false
   */
  required?: boolean;
  /**
   * Whether the input is disabled
   * @default false
   */
  disabled?: boolean;
  /**
   * Whether the input is read-only
   * @default false
   */
  readOnly?: boolean;
  /**
   * Whether to show a character counter
   * @default false
   */
  showCounter?: boolean;
  /**
   * Maximum length of the input
   */
  maxLength?: number;
  /**
   * Icon to display at the start of the input
   */
  startIcon?: React.ReactNode;
  /**
   * Icon to display at the end of the input
   */
  endIcon?: React.ReactNode;
  /**
   * Additional class name for the input container
   */
  containerClassName?: string;
  /**
   * Additional class name for the label
   */
  labelClassName?: string;
  /**
   * Additional class name for the input
   */
  inputClassName?: string;
  /**
   * Additional class name for the helper text
   */
  helperTextClassName?: string;
  /**
   * Additional class name for the error message
   */
  errorClassName?: string;
  /**
   * Whether to show the required asterisk
   * @default true
   */
  showRequiredAsterisk?: boolean;
  /**
   * Whether to show the label
   * @default true
   */
  showLabel?: boolean;
  /**
   * Whether to show the label as a placeholder when the input is empty and not focused
   * @default false
   */
  floatingLabel?: boolean;
  /**
   * Whether to show a clear button when the input has a value
   * @default false
   */
  clearable?: boolean;
  /**
   * Callback when the clear button is clicked
   */
  onClear?: () => void;
  /**
   * Whether to show a password toggle button for password inputs
   * @default false
   */
  showPasswordToggle?: boolean;
  /**
   * Whether to show a loading state
   * @default false
   */
  loading?: boolean;
  /**
   * Loading indicator to show when loading is true
   */
  loadingIndicator?: React.ReactNode;
}

/**
 * An accessible input component with built-in support for:
 * - Labels and descriptions
 * - Error states
 * - Required fields
 * - Helper text
 * - Character counting
 * - Icons
 * - Loading states
 * - Password visibility toggle
 * - Right-to-left (RTL) languages
 * - Keyboard navigation
 */
const AccessibleInput = forwardRef<HTMLInputElement, AccessibleInputProps>(
  ({
    id,
    name,
    type = 'text',
    variant = 'default',
    size = 'md',
    label,
    helperText,
    error,
    required = false,
    disabled = false,
    readOnly = false,
    showCounter = false,
    maxLength,
    startIcon,
    endIcon,
    className = '',
    containerClassName = '',
    labelClassName = '',
    inputClassName = '',
    helperTextClassName = '',
    errorClassName = '',
    showRequiredAsterisk = true,
    showLabel = true,
    floatingLabel = false,
    clearable = false,
    onClear,
    showPasswordToggle = type === 'password',
    loading = false,
    loadingIndicator,
    value,
    onChange,
    onFocus,
    onBlur,
    ...props
  }, ref: Ref<HTMLInputElement>) => {
    const { isHighContrast, isReducedMotion } = useAccessibility();
    const { isRTL } = useI18n();
    
    const [isFocused, setIsFocused] = useState(false);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [inputValue, setInputValue] = useState(value || '');
    const [isTouched, setIsTouched] = useState(false);
    
    const inputId = id || `input-${name || Math.random().toString(36).substr(2, 9)}`;
    const hasError = !!error;
    const showClearButton = clearable && !readOnly && !disabled && inputValue && !loading;
    const showPasswordButton = showPasswordToggle && type === 'password' && !readOnly && !disabled;
    const showEndAdornment = showClearButton || showPasswordButton || loading || endIcon;
    const showFloatingLabel = floatingLabel && (!inputValue || isFocused);
    
    // Update internal value when external value changes
    useEffect(() => {
      if (value !== undefined) {
        setInputValue(value);
      }
    }, [value]);
    
    // Handle input change
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (onChange) {
        onChange(e);
      }
      if (value === undefined) {
        setInputValue(e.target.value);
      }
    };
    
    // Handle focus
    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      if (onFocus) onFocus(e);
    };
    
    // Handle blur
    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      setIsTouched(true);
      if (onBlur) onBlur(e);
    };
    
    // Handle clear button click
    const handleClear = () => {
      if (onClear) {
        onClear();
      } else if (onChange) {
        const event = { 
          target: { 
            name: name || '', 
            value: '' 
          },
          currentTarget: { 
            name: name || '', 
            value: '' 
          }
        } as React.ChangeEvent<HTMLInputElement>;
        
        onChange(event);
      }
      
      if (value === undefined) {
        setInputValue('');
      }
      
      // Focus the input after clearing
      const input = document.getElementById(inputId) as HTMLInputElement;
      if (input) {
        setTimeout(() => input.focus(), 0);
      }
    };
    
    // Toggle password visibility
    const togglePasswordVisibility = () => {
      setIsPasswordVisible(!isPasswordVisible);
    };
    
    // Input size classes
    const sizeClasses = {
      sm: 'h-8 px-2.5 text-sm',
      md: 'h-10 px-3 text-base',
      lg: 'h-12 px-4 text-lg',
    };
    
    // Input variant classes
    const variantClasses = {
      default: 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600',
      filled: 'bg-gray-50 dark:bg-gray-700 border border-transparent',
      outline: 'bg-transparent border-2 border-gray-300 dark:border-gray-600',
      ghost: 'bg-transparent border-b-2 border-gray-300 dark:border-gray-600 rounded-none',
    };
    
    // Focus state classes
    const focusClasses = isHighContrast
      ? 'focus:ring-2 focus:ring-offset-2 focus:ring-primary-600 dark:focus:ring-primary-400'
      : isReducedMotion
      ? 'focus:ring-1 focus:ring-primary-500 dark:focus:ring-primary-400'
      : 'focus:ring-1 focus:ring-primary-500 dark:focus:ring-primary-400 focus:ring-opacity-50';
    
    // Error state classes
    const errorClasses = hasError
      ? 'border-red-500 dark:border-red-400 ring-1 ring-red-500 dark:ring-red-400'
      : '';
    
    // Disabled state classes
    const disabledClasses = disabled
      ? 'opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-800'
      : '';
    
    // Read-only state classes
    const readOnlyClasses = readOnly
      ? 'bg-gray-50 dark:bg-gray-800 cursor-default'
      : '';
    
    // Floating label classes
    const floatingLabelClasses = floatingLabel
      ? 'pt-4 placeholder-transparent'
      : '';
    
    // RTL support
    const startAdornment = isRTL ? endIcon : startIcon;
    const endAdornment = isRTL ? startIcon : endIcon;
    
    return (
      <div className={cn('w-full space-y-1', containerClassName)}>
        {/* Label */}
        {showLabel && !floatingLabel && (
          <label
            htmlFor={inputId}
            className={cn(
              'block text-sm font-medium text-gray-700 dark:text-gray-300',
              { 'sr-only': !showLabel },
              labelClassName
            )}
          >
            {label}
            {required && showRequiredAsterisk && (
              <span className="text-red-500 dark:text-red-400 ml-1">*</span>
            )}
          </label>
        )}
        
        <div className="relative">
          {/* Input container */}
          <div
            className={cn(
              'flex items-center w-full rounded-md transition-colors',
              variantClasses[variant],
              focusClasses,
              errorClasses,
              disabledClasses,
              readOnlyClasses,
              {
                'ring-2 ring-offset-1 ring-primary-500 dark:ring-primary-400': isFocused && !isReducedMotion,
                'ring-1 ring-offset-1 ring-primary-500 dark:ring-primary-400': isFocused && isReducedMotion,
                'pr-10': showEndAdornment,
                'pl-10': startIcon,
                'opacity-70': loading,
              },
              className
            )}
          >
            {/* Start icon */}
            {startAdornment && (
              <div className={cn(
                'absolute inset-y-0 flex items-center pointer-events-none',
                isRTL ? 'right-0 pr-3' : 'left-0 pl-3'
              )}>
                {startAdornment}
              </div>
            )}
            
            {/* Input */}
            <input
              ref={ref}
              id={inputId}
              name={name}
              type={type === 'password' && isPasswordVisible ? 'text' : type}
              value={inputValue}
              onChange={handleChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              disabled={disabled || loading}
              readOnly={readOnly}
              maxLength={maxLength}
              required={required}
              aria-invalid={hasError ? 'true' : 'false'}
              aria-describedby={
                [
                  helperText ? `${inputId}-helper` : undefined,
                  hasError ? `${inputId}-error` : undefined,
                ]
                  .filter(Boolean)
                  .join(' ') || undefined
              }
              aria-required={required}
              className={cn(
                'w-full h-full bg-transparent border-0 focus:ring-0 focus:outline-none',
                'text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                floatingLabelClasses,
                sizeClasses[size],
                {
                  'pl-10': startIcon && !isRTL,
                  'pr-10': endIcon && !isRTL,
                  'pr-24': (showClearButton || showPasswordButton) && !isRTL,
                  'pl-24': (showClearButton || showPasswordButton) && isRTL,
                },
                inputClassName
              )}
              placeholder={floatingLabel && !isFocused ? ' ' : undefined}
              {...props}
            />
            
            {/* Floating label */}
            {floatingLabel && (
              <label
                htmlFor={inputId}
                className={cn(
                  'absolute left-3 transition-all duration-200 pointer-events-none',
                  'text-gray-500 dark:text-gray-400',
                  {
                    'top-1 text-xs': isFocused || inputValue,
                    'top-1/2 -translate-y-1/2 text-base': !isFocused && !inputValue,
                    'text-primary-600 dark:text-primary-400': isFocused,
                    'text-red-500 dark:text-red-400': hasError,
                  },
                  labelClassName
                )}
              >
                {label}
                {required && showRequiredAsterisk && (
                  <span className="text-red-500 dark:text-red-400 ml-1">*</span>
                )}
              </label>
            )}
            
            {/* End adornments */}
            <div className={cn(
              'absolute inset-y-0 flex items-center',
              isRTL ? 'left-0 pl-3' : 'right-0 pr-3'
            )}>
              {/* Loading indicator */}
              {loading && (
                <div className="flex items-center justify-center">
                  {loadingIndicator || (
                    <div className="w-4 h-4 border-2 border-gray-300 border-t-primary-500 rounded-full animate-spin" />
                  )}
                </div>
              )}
              
              {/* Clear button */}
              {showClearButton && !loading && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400 focus:outline-none"
                  aria-label="Clear input"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
              
              {/* Password visibility toggle */}
              {showPasswordButton && !loading && (
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400 focus:outline-none"
                  aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
                >
                  {isPasswordVisible ? (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              )}
              
              {/* End icon */}
              {endAdornment && !loading && !showClearButton && !showPasswordButton && (
                <div className="text-gray-400 dark:text-gray-500">
                  {endAdornment}
                </div>
              )}
            </div>
          </div>
          
          {/* Character counter */}
          {showCounter && maxLength && (
            <div className="text-xs text-right text-gray-500 dark:text-gray-400">
              {String(inputValue).length}/{maxLength}
            </div>
          )}
          
          {/* Helper text */}
          {helperText && !hasError && (
            <p 
              id={`${inputId}-helper`} 
              className={cn(
                'mt-1 text-sm text-gray-500 dark:text-gray-400',
                helperTextClassName
              )}
            >
              {helperText}
            </p>
          )}
          
          {/* Error message */}
          {hasError && (
            <p 
              id={`${inputId}-error`} 
              className={cn(
                'mt-1 text-sm text-red-600 dark:text-red-400',
                errorClassName
              )}
              role="alert"
            >
              {error}
            </p>
          )}
        </div>
      </div>
    );
  }
);

AccessibleInput.displayName = 'AccessibleInput';

export { AccessibleInput };

export type { InputVariant, InputSize };
