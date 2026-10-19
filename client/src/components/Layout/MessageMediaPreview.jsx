import React, { useState } from 'react';
import { ImagePreview } from './ImagePreview';
import { PremiumVideoPlayer } from './PremiumVideoPlayer';
import { MediaViewer } from './MediaViewer';
import { Play } from 'lucide-react';
import { MessageMeta } from './MessageMeta';

export const MessageMediaPreview = ({
  msg,
  isMe,
  onOpenActionMenu
}) => {
  const [isCinemaActive, setIsCinemaActive] = useState(false);

  const isVideo = msg?.type === 'video';
  const attachmentUrl = msg?.attachment;

  if (!attachmentUrl) {
    return null;
  }

  return (
    <>
      <div
        onClick={(e) => {
          e.stopPropagation();

          if (isVideo) {
            setIsCinemaActive(true);
          }
        }}
        role={isVideo ? 'button' : undefined}
        tabIndex={isVideo ? 0 : undefined}
        onKeyDown={e => {
          if (isVideo && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            setIsCinemaActive(true);
          }
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();

          if (onOpenActionMenu) {
            onOpenActionMenu(e);
          }
        }}
        style={{
          position: 'relative',

          /* WhatsApp/Messenger-like media width */
          width: '100%',
          maxWidth: '280px',
          height: 'auto',
          maxHeight: '350px',

          overflow: 'hidden',

          borderRadius: '9px',

          background: '#090d16',

          cursor: isVideo ? 'pointer' : 'default',
          display: 'block',
          boxShadow: '0 2px 8px rgba(15, 23, 42, 0.14)',
          border: 'none',
          transform: 'translateZ(0)',
          willChange: 'transform',
          boxSizing: 'border-box'
        }}
      >

        {/* =========================================================
            IMAGE
        ========================================================= */}
        {!isVideo && (
          <div
            style={{
              width: '100%',
              position: 'relative',
              overflow: 'hidden',
              display: 'block',
              background: '#f8fafc',
              lineHeight: 0
            }}
          >
            <ImagePreview
              src={attachmentUrl}
              alt={msg?.attachmentType || 'Image'}
            />
          </div>
        )}

        {/* =========================================================
            VIDEO
        ========================================================= */}
        {isVideo && (
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: 'auto',
              maxHeight: '340px',
              overflow: 'hidden',
              background: '#090d16'
            }}
          >
            <PremiumVideoPlayer
              src={attachmentUrl}
              isPlaying={false}
              onDurationChange={() => { }}
              onTimeUpdate={() => { }}
              isPreview={true}
            />

            {/* Subtle video overlay */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background:
                  'linear-gradient(to bottom, rgba(0,0,0,0.03), rgba(0,0,0,0.22))',
                zIndex: 3,
                pointerEvents: 'none'
              }}
            >
              {/* Compact play button */}
              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.55)',
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',

                  width: '42px',
                  height: '42px',

                  borderRadius: '50%',

                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',

                  color: '#ffffff',

                  border: '1px solid rgba(255,255,255,0.22)',

                  boxShadow: '0 3px 12px rgba(0,0,0,0.25)'
                }}
              >
                <Play
                  size={17}
                  fill="currentColor"
                  style={{ marginLeft: '2px' }}
                />
              </div>
            </div>
          </div>
        )}

        {/* =========================================================
            SENDER
        ========================================================= */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',

            padding: '8px 10px 18px',

            background:
              'linear-gradient(to bottom, rgba(0,0,0,0.48), rgba(0,0,0,0))',

            fontSize: '0.68rem',
            fontWeight: 700,
            color: '#ffffff',

            pointerEvents: 'none',
            zIndex: 4,

            textAlign: 'left',

            textShadow: '0 1px 3px rgba(0,0,0,0.5)',

            boxSizing: 'border-box'
          }}
        >
          {isMe ? 'You' : msg?.senderName || 'Anonymous'}
        </div>

        {/* =========================================================
            MESSAGE META / TIME / CHECKMARKS
        ========================================================= */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            left: 0,

            padding: '18px 8px 7px',

            background:
              'linear-gradient(to top, rgba(0,0,0,0.52), rgba(0,0,0,0))',

            display: 'flex',
            justifyContent: 'flex-end',

            pointerEvents: 'none',
            zIndex: 4,

            boxSizing: 'border-box'
          }}
        >
          <MessageMeta
            msg={msg}
            isMe={isMe}
            audioDuration={0}
            formatTime={() => ''}
          />
        </div>
      </div>

      {/* =========================================================
          CINEMA VIDEO
      ========================================================= */}
      {isVideo &&
        isCinemaActive &&
        <MediaViewer
          isOpen
          media={[{ url: attachmentUrl, type: 'video', title: msg?.message || 'Video message' }]}
          onClose={() => setIsCinemaActive(false)}
          title="Video message"
        />}
    </>
  );
};
