
import React from 'react';
import ReactDOM from 'react-dom';
import { useAppContext } from '../store/AppContext';
import Toast from './Toast';

const ToastContainer: React.FC = () => {
  const { toasts, addToast } = useAppContext(); // addToast is not used here but to satisfy context consumption

  // This is a bit of a hack to remove toast directly without waiting for context to update
  // The primary removal logic is in AppContext and Toast component's useEffect
  const handleDismiss = (id: string) => {
    // This function can be used if immediate removal from UI is needed before context state update.
    // However, the current setup relies on AppContext to manage the toasts array.
    // For now, it's a no-op as Toast component handles its own dismissal animation
    // and AppContext handles removing from the list.
  };

  const toastContainerRoot = document.getElementById('toast-container-root');

  if (!toastContainerRoot) {
    console.error("Toast container root element not found in the DOM.");
    return null; 
  }

  return ReactDOM.createPortal(
    <div className="space-y-2">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onDismiss={handleDismiss} />
      ))}
    </div>,
    toastContainerRoot
  );
};

export default ToastContainer;
