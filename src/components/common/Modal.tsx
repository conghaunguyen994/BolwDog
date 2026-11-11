import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'md',
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-cute-brown/30 dark:bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog Card */}
      <div
        className={`relative w-full ${maxWidthClasses[maxWidth]} bg-white dark:bg-cute-surface-dark border border-cute-border-light dark:border-cute-border-dark rounded-3xl p-6 sm:p-7 shadow-cute-lg dark:shadow-cute-dark z-10 transition-all transform animate-in fade-in zoom-in-95 duration-200`}
      >
        <div className="flex items-center justify-between pb-4 border-b border-cute-border-light dark:border-cute-border-dark mb-5">
          {title && (
            <h3 className="text-xl font-bold text-cute-brown dark:text-cute-cream flex items-center gap-2">
              <span className="text-cute-pink-400">🐾</span> {title}
            </h3>
          )}
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-cute-brown-light dark:text-cute-muted hover:bg-cute-pink/30 hover:text-cute-brown transition-colors ml-auto"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="max-h-[80vh] overflow-y-auto pr-1">
          {children}
        </div>
      </div>
    </div>
  );
};

