import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import './ToastContext.css';

const ToastContext = createContext(null);
let toastId = 0;

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((message, options = {}) => {
    const id = ++toastId;
    const toast = {
      id,
      message,
      type: options.type || 'success',
      title: options.title || (options.type === 'error' ? 'Something went wrong' : 'TrueGoods'),
    };
    setToasts((current) => [...current.slice(-2), toast]);
    window.setTimeout(() => dismiss(id), options.duration || 3200);
    return id;
  }, [dismiss]);

  const value = useMemo(() => ({ showToast, dismiss }), [showToast, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-viewport" aria-live="polite" aria-atomic="true">
        {toasts.map((toast) => (
          <div className={`tg-toast tg-toast-${toast.type}`} key={toast.id} role="status">
            <span className="tg-toast-icon">{toast.type === 'error' ? '!' : toast.type === 'info' ? 'i' : '✓'}</span>
            <div><strong>{toast.title}</strong><p>{toast.message}</p></div>
            <button type="button" onClick={() => dismiss(toast.id)} aria-label="Dismiss notification">×</button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const value = useContext(ToastContext);
  if (!value) throw new Error('useToast must be used inside ToastProvider');
  return value;
};
