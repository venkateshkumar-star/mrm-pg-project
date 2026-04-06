import React from 'react';
import './label.scss';

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  children: React.ReactNode;
  htmlFor?: string;
  required?: boolean;
  size?: 'small' | 'medium' | 'large';
  variant?: 'default' | 'primary' | 'secondary' | 'danger';
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  className?: string;
  disabled?: boolean;
}

const Label: React.FC<LabelProps> = ({
  children,
  htmlFor,
  required = false,
  size = 'medium',
  variant = 'default',
  weight = 'medium',
  className = '',
  disabled = false,
  ...props
}) => {
  const labelClasses = [
    'label',
    `label--${size}`,
    `label--${variant}`,
    `label--${weight}`,
    disabled && 'label--disabled',
    className
  ].filter(Boolean).join(' ');

  return (
    <label
      htmlFor={htmlFor}
      className={labelClasses}
      {...props}
    >
      {children}
      {required && <span className="label__required">*</span>}
    </label>
  );
};

export default Label;