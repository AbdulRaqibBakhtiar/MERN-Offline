import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

export default function Toast({ message, type = 'success', onClose, duration = 3500 }) {
  useEffect(() => {
    if (!message || !duration || type === 'error') return undefined;
    const timer = window.setTimeout(onClose, duration);
    return () => window.clearTimeout(timer);
  }, [message, type, duration, onClose]);

  if (!message) return null;
  const Icon = type === 'error' ? AlertCircle : type === 'info' ? Info : CheckCircle2;

  return ReactDOM.createPortal(
    <div className={`app-toast app-toast-${type}`} role={type === 'error' ? 'alert' : 'status'} aria-live={type === 'error' ? 'assertive' : 'polite'}>
      <Icon size={19} aria-hidden="true" />
      <span>{message}</span>
      <button type="button" onClick={onClose} aria-label="Dismiss notification"><X size={16} /></button>
    </div>,
    document.body
  );
}
