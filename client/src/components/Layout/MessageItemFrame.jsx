import React from 'react';
import { Check } from 'lucide-react';

export const MessageItemFrame = ({ 
  msgId, isMe, isSame, isSelected, isSelectionMode, toggleSelectMessage, children 
}) => {
  return (
    <div 
      id={`msg-${msgId}`} 
      style={{ 
        display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', alignItems: 'center', 
        position: 'relative', width: '100%', overflow: 'visible', marginBottom: isSame ? '2px' : '12px', 
        background: isSelected ? 'rgba(37, 99, 235, 0.06)' : 'transparent', padding: isSelectionMode ? '4px 8px' : '0px', borderRadius: '6px' 
      }}
    >
      {isSelectionMode && isMe && (
        <div 
          onClick={() => toggleSelectMessage?.(msgId)} 
          style={{ marginRight: '0px', marginLeft: '10px', order: 2, width: '18px', height: '18px', borderRadius: '50%', border: isSelected ? 'none' : '2px solid #cbd5e1', background: isSelected ? '#2563eb' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, transition: 'all 0.15s ease' }}
        >
          {isSelected && <Check size={11} strokeWidth={4} color="#ffffff" />}
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start', position: 'relative', width: '100%', maxWidth: '78%', order: 1 }}>
        {children}
      </div>
    </div>
  );
};
