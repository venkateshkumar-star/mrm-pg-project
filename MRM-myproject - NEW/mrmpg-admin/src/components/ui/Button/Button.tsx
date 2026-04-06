import React, { forwardRef, useState } from 'react';
import './Button.scss';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success' | 'transparent';
  size?: 'small' | 'medium' | 'large' | 'xl';
  fullWidth?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onHover?: {
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
  };
  iconOnlyOnMobile?: boolean;
  className?: string;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  children,
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  loading = false,
  leftIcon,
  rightIcon,
  onHover,
  iconOnlyOnMobile = false,
  className = '',
  disabled = false,
  type = 'button',
  ...props
}, ref) => {
  const [isHovered, setIsHovered] = useState(false);

  const buttonClasses = [
    'btn',
    `btn--${variant}`,
    `btn--${size}`,
    fullWidth && 'btn--full-width',
    loading && 'btn--loading',
    disabled && 'btn--disabled',
    (leftIcon || (onHover?.leftIcon && isHovered)) && 'btn--with-left-icon',
    (rightIcon || (onHover?.rightIcon && isHovered)) && 'btn--with-right-icon',
    onHover && 'btn--has-hover-icons',
    iconOnlyOnMobile && 'btn--icon-only-mobile',
    className
  ].filter(Boolean).join(' ');

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  // Determine which icons to show
  const displayLeftIcon = isHovered && onHover?.leftIcon ? onHover.leftIcon : leftIcon;
  const displayRightIcon = isHovered && onHover?.rightIcon ? onHover.rightIcon : rightIcon;
  
  // Always show icon containers if onHover is provided to maintain consistent width
  const showLeftIconContainer = leftIcon || onHover?.leftIcon;
  const showRightIconContainer = rightIcon || onHover?.rightIcon;

  return (
    <button
      ref={ref}
      type={type}
      className={buttonClasses}
      disabled={disabled || loading}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      aria-label={iconOnlyOnMobile ? String(children) : undefined}
      {...props}
    >
      {loading && (
        <div className="btn__spinner">
          <div className="btn__spinner-circle"></div>
        </div>
      )}
      
      {showLeftIconContainer && !loading && (
        <span className="btn__icon btn__icon--left">
          {displayLeftIcon}
        </span>
      )}
      
      <span className="btn__text">
        {children}
      </span>
      
      {showRightIconContainer && !loading && (
        <span className="btn__icon btn__icon--right">
          {displayRightIcon}
        </span>
      )}
    </button>
  );
});

Button.displayName = 'Button';

export default Button;