import React from 'react';
import { Play } from 'lucide-react';
import { MediaViewer } from './MediaViewer';

export const PremiumVideoPlayer = ({
  src,
  isPlaying: initialPlaying,
  onClose,
  isPreview = false,
  onClick,
  poster,
  title = 'Video'
}) => {
  if (isPreview) {
    return (
      <div
        onClick={onClick}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        onKeyDown={event => {
          if (onClick && (event.key === 'Enter' || event.key === ' ')) {
            event.preventDefault();
            onClick(event);
          }
        }}
        aria-label={`Play ${title}`}
        style={{ position: 'relative', width: '100%', height: '100%', minHeight: 100, overflow: 'hidden', background: '#05070c', cursor: onClick ? 'pointer' : 'default' }}
      >
        <video
          src={src}
          poster={poster}
          preload="metadata"
          playsInline
          muted
          onLoadedMetadata={event => {
            if (event.currentTarget.duration > 0) {
              event.currentTarget.currentTime = Math.min(0.1, event.currentTarget.duration);
            }
          }}
          aria-hidden="true"
          style={{ width: '100%', height: '100%', display: 'block', objectFit: 'cover' }}
        />
        <span aria-hidden="true" style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', background: 'linear-gradient(transparent, rgba(0,0,0,.24))' }}>
          <span style={{ width: 54, height: 54, display: 'grid', placeItems: 'center', border: '1px solid rgba(255,255,255,.28)', borderRadius: '50%', color: '#fff', background: 'rgba(8,12,20,.58)', backdropFilter: 'blur(10px)', boxShadow: '0 8px 30px rgba(0,0,0,.28)' }}>
            <Play size={21} fill="currentColor" style={{ marginLeft: 2 }} />
          </span>
        </span>
      </div>
    );
  }

  return (
    <MediaViewer
      isOpen
      media={[{ url: src, type: 'video', title }]}
      onClose={onClose}
      autoPlayVideo={initialPlaying !== false}
      title={title}
    />
  );
};
