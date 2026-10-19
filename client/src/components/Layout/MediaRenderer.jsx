import React, { useState } from 'react';
import { ImagePreview } from './ImagePreview';
import { MediaViewer } from './MediaViewer';
import { PremiumVideoPlayer } from './PremiumVideoPlayer';

export const MediaRenderer = ({ msg, isMe }) => {
  const [videoOpen, setVideoOpen] = useState(false);
  if (!msg?.attachment) return null;

  const bubbleRadius = isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px';

  if (msg.type === 'image') {
    return (
      <div style={{ width: 265, height: 265, overflow: 'hidden', borderRadius: bubbleRadius }}>
        <ImagePreview src={msg.attachment} alt={msg.message || 'Image attachment'} />
      </div>
    );
  }

  if (msg.type === 'video') {
    return (
      <>
        <div style={{ width: 265, height: 265, overflow: 'hidden', borderRadius: bubbleRadius }}>
          <PremiumVideoPlayer src={msg.attachment} isPreview onClick={() => setVideoOpen(true)} title={msg.message || 'Video attachment'} />
        </div>
        <MediaViewer
          isOpen={videoOpen}
          media={[{ url: msg.attachment, type: 'video', title: msg.message || 'Video attachment' }]}
          onClose={() => setVideoOpen(false)}
        />
      </>
    );
  }

  return null;
};
