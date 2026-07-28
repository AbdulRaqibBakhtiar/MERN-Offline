import React from 'react';

export const MessageFileDownload = ({ attachmentUrl, isMe }) => {
  return (
    <a 
      href={attachmentUrl} 
      download 
      style={{ display: 'flex', alignItems: 'center', gap: '8px', color: isMe ? '#fff' : '#2563eb', fontSize: '0.75rem', background: isMe ? 'rgba(255,255,255,0.18)' : '#f1f5f9', padding: '8px 12px', borderRadius: '8px', marginTop: '4px' }}
    >
      📁 Download
    </a>
  );
};
