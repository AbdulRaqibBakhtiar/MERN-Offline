import React from 'react';

export const MessageEditArea = ({ msg, editInput, setEditInput, setEditingMessageId, triggerSaveEdit }) => {
  return (
    <div onClick={(e) => e.stopPropagation()} style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
      <textarea 
        value={editInput} 
        onChange={(e) => setEditInput(e.target.value)} 
        autoFocus 
        rows={1} 
        onKeyDown={(e) => { 
          if (e.key === 'Enter' && !e.shiftKey) { 
            e.preventDefault(); 
            triggerSaveEdit(msg._id); 
          } 
        }} 
        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #2563eb', background: '#ffffff', color: '#0f172a', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box', resize: 'none', fontFamily: 'inherit', lineHeight: 1.4 }} 
      />
      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', width: '100%' }}>
        <button type="button" onClick={() => setEditingMessageId(null)} style={{ padding: '5px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#ffffff', fontSize: '0.75rem', color: '#64748b', cursor: 'pointer', fontWeight: 500 }}>Cancel</button>
        <button type="button" onClick={() => triggerSaveEdit(msg._id)} style={{ padding: '5px 14px', borderRadius: '6px', border: 'none', background: '#2563eb', fontSize: '0.75rem', color: '#ffffff', fontWeight: 600, cursor: 'pointer' }}>Save</button>
      </div>
    </div>
  );
};
