import React from 'react';
import { X, CornerUpLeft } from 'lucide-react';

export const ReplyPreview = ({ replyingMessage, onCancel, currentUsername }) => {
  if (!replyingMessage) return null;

  // 🚀 INTERCEPT NAME STRING: Check if the original sender name matches your current login instance
  const displayedName = replyingMessage.senderName === currentUsername ? 'You' : replyingMessage.senderName;

  return (
    <div style={{
      background: '#f8fafc',
      borderLeft: '4px solid #2563eb',
      padding: '8px 16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '12px',
      borderTop: '1px solid #e2e8f0',
      animation: 'mediaCardReveal 0.2s ease forwards'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
        <CornerUpLeft size={14} color="#2563eb" style={{ flexShrink: 0 }} />
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#2563eb' }}>
            Replying to {displayedName}
          </span>
          <span style={{ fontSize: '0.8rem', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {replyingMessage.message}
          </span>
        </div>
      </div>
      <button 
        type="button" 
        onClick={onCancel}
        style={{ border: 'none', background: 'none', color: '#64748b', cursor: 'pointer', padding: '4px' }}
      >
        <X size={14} />
      </button>
    </div>
  );
};
