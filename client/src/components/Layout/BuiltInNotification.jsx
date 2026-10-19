import React, { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

export const BuiltInNotification = ({ visible, message, type, onClose, duration = 3000 }) => {
  const [renderState, setRenderState] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    if (visible) {
      setRenderState(true);
      setIsFadingOut(false);
    } else if (renderState) {
      // Trigger fade out visual sequence before unmounting node footprint safely
      setIsFadingOut(true);
      const fadeTimer = setTimeout(() => {
        setRenderState(false);
        setIsFadingOut(false);
      }, 250); // Matches transition duration precisely
      return () => clearTimeout(fadeTimer);
    }
  }, [visible, renderState]);

  const handleCloseTrigger = useCallback(() => {
    setIsFadingOut(true);
    setTimeout(() => onClose(), 250);
  }, [onClose]);

  useEffect(() => {
    if (visible && duration && type !== 'error') {
      const autoCloseTimer = setTimeout(() => handleCloseTrigger(), duration);
      return () => clearTimeout(autoCloseTimer);
    }
  }, [visible, duration, type, handleCloseTrigger]);

  if (!renderState) return null;

  const isInteractive = typeof message !== 'string';

  return (
    <div style={{
      position: 'absolute',
      top: '68px', 
      left: '12px',
      right: '12px',
      padding: '16px 20px', 
      borderRadius: '16px',
      background: 'rgba(255, 255, 255, 0.94)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      zIndex: 100002,
      boxShadow: '0 24px 48px rgba(15, 23, 42, 0.14), 0 2px 8px rgba(0, 0, 0, 0.04)',
      border: '1px solid rgba(255, 255, 255, 0.7)',
      borderLeft: type === 'error' ? '6px solid #f43f5e' : type === 'success' ? '6px solid #10b981' : '6px solid #2563eb',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '16px',
      animation: isFadingOut 
        ? 'premiumToastSlideOut 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) forwards' 
        : 'premiumToastSlideIn 0.32s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
    }}>
      <style>{`
        @keyframes premiumToastSlideIn {
          0% { transform: translateY(-16px) scale(0.94); opacity: 0; }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }
        @keyframes premiumToastSlideOut {
          0% { transform: translateY(0) scale(1); opacity: 1; }
          100% { transform: translateY(-12px) scale(0.95); opacity: 0; }
        }
      `}</style>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
        {!isInteractive && (
          <div style={{ display: 'flex', flexShrink: 0 }}>
            {type === 'success' && <CheckCircle2 size={20} color="#10b981" strokeWidth={2.5} />}
            {type === 'error' && <AlertTriangle size={20} color="#f43f5e" strokeWidth={2.5} />}
            {type !== 'success' && type !== 'error' && <Info size={20} color="#2563eb" strokeWidth={2.5} />}
          </div>
        )}
        <div style={{ fontSize: '0.86rem', color: '#0f172a', fontWeight: 600, width: '100%', lineHeight: 1.45 }}>
          {message}
        </div>
      </div>

      {!isInteractive && (
        <button 
          onClick={handleCloseTrigger} 
          style={{ 
            background: 'rgba(15, 23, 42, 0.06)', 
            border: 'none', 
            color: '#475569', 
            cursor: 'pointer', 
            borderRadius: '50%', 
            width: '28px', 
            height: '28px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            flexShrink: 0,
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(15, 23, 42, 0.12)'; e.currentTarget.style.color = '#0f172a'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(15, 23, 42, 0.06)'; e.currentTarget.style.color = '#475569'; }}
        >
          <X size={14} strokeWidth={3} />
        </button>
      )}
    </div>
  );
};
