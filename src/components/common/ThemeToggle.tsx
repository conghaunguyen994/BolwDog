import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { toggleTheme } from '../../features/theme/themeSlice';

export const ThemeToggle: React.FC<{ className?: string }> = ({ className = '' }) => {
  const dispatch = useAppDispatch();
  const mode = useAppSelector((state) => state.theme.mode);

  return (
    <button
      onClick={() => dispatch(toggleTheme())}
      aria-label="Chuyển chế độ giao diện"
      title={mode === 'light' ? 'Bật giao diện ban đêm ấm cúng' : 'Bật giao diện ban ngày tươi sáng'}
      className={`relative p-2.5 rounded-full bg-cute-cream dark:bg-cute-surface-dark border border-cute-border-light dark:border-cute-border-dark text-cute-brown dark:text-cute-cream hover:bg-cute-pink/40 dark:hover:bg-cute-lavender-dark transition-all duration-300 shadow-sm active:scale-95 ${className}`}
    >
      {mode === 'light' ? (
        <Sun className="w-5 h-5 text-amber-500 animate-spin-slow transition-transform" />
      ) : (
        <Moon className="w-5 h-5 text-cute-pink-200 transition-transform" />
      )}
    </button>
  );
};

