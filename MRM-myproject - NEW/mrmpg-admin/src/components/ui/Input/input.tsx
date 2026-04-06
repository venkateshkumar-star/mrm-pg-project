import React, { forwardRef } from 'react';
import './input.scss';

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  helperText?: string;
  size?: 'small' | 'medium' | 'large';
  variant?: 'default' | 'filled' | 'outlined';
  state?: 'default' | 'success' | 'warning' | 'error';
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  loading?: boolean;
  className?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  helperText,
  size = 'medium',
  variant = 'default',
  state = 'default',
  leftIcon,
  rightIcon,
  fullWidth = false,
  loading = false,
  className = '',
  disabled = false,
  type = 'text',
  id,
  ...props
}, ref) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  
  const containerClasses = [
    'input-container',
    fullWidth && 'input-container--full-width',
    className
  ].filter(Boolean).join(' ');

  const wrapperClasses = [
    'input-wrapper',
    `input-wrapper--${size}`,
    `input-wrapper--${variant}`,
    `input-wrapper--${error ? 'error' : state}`,
    disabled && 'input-wrapper--disabled',
    loading && 'input-wrapper--loading',
    leftIcon && 'input-wrapper--with-left-icon',
    rightIcon && 'input-wrapper--with-right-icon'
  ].filter(Boolean).join(' ');

  const inputClasses = [
    'input',
    `input--${size}`,
    leftIcon && 'input--with-left-icon',
    rightIcon && 'input--with-right-icon'
  ].filter(Boolean).join(' ');

  return (
    <div className={containerClasses}>
      {label && (
        <label htmlFor={inputId} className="input-label">
          {label}
        </label>
      )}
      
      <div className={wrapperClasses}>
        {leftIcon && (
          <div className="input-icon input-icon--left">
            {leftIcon}
          </div>
        )}
        
        <input
          ref={ref}
          id={inputId}
          type={type}
          className={inputClasses}
          disabled={disabled || loading}
          {...props}
        />
        
        {loading && (
          <div className="input-icon input-icon--right">
            <div className="input-spinner"></div>
          </div>
        )}
        
        {rightIcon && !loading && (
          <div className="input-icon input-icon--right">
            {rightIcon}
          </div>
        )}
      </div>
      
      {(error || helperText) && (
        <div className={`input-text ${error ? 'input-text--error' : 'input-text--helper'}`}>
          {error || helperText}
        </div>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;