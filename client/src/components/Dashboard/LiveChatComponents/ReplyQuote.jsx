import React from 'react';

export const ReplyQuote = ({ replyTo, isMe, currentUsername }) => {
  // 🎯 Fix: Loosened validation fallback to read messageId fields cleanly
  const targetId = replyTo?.messageId || replyTo?._id;
  if (!replyTo || !targetId) return null;

  const quoteAuthor = replyTo.senderName === currentUsername ? 'You' : replyTo.senderName;

  const handleQuoteClick = (e) => {
    e.stopPropagation(); // Block action overlays
    
    const targetElement = document.getElementById(`msg-anchor-${targetId}`);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      // Dynamic look highlighting animation
      targetElement.style.transition = 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
      targetElement.style.filter = 'brightness(1.25)';
      targetElement.style.transform = 'scale(1.03)';
      
      setTimeout(() => {
        targetElement.style.filter = 'none';
        targetElement.style.transform = 'none';
      }, 500);
    }
  };

  return (
    <div 
      onClick={handleQuoteClick} 
      style={{ 
        background: isMe ? 'rgba(0, 0, 0, 0.15)' : 'rgba(15, 23, 42, 0.05)', 
        borderLeft: isMe ? '3px solid rgba(255, 255, 255, 0.9)' : '3px solid #2563eb', 
        padding: '6px 10px', 
        borderRadius: '6px', 
        marginBottom: '6px', 
        fontSize: '0.78rem', 
        width: '100%', 
        boxSizing: 'border-box', 
        display: 'block', 
        textAlign: 'left', 
        backdropFilter: 'blur(4px)', 
        cursor: 'pointer', 
        transition: 'opacity 0.15s ease' 
      }} 
      onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'} 
      onMouseLeave={(e) => e.currentTarget.style.opacity = '1'} 
    >
      <div style={{ 
        fontWeight: '800', 
        color: isMe ? '#93c5fd' : '#2563eb', 
        fontSize: '0.72rem', 
        marginBottom: '2px', 
        whiteSpace: 'nowrap', 
        overflow: 'hidden', 
        textOverflow: 'ellipsis' 
      }}>
        {quoteAuthor}
      </div>
      <div style={{ 
        color: isMe ? 'rgba(255, 255, 255, 0.85)' : '#475569', 
        overflow: 'hidden', 
        textOverflow: 'ellipsis', 
        whiteSpace: 'nowrap', 
        fontSize: '0.76rem' 
      }}>
        {replyTo.message || (replyTo.type === 'image' ? '📷 Image' : replyTo.type === 'video' ? '🎥 Video' : '📎 File Attachment')}
      </div>
    </div>
  );
};
