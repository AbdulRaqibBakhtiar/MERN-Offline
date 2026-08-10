import React, { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CornerUpLeft, Copy, Check, Edit2, Trash2 } from 'lucide-react';

export const MessageActionMenu = ({ msg, isMe, isVoiceMemoFile, menuCoords, showActionMenu, setShowActionMenu, chatProps, handleCopyMessageTextContent }) => {
  const { REACTION_OPTIONS, triggerAddReaction, startReply, setIsSelectionMode, toggleSelectMessage, setEditingMessageId, setEditInput, triggerDelete } = chatProps;
  const menuRef = useRef(null);
  const [adjustedTop, setAdjustedTop] = useState(menuCoords.top);

  useEffect(() => {
    if (showActionMenu && menuRef.current) {
      const menuHeight = menuRef.current.offsetHeight || 220;
      const spaceBelow = window.innerHeight - menuCoords.top;
      
      // 🎯 Fix: If menu would overflow under bottom chat input/taskbar, flip it upwards!
      if (spaceBelow < menuHeight + 20) {
        setAdjustedTop(menuCoords.top - menuHeight);
      } else {
        setAdjustedTop(menuCoords.top);
      }
    }
  }, [showActionMenu, menuCoords.top]);

  if (!showActionMenu) return null;

  const menuWidth = 210;
  let optimizedLeft = menuCoords.left;
  if (optimizedLeft + menuWidth > window.innerWidth) {
    optimizedLeft = window.innerWidth - menuWidth - 16;
  }

  return (
    <>
      {createPortal(
        <div ref={menuRef} onClick={(e) => e.stopPropagation()} style={{ 
          position: 'fixed', 
          top: `${adjustedTop}px`, // 🎯 Uses adjusted flip-up top coordinate calculations
          left: `${optimizedLeft}px`, 
          display: 'flex', 
          flexDirection: 'column', 
          background: '#ffffff', 
          padding: '4px', 
          borderRadius: '12px', 
          border: '1px solid #e2e8f0', 
          boxShadow: '0 10px 25px rgba(15, 23, 42, 0.15)', 
          zIndex: 99999999, 
          width: `${menuWidth}px`, 
          boxSizing: 'border-box'
        }}>
          <div style={{ display: 'flex', gap: '4px', padding: '6px 8px', borderBottom: '1px solid #f1f5f9', justifyContent: 'space-between' }}>
            {REACTION_OPTIONS.map(emoji => (
              <button key={emoji} onClick={() => { triggerAddReaction(msg._id, emoji); setShowActionMenu(false); }} style={{ background: 'none', border: 'none', fontSize: '1.1rem', cursor: 'pointer', padding: '2px' }}>{emoji}</button>
            ))}
          </div>
          <button onClick={() => { if (startReply) startReply(msg); setShowActionMenu(false); }} style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '8px 10px', border: 'none', background: 'none', color: '#475569', fontSize: '0.82rem', cursor: 'pointer', textAlign: 'left' }}><CornerUpLeft size={14} /> Reply</button>
          {msg.type === 'text' && (
            <button onClick={(e) => { handleCopyMessageTextContent(e); setShowActionMenu(false); }} style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '8px 10px', border: 'none', background: 'none', color: '#475569', fontSize: '0.82rem', cursor: 'pointer', textAlign: 'left' }}><Copy size={14} /> Copy Message Content</button>
          )}
          {isMe && (
            <button onClick={() => { if (setIsSelectionMode) { setIsSelectionMode(true); if (toggleSelectMessage) toggleSelectMessage(msg._id); } setShowActionMenu(false); }} style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '8px 10px', border: 'none', background: 'none', color: '#475569', fontSize: '0.82rem', cursor: 'pointer', textAlign: 'left' }}><Check size={14} /> Select Multiple Messages</button>
          )}
          {isMe && !isVoiceMemoFile && msg.type === 'text' && (
            <button onClick={() => { if (setEditingMessageId) { setEditingMessageId(msg._id); setEditInput(msg.message || ''); } setShowActionMenu(false); }} style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '8px 10px', border: 'none', background: 'none', color: '#475569', fontSize: '0.82rem', cursor: 'pointer', textAlign: 'left' }}><Edit2 size={14} /> Edit Message</button>
          )}
          {isMe && (
            <button onClick={() => { triggerDelete(msg._id); setShowActionMenu(false); }} style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '8px 10px', border: 'none', background: 'none', color: '#ef4444', fontSize: '0.82rem', cursor: 'pointer', textAlign: 'left' }}><Trash2 size={14} /> Delete</button>
          )}
        </div>,
        document.body
      )}
      {createPortal(
        <div onClick={() => setShowActionMenu(false)} onContextMenu={(e) => { e.preventDefault(); setShowActionMenu(false); }} style={{ position: 'fixed', inset: 0, background: 'transparent', zIndex: 99999998 }} />,
        document.body
      )}
    </>
  );
};
