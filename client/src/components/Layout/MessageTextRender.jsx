import React from 'react';
import { MapPin } from 'lucide-react';

export const MessageTextRender = ({ textContent }) => {
  if (!textContent) return null;

  // Detects if the string signature matches our coordinate maps generation rule
  const isMapLocationLink = textContent.includes('📍 Current Location: https://google.com');

  if (isMapLocationLink) {
    const rawUrlString = textContent.replace('📍 Current Location: ', '').trim();
    
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%', maxWidth: '240px', textAlign: 'left' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 700 }}>
          <MapPin size={14} color="#ef4444" fill="#ef4444" />
          <span>Shared Customer Location</span>
        </div>
        
        <a 
          href={rawUrlString}
          target="_blank"
          rel="noreferrer"
          style={{
            display: 'block',
            padding: '10px 14px',
            background: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: '8px',
            fontSize: '0.76rem',
            color: '#2563eb',
            fontWeight: 600,
            textDecoration: 'none',
            textAlign: 'center',
            boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
          onMouseLeave={(e) => e.currentTarget.style.background = '#ffffff'}
        >
          🗺️ Open in Google Maps
        </a>
      </div>
    );
  }

  // Fallback layout renders normal standard text strings
  return (
    <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', textAlign: 'left', lineHeight: '1.4' }}>
      {textContent}
    </div>
  );
};
