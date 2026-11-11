import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'soft';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-cute-pink-300 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed select-none';

  const sizeStyles = {
    sm: 'text-xs px-3.5 py-1.5 gap-1.5 shadow-sm',
    md: 'text-sm px-5 py-2.5 gap-2 shadow-sm',
    lg: 'text-base px-7 py-3.5 gap-2.5 shadow-md',
  };

  const variantStyles = {
    primary: 'bg-cute-pink hover:bg-cute-pink-200 text-cute-brown shadow-cute border border-cute-pink-200/50 hover:shadow-cute-lg hover:-translate-y-0.5',
    secondary: 'bg-cute-lavender hover:bg-cute-lavender-200 text-cute-brown dark:bg-cute-lavender-dark dark:text-cute-cream dark:hover:bg-cute-lavender-dark/80 border border-cute-border-light dark:border-cute-border-dark',
    outline: 'bg-transparent border-2 border-cute-pink-300 hover:bg-cute-pink/20 text-cute-brown dark:text-cute-brown-dark',
    soft: 'bg-cute-cream hover:bg-cute-peach/40 text-cute-brown dark:bg-cute-surface-dark dark:text-cute-brown-dark border border-cute-border-light dark:border-cute-border-dark',
    ghost: 'bg-transparent hover:bg-cute-pink/30 text-cute-brown dark:text-cute-brown-dark shadow-none',
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-cute-brown" />
      ) : (
        leftIcon
      )}
      <span>{children}</span>
      {!isLoading && rightIcon}
    </button>
  );
};

