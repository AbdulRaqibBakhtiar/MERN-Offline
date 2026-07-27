import React from 'react';

export const ReplyQuote = ({ replyTo, isMe, currentUsername }) => {
  if (!replyTo || !replyTo.messageId) return null;

  const quoteAuthor = replyTo.senderName === currentUsername ? 'You' : replyTo.senderName;

  // 🚀 NEW: SCROLL INTERCEPT ENGINE WITH SPRING BACK VISUAL FLASH
  const handleQuoteClick = (e) => {
    e.stopPropagation(); // Prevents the context action menu from popping up
    
    const targetElement = document.getElementById(`msg-anchor-${replyTo.messageId}`);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      // Optional physical flash effect to highlight the target message
      targetElement.style.transition = 'all 0.15s ease';
      targetElement.style.filter = 'brightness(1.3) scale(1.02)';
      setTimeout(() => {
        targetElement.style.filter = 'none';
        targetElement.style.transform = 'none';
      }, 450);
    }
  };

  return (
    <div 
      onClick={handleQuoteClick} // 🚀 NEW: Triggers target search query line
      style={{
        background: isMe ? 'rgba(0, 0, 0, 0.12)' : 'rgba(37, 99, 235, 0.04)',
        borderLeft: isMe ? '3px solid rgba(255, 255, 255, 0.85)' : '3px solid #2563eb',
        padding: '7px 11px',
        borderRadius: '6px',
        marginBottom: '6px',
        fontSize: '0.8rem',
        width: '100%',
        boxSizing: 'border-box',
        display: 'block',
        textAlign: 'left',
        backdropFilter: 'blur(4px)',
        cursor: 'pointer', // 🚀 Shows interactive affordance
        transition: 'opacity 0.15s ease'
      }}
      onMouseEnter={(e) => e.currentTarget.style.opacity = '0.85'}
      onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
    >
      <div style={{ 
        fontWeight: '800', 
        color: isMe ? '#93c5fd' : '#2563eb', 
        fontSize: '0.74rem',
        marginBottom: '3px',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        letterSpacing: '-0.01em'
      }}>
        {quoteAuthor}
      </div>
      <div style={{ 
        color: isMe ? 'rgba(255, 255, 255, 0.9)' : '#475569',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        fontSize: '0.78rem'
      }}>
        {replyTo.message}
      </div>
    </div>
  );
};
