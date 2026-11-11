import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'pink' | 'lavender' | 'peach' | 'cream' | 'success' | 'warning';
  className?: string;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'pink',
  className = '',
  size = 'md',
}) => {
  const variantStyles = {
    pink: 'bg-cute-pink/60 text-cute-brown dark:bg-cute-pink-dark/30 dark:text-cute-pink-100 border border-cute-pink/40',
    lavender: 'bg-cute-lavender/60 text-cute-brown dark:bg-cute-lavender-dark/40 dark:text-cute-lavender-100 border border-cute-lavender/40',
    peach: 'bg-cute-peach/70 text-cute-brown dark:bg-cute-peach-dark/40 dark:text-cute-peach-100 border border-cute-peach/40',
    cream: 'bg-cute-cream text-cute-brown dark:bg-cute-surface-dark dark:text-cute-brown-dark border border-cute-border-light dark:border-cute-border-dark',
    success: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800',
    warning: 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800',
  };

  const sizeStyles = {
    sm: 'text-[11px] px-2.5 py-0.5',
    md: 'text-xs px-3 py-1',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {children}
    </span>
  );
};

