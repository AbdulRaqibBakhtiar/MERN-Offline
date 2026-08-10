import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';

export const ImagePreview = ({ src, alt = "Media Preview" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  
  const dragStartRef = useRef({ x: 0, y: 0 });
  const viewerRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const handleGlobalEsc = (e) => { e.key === 'Escape' && handleClose(); };
      window.addEventListener('keydown', handleGlobalEsc);
      return () => window.removeEventListener('keydown', handleGlobalEsc);
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsOpen(false);
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setRotation(0);
    document.body.style.overflow = '';
  };

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.4, 5));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.4, 0.6));
  const handleRotate = () => setRotation(prev => prev + 90);

  const handleWheel = (e) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 0.2 : -0.2;
    setScale(prev => Math.max(0.6, Math.min(prev + zoomFactor, 5)));
  };

  const handleMouseDown = (e) => {
    if (scale <= 1 && rotation % 360 === 0) return;
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX - position.x, y: e.clientY - position.y };
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPosition({ x: e.clientX - dragStartRef.current.x, y: e.clientY - dragStartRef.current.y });
  };

  const handleMouseUp = () => setIsDragging(false);

  return (
    <>
      <img 
        src={src} alt={alt} onClick={() => setIsOpen(true)}
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} 
      />

      {isOpen && createPortal(
        <div 
          ref={viewerRef}
          onWheel={handleWheel}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(5, 7, 12, 0.97)',
            zIndex: 99999999, display: 'flex', alignItems: 'center', justifyContent: 'center',
            userSelect: 'none', animation: 'lightboxFade 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          <style>{`
            @keyframes lightboxFade { from { opacity: 0; } to { opacity: 1; } }
            .control-btn { background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.1); color: #fff; width: 40px; height: 40px; border-radius: 50%; display: flex; alignItems: 'center'; justify-content: 'center'; cursor: pointer; transition: all 0.2s; backdrop-filter: blur(8px); }
            .control-btn:hover { background: rgba(255,255,255,0.18); transform: scale(1.05); }
          `}</style>

          <div style={{ position: 'absolute', top: '24px', left: '24px', right: '24px', display: 'flex', justifyContent: 'space-between', zIndex: 10, pointerEvents: 'none' }}>
            <div style={{ display: 'flex', gap: '12px', pointerEvents: 'auto' }}>
              <button onClick={handleZoomIn} className="control-btn" style={{display:'flex', alignItems:'center', justifyContent:'center'}}><ZoomIn size={18} /></button>
              <button onClick={handleZoomOut} className="control-btn" style={{display:'flex', alignItems:'center', justifyContent:'center'}}><ZoomOut size={18} /></button>
              <button onClick={handleRotate} className="control-btn" style={{display:'flex', alignItems:'center', justifyContent:'center'}}><RotateCw size={18} /></button>
            </div>
            <button onClick={handleClose} className="control-btn" style={{ pointerEvents: 'auto', display:'flex', alignItems:'center', justifyContent:'center' }}><X size={18} /></button>
          </div>

          <div 
            onMouseDown={handleMouseDown}
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale}) rotate(${rotation}deg)`,
              transition: isDragging ? 'none' : 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
              cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
              maxWidth: '90vw', maxHeight: '85vh', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
          >
            <img 
              src={src} alt={alt} draggable={false}
              style={{ maxWidth: '100%', maxHeight: '85vh', objectFit: 'contain', borderRadius: '8px', boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }} 
            />
          </div>
        </div>,
        document.body
      )}
    </>
  );
};
