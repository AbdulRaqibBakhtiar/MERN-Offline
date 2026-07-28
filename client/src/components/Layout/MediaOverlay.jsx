import React from 'react';
import { Check } from 'lucide-react';

export const MediaOverlay = ({ msg, isMe }) => {
  return (
    <>
      {/* Username overlay */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          padding: '10px 12px',
          background: 'linear-gradient(to bottom, rgba(15,23,42,0.6), transparent)',
          boxSizing: 'border-box',
          pointerEvents: 'none',
          zIndex: 30
        }}
      >
        <span
          style={{
            fontSize: '0.75rem',
            fontWeight: 800,
            color: '#fff',
            textShadow: '0 1px 2px rgba(0,0,0,.4)'
          }}
        >
          {isMe ? 'You' : msg.senderName}
        </span>
      </div>


      {/* Time + checks */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '100%',
          padding: '12px 12px 6px',
          background: 'linear-gradient(to top, rgba(15,23,42,.65), transparent)',
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          gap: '4px',
          boxSizing: 'border-box',
          pointerEvents: 'none',
          zIndex: 30
        }}
      >
        <span
          style={{
            fontSize: '0.64rem',
            color: '#fff',
            fontWeight: 500
          }}
        >
          {new Date(msg.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
          })}
        </span>

        {isMe && (
          <span style={{ display: 'inline-flex' }}>
            {msg.readBy?.length > 0 ? (
              <>
                <Check size={12} strokeWidth={3} color="#93c5fd" />
                <Check
                  size={12}
                  strokeWidth={3}
                  color="#93c5fd"
                  style={{ marginLeft: -6 }}
                />
              </>
            ) : msg.delivered ? (
              <>
                <Check size={12} strokeWidth={3} color="#fff" />
                <Check
                  size={12}
                  strokeWidth={3}
                  color="#fff"
                  style={{ marginLeft: -6 }}
                />
              </>
            ) : (
              <Check size={12} strokeWidth={3} color="#fff" />
            )}
          </span>
        )}
      </div>
    </>
  );
};