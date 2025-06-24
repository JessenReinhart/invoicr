
import React, { ReactNode } from 'react';

interface GradientButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  className?: string;
  variant?: 'primary' | 'secondary';
}

const GradientButton: React.FC<GradientButtonProps> = ({ children, className = '', variant = 'primary', ...props }) => {
  const baseStyles = `
    px-4 py-2 sm:px-5 sm:py-2.5 text-sm font-semibold rounded-md
    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-black
    transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 ease-out
    flex items-center justify-center gap-1.5
  `;

  const primaryStyles = `
    text-white
    bg-gradient-to-r from-pink-500 via-purple-600 to-blue-500
    hover:from-pink-500/90 hover:via-purple-600/90 hover:to-blue-500/90
    focus:ring-purple-500/70
    shadow-md shadow-purple-500/20 hover:shadow-lg hover:shadow-purple-500/30
    dark:shadow-purple-500/10 dark:hover:shadow-purple-500/20
  `;
  
  const secondaryStyles = `
    text-slate-700 dark:text-slate-200
    bg-white dark:bg-slate-800 
    border border-slate-300 dark:border-slate-700
    hover:bg-slate-50 dark:hover:bg-slate-700/80
    focus:ring-purple-500/60 
    shadow-sm hover:shadow-md dark:shadow-slate-900/50
  `;

  const variantStyles = variant === 'primary' ? primaryStyles : secondaryStyles;

  return (
    <button
      className={`${baseStyles} ${variantStyles} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default GradientButton;