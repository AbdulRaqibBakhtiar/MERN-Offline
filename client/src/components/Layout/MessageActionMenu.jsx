import React, { useRef } from 'react';
import { createPortal } from 'react-dom';
import { CornerUpLeft, Copy, Check, Edit2, Trash2 } from 'lucide-react';

export const MessageActionMenu = ({ 
  msg, isMe, isVoiceMemoFile, menuCoords, showActionMenu, setShowActionMenu, 
  chatProps, handleCopyMessageTextContent 
}) => {
  const { REACTION_OPTIONS, triggerAddReaction, startReply, setIsSelectionMode, toggleSelectMessage, setEditingMessageId, setEditInput, triggerDelete } = chatProps;
  const menuRef = useRef(null);

  if (!showActionMenu) return null;

  return (
    <>
      {createPortal(
        <div ref={menuRef} onClick={(e) => e.stopPropagation()} style={{ position: 'fixed', top: `${menuCoords.top - window.scrollY}px`, left: `${menuCoords.left - window.scrollX}px`, display: 'flex', flexDirection: 'column', background: '#ffffff', padding: '6px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 12px 30px rgba(0,0,0,0.15)', zIndex: 9999999, minWidth: '220px', animation: 'smoothSpringMenu 0.22s cubic-bezier(0.34, 1.56, 0.64, 1) forwards' }}>
          <div style={{ display: 'flex', gap: '8px', padding: '6px 10px', borderBottom: '1px solid #f1f5f9', justifyContent: 'space-between' }}>
            {REACTION_OPTIONS.map(emoji => (
              <button key={emoji} onClick={() => { triggerAddReaction(msg._id, emoji); setShowActionMenu(false); }} style={{ background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer', transition: 'transform 0.1s' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.25)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>{emoji}</button>
            ))}
          </div>
          <button onClick={() => { if (startReply) startReply(msg); setShowActionMenu(false); }} style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '10px 12px', border: 'none', background: 'none', color: '#475569', fontSize: '0.82rem', cursor: 'pointer', textAlign: 'left' }}><CornerUpLeft size={14} /> Reply</button>
          
          {msg.type === 'text' && (
            <button onClick={(e) => { handleCopyMessageTextContent(e); setShowActionMenu(false); }} style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '10px 12px', border: 'none', background: 'none', color: '#475569', fontSize: '0.82rem', cursor: 'pointer', textAlign: 'left' }}><Copy size={14} /> Copy Message Content</button>
          )}
          
          {isMe && (
            <button onClick={() => { if (setIsSelectionMode) { setIsSelectionMode(true); if (toggleSelectMessage) toggleSelectMessage(msg._id); } setShowActionMenu(false); }} style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '10px 12px', border: 'none', background: 'none', color: '#475569', fontSize: '0.82rem', cursor: 'pointer', textAlign: 'left' }}><Check size={14} /> Select Multiple Messages</button>
          )}
          
          {isMe && !isVoiceMemoFile && msg.type === 'text' && (
            <button onClick={() => { if (setEditingMessageId) { setEditingMessageId(msg._id); setEditInput(msg.message || ''); } setShowActionMenu(false); }} style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '10px 12px', border: 'none', background: 'none', color: '#475569', fontSize: '0.82rem', cursor: 'pointer', textAlign: 'left' }}><Edit2 size={14} /> Edit Message</button>
          )}
          
          {isMe && (
            <button onClick={() => { triggerDelete(msg._id); setShowActionMenu(false); }} style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '10px 12px', border: 'none', background: 'none', color: '#ef4444', fontSize: '0.82rem', cursor: 'pointer', textAlign: 'left' }}><Trash2 size={14} /> Delete</button>
          )}
        </div>,
        document.body
      )}
      
      {createPortal(
        <div onClick={() => setShowActionMenu(false)} style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'transparent', zIndex: 9999998 }} />,
        document.body
      )}
    </>
  );
};
