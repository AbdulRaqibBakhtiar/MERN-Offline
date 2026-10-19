import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, Download, RotateCcw, RotateCw, X, ZoomIn, ZoomOut } from 'lucide-react';
import { MessageReactions } from './MessageReactions';

const normalizeMedia = media => (Array.isArray(media) ? media : media ? [media] : [])
  .map(item => typeof item === 'string' ? { url: item, type: 'image' } : item)
  .filter(item => item?.url);

export function MediaViewer({
  isOpen,
  media,
  initialIndex = 0,
  onClose,
  title = 'Media viewer',
  autoPlayVideo = true
}) {
  const items = useMemo(() => normalizeMedia(media), [media]);
  const [index, setIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState(false);
  const dialogRef = useRef(null);
  const closeButtonRef = useRef(null);
  const dragOriginRef = useRef(null);
  const touchStartRef = useRef(null);
  const current = items[index];
  const isVideo = current?.type === 'video';

  const resetImage = useCallback(() => {
    setZoom(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
    setDragging(false);
    setError(false);
  }, []);

  const close = useCallback(() => {
    setDragging(false);
    onClose?.();
  }, [onClose]);

  const goTo = useCallback(nextIndex => {
    if (!items.length) return;
    setIndex((nextIndex + items.length) % items.length);
    resetImage();
  }, [items.length, resetImage]);

  useEffect(() => {
    if (!isOpen) return;
    setIndex(Math.min(Math.max(0, initialIndex), Math.max(0, items.length - 1)));
    resetImage();
  }, [isOpen, initialIndex, items.length, resetImage]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus?.();
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKeyDown = event => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
      } else if (!isVideo && items.length > 1 && event.key === 'ArrowRight') {
        event.preventDefault();
        goTo(index + 1);
      } else if (!isVideo && items.length > 1 && event.key === 'ArrowLeft') {
        event.preventDefault();
        goTo(index - 1);
      } else if (event.key === 'Tab' && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll('button:not(:disabled), a[href], video[controls]');
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, close, goTo, index, isVideo, items.length]);

  const handleWheel = event => {
    if (isVideo || event.target.closest('[data-viewer-controls]')) return;
    event.preventDefault();
    setZoom(value => Math.min(5, Math.max(1, value + (event.deltaY < 0 ? 0.15 : -0.15))));
  };

  const handlePointerDown = event => {
    if (zoom <= 1 || event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragOriginRef.current = { x: event.clientX - position.x, y: event.clientY - position.y };
    setDragging(true);
  };

  const handlePointerMove = event => {
    if (!dragging || !dragOriginRef.current) return;
    setPosition({ x: event.clientX - dragOriginRef.current.x, y: event.clientY - dragOriginRef.current.y });
  };

  const handleTouchStart = event => {
    if (event.target.closest('[data-viewer-controls]')) {
      touchStartRef.current = null;
      return;
    }
    const touch = event.touches[0];
    touchStartRef.current = touch ? { x: touch.clientX, y: touch.clientY } : null;
  };

  const handleTouchEnd = event => {
    const start = touchStartRef.current;
    touchStartRef.current = null;
    if (!start || isVideo || zoom > 1 || items.length < 2) return;
    const touch = event.changedTouches[0];
    if (!touch) return;
    const deltaX = touch.clientX - start.x;
    const deltaY = touch.clientY - start.y;
    if (Math.abs(deltaX) > 60 && Math.abs(deltaX) > Math.abs(deltaY) * 1.25) {
      goTo(index + (deltaX < 0 ? 1 : -1));
    }
  };

  if (!isOpen || !current || typeof document === 'undefined') return null;

  const buttonStyle = {
    width: 42,
    height: 42,
    flex: '0 0 auto',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid rgba(255,255,255,.14)',
    borderRadius: 13,
    background: 'rgba(255,255,255,.09)',
    color: '#fff',
    cursor: 'pointer',
    backdropFilter: 'blur(12px)'
  };

  return createPortal(
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={current.title || current.alt || title}
      onClick={event => { if (event.target === event.currentTarget) close(); }}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{
        position: 'fixed', inset: 0, zIndex: 2147483647,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '78px 76px 84px', boxSizing: 'border-box',
        background: 'rgba(4, 7, 14, .96)', color: '#fff',
        backdropFilter: 'blur(14px)', animation: 'media-viewer-in .18s ease-out'
      }}
    >
      <style>{`
        @keyframes media-viewer-in { from { opacity: 0 } to { opacity: 1 } }
        .media-viewer-control:hover { background: rgba(255,255,255,.17) !important; }
        @media(max-width:640px) {
          .media-viewer-stage { inset: 62px 12px 90px !important; }
          .media-viewer-control { width: 38px !important; height: 38px !important; border-radius: 12px !important; }
        }
      `}</style>

      <header style={{ position: 'absolute', zIndex: 2, inset: '14px 16px auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: '.65rem', letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,.58)', fontWeight: 800 }}>
            {isVideo ? 'Video' : 'Photo'}{items.length > 1 ? ` · ${index + 1} of ${items.length}` : ''}
          </div>
          <div title={current.title || current.alt || ''} style={{ marginTop: 3, maxWidth: 'min(70vw, 700px)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '.88rem', fontWeight: 700 }}>
            {current.title || current.alt || title}
          </div>
        </div>
        <div data-viewer-controls style={{ display: 'flex', gap: 7 }}>
          {!isVideo && <a className="media-viewer-control" href={current.url} download={current.filename || current.name || undefined} aria-label="Download image" style={{ ...buttonStyle, textDecoration: 'none' }}><Download size={18} /></a>}
          <button ref={closeButtonRef} className="media-viewer-control" type="button" onClick={close} aria-label="Close media viewer" style={buttonStyle}><X size={20} /></button>
        </div>
      </header>

      {items.length > 1 && <button className="media-viewer-control" type="button" onClick={() => goTo(index - 1)} aria-label="Previous media" style={{ ...buttonStyle, position: 'absolute', zIndex: 3, left: 16, top: '50%', transform: 'translateY(-50%)' }}><ChevronLeft size={23} /></button>}

      <main className="media-viewer-stage" style={{ position: 'absolute', inset: '70px 76px 78px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 0, overflow: 'hidden' }}>
        {error ? (
          <div role="status" style={{ padding: 24, color: 'rgba(255,255,255,.75)', textAlign: 'center' }}>This media could not be loaded.</div>
        ) : isVideo ? (
          <video
            key={current.url}
            src={current.url}
            controls
            autoPlay={autoPlayVideo}
            playsInline
            preload="metadata"
            onError={() => setError(true)}
            aria-label={current.title || current.alt || 'Video player'}
            style={{ maxWidth: '100%', maxHeight: '100%', width: 'auto', height: 'auto', objectFit: 'contain', borderRadius: 12, background: '#000', boxShadow: '0 24px 80px rgba(0,0,0,.4)' }}
          />
        ) : (
          <img
            key={current.url}
            src={current.url}
            alt={current.alt || current.title || 'Image preview'}
            draggable={false}
            onError={() => setError(true)}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={event => { setDragging(false); dragOriginRef.current = null; if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); }}
            onPointerCancel={() => { setDragging(false); dragOriginRef.current = null; }}
            style={{
              maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 10,
              transform: `translate(${position.x}px, ${position.y}px) scale(${zoom}) rotate(${rotation}deg)`,
              transition: dragging ? 'none' : 'transform .16s ease',
              cursor: zoom > 1 ? (dragging ? 'grabbing' : 'grab') : 'default',
              touchAction: zoom > 1 ? 'none' : 'pan-y', userSelect: 'none'
            }}
          />
        )}
      </main>

      {items.length > 1 && <button className="media-viewer-control" type="button" onClick={() => goTo(index + 1)} aria-label="Next media" style={{ ...buttonStyle, position: 'absolute', zIndex: 3, right: 16, top: '50%', transform: 'translateY(-50%)' }}><ChevronRight size={23} /></button>}

      {!isVideo && !error && <footer data-viewer-controls style={{ position: 'absolute', zIndex: 2, bottom: 14, left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: 8, padding: 7, border: '1px solid rgba(255,255,255,.1)', borderRadius: 16, background: 'rgba(18,22,31,.72)', backdropFilter: 'blur(16px)' }}>
        <button className="media-viewer-control" type="button" onClick={() => setZoom(value => Math.max(1, value - .25))} disabled={zoom <= 1} aria-label="Zoom out" style={{ ...buttonStyle, opacity: zoom <= 1 ? .45 : 1 }}><ZoomOut size={18} /></button>
        <span style={{ width: 48, textAlign: 'center', fontSize: '.75rem', fontVariantNumeric: 'tabular-nums' }}>{Math.round(zoom * 100)}%</span>
        <button className="media-viewer-control" type="button" onClick={() => setZoom(value => Math.min(5, value + .25))} disabled={zoom >= 5} aria-label="Zoom in" style={{ ...buttonStyle, opacity: zoom >= 5 ? .45 : 1 }}><ZoomIn size={18} /></button>
        <button className="media-viewer-control" type="button" onClick={() => setRotation(value => value + 90)} aria-label="Rotate image" style={buttonStyle}><RotateCw size={18} /></button>
        {rotation !== 0 && <button className="media-viewer-control" type="button" onClick={resetImage} aria-label="Reset image view" style={buttonStyle}><RotateCcw size={18} /></button>}
      </footer>}

      {!isVideo && current.reactions && Object.keys(current.reactions).length > 0 && <div style={{ position: 'absolute', bottom: 72, left: '50%', transform: 'translateX(-50%)', pointerEvents: 'none' }}><MessageReactions reactionGroups={current.reactions} /></div>}
    </div>,
    document.body
  );
}
