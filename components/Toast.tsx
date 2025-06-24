
import React, { useEffect, useState } from 'react';
import { ToastMessage } from '../types';
import XIcon from './icons/XIcon';
import PlusIcon from './icons/PlusIcon'; // Using Plus for success, adjust if needed

interface ToastProps {
  toast: ToastMessage;
  onDismiss: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ toast, onDismiss }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true); // Trigger enter animation
    const timer = setTimeout(() => {
      setIsVisible(false); // Trigger exit animation
      setTimeout(() => onDismiss(toast.id), 300); // Wait for animation before removing
    }, 3700); // Slightly less than context removal to allow animation

    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const baseClasses = "relative flex items-center w-full max-w-xs p-4 mb-4 text-slate-500 bg-white rounded-lg shadow-xl dark:text-slate-400 dark:bg-slate-800 transition-all duration-300 ease-in-out";
  const visibilityClasses = isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-full";

  const typeStyles = {
    success: "text-green-500 dark:text-green-400 bg-green-100 dark:bg-green-800/50",
    error: "text-red-500 dark:text-red-400 bg-red-100 dark:bg-red-800/50",
    info: "text-blue-500 dark:text-blue-400 bg-blue-100 dark:bg-blue-800/50",
    warning: "text-yellow-500 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-800/50",
  };

  const Icon = () => {
    // A simple icon based on type - can be expanded with dedicated icons
    switch (toast.type) {
      case 'success': return <div className={`inline-flex items-center justify-center flex-shrink-0 w-8 h-8 ${typeStyles.success} rounded-lg`}><PlusIcon className="w-5 h-5"/></div>;
      case 'error': return <div className={`inline-flex items-center justify-center flex-shrink-0 w-8 h-8 ${typeStyles.error} rounded-lg`}><XIcon className="w-5 h-5"/></div>;
      case 'info': return <div className={`inline-flex items-center justify-center flex-shrink-0 w-8 h-8 ${typeStyles.info} rounded-lg`}><PlusIcon className="w-5 h-5"/></div>; // Placeholder
      case 'warning': return <div className={`inline-flex items-center justify-center flex-shrink-0 w-8 h-8 ${typeStyles.warning} rounded-lg`}><PlusIcon className="w-5 h-5"/></div>; // Placeholder
      default: return null;
    }
  };


  return (
    <div
      role="alert"
      className={`${baseClasses} ${visibilityClasses}`}
    >
      <Icon />
      <div className="ml-3 text-sm font-normal text-slate-700 dark:text-slate-200">{toast.message}</div>
      <button
        type="button"
        className="ml-auto -mx-1.5 -my-1.5 bg-white text-slate-400 hover:text-slate-900 rounded-lg focus:ring-2 focus:ring-slate-300 p-1.5 hover:bg-slate-100 inline-flex h-8 w-8 dark:text-slate-500 dark:hover:text-white dark:bg-slate-800 dark:hover:bg-slate-700"
        onClick={() => {
            setIsVisible(false);
            setTimeout(() => onDismiss(toast.id), 300);
        }}
        aria-label="Close"
      >
        <span className="sr-only">Close</span>
        <XIcon className="w-5 h-5" />
      </button>
    </div>
  );
};

export default Toast;
