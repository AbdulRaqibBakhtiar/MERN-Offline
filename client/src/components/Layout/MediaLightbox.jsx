import React from 'react';
import { MediaViewer } from './MediaViewer';

export const MediaLightbox = ({ isOpen, mediaUrl, mediaType = 'image', onClose, title = 'Media preview' }) => (
  <MediaViewer
    isOpen={isOpen}
    media={mediaUrl ? [{ url: mediaUrl, type: mediaType, title }] : []}
    onClose={onClose}
    title={title}
  />
);
