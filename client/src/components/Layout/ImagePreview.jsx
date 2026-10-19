import React, { useMemo, useState } from 'react';
import { MediaViewer } from './MediaViewer';

export const ImagePreview = ({
  src,
  alt = 'Image preview',
  images = [],
  initialIndex = 0,
  onClose,
  className,
  style
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const media = useMemo(() => {
    const gallery = Array.isArray(images) && images.length ? images : [{ url: src, name: alt }];
    return gallery.map(item => typeof item === 'string'
      ? { url: item, type: 'image', alt }
      : { ...item, url: item.url || item.path || item.imagePath || src, type: 'image', alt: item.name || alt });
  }, [images, src, alt]);
  const thumbnail = media[Math.min(initialIndex, Math.max(media.length - 1, 0))];

  const closeViewer = () => {
    setIsOpen(false);
    onClose?.();
  };

  return (
    <>
      <button
        type="button"
        className={className}
        onClick={() => setIsOpen(true)}
        aria-label={`Open image: ${thumbnail?.alt || alt}`}
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
          minWidth: 0,
          minHeight: 0,
          padding: 0,
          border: 0,
          borderRadius: 'inherit',
          overflow: 'hidden',
          background: 'transparent',
          cursor: 'zoom-in',
          ...style
        }}
      >
        <img
          src={thumbnail?.url || src}
          alt={thumbnail?.alt || alt}
          loading="lazy"
          draggable={false}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      </button>
      <MediaViewer
        isOpen={isOpen}
        media={media}
        initialIndex={initialIndex}
        onClose={closeViewer}
        title={alt}
      />
    </>
  );
};
