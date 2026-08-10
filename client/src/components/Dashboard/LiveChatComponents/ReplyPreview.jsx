import React from 'react';
import { X, CornerUpLeft, Film, Image } from 'lucide-react';

export const ReplyPreview = ({ replyingMessage, onCancel, currentUsername }) => {
  if (!replyingMessage) return null;

  const displayedName = replyingMessage.senderName === currentUsername ? 'You' : replyingMessage.senderName;
  const isVideo = replyingMessage.type === 'video';
  const isImage = replyingMessage.type === 'image';
  const isMedia = isVideo || isImage;

  return (
    <div style={{ 
      background: '#f8fafc', 
      borderLeft: '4px solid #2563eb', 
      padding: '10px 16px', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'space-between', 
      gap: '12px', 
      borderTop: '1px solid #e2e8f0', 
      borderBottom: '1px solid #e2e8f0',
      width: '100%',
      boxSizing: 'border-box',
      animation: 'slideUpBar 0.18s cubic-bezier(0.16, 1, 0.3, 1) forwards'
    }}>
      <style>{`
        @keyframes slideUpBar {
          0% { transform: translateY(100%); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
      `}</style>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
        <CornerUpLeft size={14} color="#2563eb" style={{ flexShrink: 0 }} />
        
        {/* Render a miniature thumbnail if replying to a media file */}
        {isMedia && replyingMessage.attachment && (
          <div style={{ 
            width: '36px', 
            height: '36px', 
            borderRadius: '4px', 
            overflow: 'hidden', 
            background: '#000', 
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {isImage ? (
              <img src={replyingMessage.attachment} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <Film size={14} color="#ffffff" />
            )}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
          <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#2563eb' }}>
            Replying to {displayedName}
          </span>
          <span style={{ 
            fontSize: '0.8rem', 
            color: '#475569', 
            overflow: 'hidden', 
            textOverflow: 'ellipsis', 
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            {isImage && <><Image size={12} style={{ marginTop: '1px' }} /> Photo</>}
            {isVideo && <><Film size={12} style={{ marginTop: '1px' }} /> Video</>}
            {!isMedia && replyingMessage.message}
          </span>
        </div>
      </div>

      <button 
        type="button" 
        onClick={onCancel} 
        style={{ 
          border: 'none', 
          background: 'rgba(15, 23, 42, 0.05)', 
          color: '#64748b', 
          cursor: 'pointer', 
          padding: '6px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background 0.2s'
        }} 
        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(244, 63, 94, 0.15)'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(15, 23, 42, 0.05)'}
      >
        <X size={13} />
      </button>
    </div>
  );
};
