
import React, { ReactNode } from 'react';

interface GradientButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  className?: string;
  variant?: 'primary' | 'secondary';
}

const GradientButton: React.FC<GradientButtonProps> = ({ children, className = '', variant = 'primary', ...props }) => {
  const baseStyles = `
    px-4 py-2.5 sm:px-5 text-sm font-semibold rounded-xl
    focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-black
    active:translate-y-px transition-all duration-150 ease-out
    disabled:opacity-40 disabled:pointer-events-none
    flex items-center justify-center gap-1.5
  `;

  const primaryStyles = `
    text-white bg-slate-950 dark:bg-white dark:text-slate-950
    border border-slate-950 dark:border-white
    hover:bg-red-600 hover:border-red-600 dark:hover:bg-red-500 dark:hover:border-red-500 dark:hover:text-white
    shadow-[0_1px_2px_rgba(0,0,0,0.08),0_8px_24px_rgba(15,23,42,0.08)]
  `;

  const secondaryStyles = `
    text-slate-700 dark:text-slate-200
    bg-white/80 dark:bg-white/[0.04]
    border border-slate-200 dark:border-white/10
    hover:bg-slate-50 hover:border-slate-300 dark:hover:bg-white/[0.08] dark:hover:border-white/20
    shadow-sm
  `;

  const variantStyles = variant === 'primary' ? primaryStyles : secondaryStyles;

  return (
    <button className={`${baseStyles} ${variantStyles} ${className}`} {...props}>
      {children}
    </button>
  );
};

export default GradientButton;