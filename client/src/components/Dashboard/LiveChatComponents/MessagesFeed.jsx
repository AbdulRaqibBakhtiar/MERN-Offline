import React from 'react';
import { MessageItem } from './MessageItem';

export const MessagesFeed = ({ chatProps, user, resolveDrawerImgUrl }) => {
  const { chatLog = [], typingUser, messageEndRef, isSelectionMode } = chatProps || {};

  const animationStyles = `
    @keyframes premiumDotBounce {
      0%, 100% { transform: translateY(0); opacity: 0.3; }
      50% { transform: translateY(-5px); opacity: 1; }
    }
  `;

  return (
    <div 
      style={{ 
        flex: 1, 
        padding: '16px', 
        display: 'flex', 
        flexDirection: 'column', 
        background: 'var(--bg-main, #f8fafc)',
        // 🚀 CRITICAL FIX 1: Enforces that padding metrics account for the sliding bottom bulk toolbar panel overlay
        paddingBottom: isSelectionMode ? '74px' : '16px',
        // 🚀 CRITICAL FIX 2: Restores standard mouse copy highlights on desktop while allowing child pointer intercepts
        userSelect: isSelectionMode ? 'none' : 'text',
        WebkitUserSelect: isSelectionMode ? 'none' : 'text',
        position: 'relative'
      }}
    >
      <style>{animationStyles}</style>

      {chatLog.map((msg, idx) => (
        <div 
          // 🚀 CRITICAL FIX 3: Strict atomic unique key bindings to protect React's virtual DOM diffing engine during selections
          key={msg._id || `log-${idx}-${msg.createdAt}`}
          style={{ 
            width: '100%', 
            // 🚀 CRITICAL FIX 4: Explicitly force pointer listener event registration across selection fields
            pointerEvents: 'auto' 
          }}
        >
          <MessageItem 
            msg={msg} 
            idx={idx} 
            user={user} 
            chatProps={chatProps} 
            resolveDrawerImgUrl={resolveDrawerImgUrl} 
          />
        </div>
      ))}

      {/* Animated Multi-Dot Loading Sequence */}
      {typingUser && !isSelectionMode && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px', paddingLeft: '38px' }}>
          <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 500 }}>
            {typingUser}
          </span>
          <div style={{ display: 'flex', gap: '3px', alignItems: 'center', background: '#e2e8f0', padding: '6px 10px', borderRadius: '12px 12px 12px 4px' }}>
            {[0, 1, 2].map((i) => (
              <div key={i} style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#64748b', animation: 'premiumDotBounce 1.2s infinite ease-in-out', animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        </div>
      )}
      <div ref={messageEndRef} />
    </div>
  );
};
