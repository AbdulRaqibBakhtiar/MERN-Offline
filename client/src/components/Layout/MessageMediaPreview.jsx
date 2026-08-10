import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { ImagePreview } from './ImagePreview';
import { PremiumVideoPlayer } from './PremiumVideoPlayer';
import { Play } from 'lucide-react';
import { MessageMeta } from './MessageMeta';

export const MessageMediaPreview = ({ msg, isMe, onOpenActionMenu }) => {
  const [isCinemaActive, setIsCinemaActive] = useState(false);
  const isVideo = msg.type === 'video';

  return (
    <>
      <div 
        onClick={(e) => {
          e.stopPropagation();
          if (isVideo) setIsCinemaActive(true);
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (onOpenActionMenu) onOpenActionMenu(e);
        }}
        style={{ 
          position: 'relative',
          width: '100%', 
          maxHeight: '340px', 
          aspectRatio: isVideo ? '3 / 4' : 'auto',
          overflow: 'hidden',
          borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
          background: '#090d16',
          cursor: 'pointer',
          display: 'block',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
          border: '1px solid rgba(255, 255, 255, 0.04)',
          transform: 'translateZ(0)',
          willChange: 'transform'
        }}
      >
        {!isVideo ? (
          <ImagePreview src={msg.attachment} alt="Chat Asset" />
        ) : (
          <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            <PremiumVideoPlayer 
              src={msg.attachment} 
              isPlaying={false} 
              onDurationChange={() => {}} 
              onTimeUpdate={() => {}} 
              isPreview={true}
            />
            <div style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.3))',
              zIndex: 3
            }}>
              <div style={{
                background: 'rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                width: '54px',
                height: '54px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
              }}>
                <Play size={22} fill="currentColor" style={{ marginLeft: '3px' }} />
              </div>
            </div>
          </div>
        )}

        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          padding: '12px 14px 24px',
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0) 100%)',
          fontSize: '0.78rem',
          fontWeight: 700,
          color: '#ffffff',
          pointerEvents: 'none',
          zIndex: 4,
          textAlign: 'left',
          textShadow: '0 1px 4px rgba(0,0,0,0.4)'
        }}>
          {isMe ? 'You' : msg.senderName || "Anonymous"}
        </div>

        <div style={{
          position: 'absolute',
          bottom: 0,
          right: 0,
          left: 0,
          padding: '24px 14px 10px',
          background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0) 100%)',
          display: 'flex',
          justifyContent: 'flex-end',
          pointerEvents: 'none',
          zIndex: 4
        }}>
          <MessageMeta msg={msg} isMe={isMe} audioDuration={0} formatTime={() => {}} />
        </div>
      </div>

      {isVideo && isCinemaActive && createPortal(
        <PremiumVideoPlayer 
          src={msg.attachment} 
          isPlaying={true} 
          onClose={() => setIsCinemaActive(false)} 
          isPreview={false}
        />,
        document.body
      )}
    </>
  );
};
