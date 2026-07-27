import React, { useEffect } from 'react';
import { X, Download, Play, Pause } from 'lucide-react';

export const MediaLightbox = ({ isOpen, mediaUrl, mediaType, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !mediaUrl) return null;

  return (
    <div 
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(30px)',
        WebkitBackdropFilter: 'blur(30px)',
        zIndex: 9999999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        animation: 'cinemaFadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        cursor: 'zoom-out'
      }}
    >
      <style>{`
        @keyframes cinemaFadeIn {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        @keyframes mediaZoom {
          0% { transform: scale(0.92) translateY(10px); opacity: 0; }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
      `}</style>

      {/* Floating Control Hub */}
      <div 
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'absolute',
          top: '24px',
          right: '24px',
          display: 'flex',
          gap: '12px',
          zIndex: 10
        }}
      >
        <a 
          href={mediaUrl} 
          download={`media_${Date.now()}`}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            textDecoration: 'none'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
        >
          <Download size={18} strokeWidth={2.5} />
        </a>

        <button 
          onClick={onClose}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(244, 63, 94, 0.2)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
        >
          <X size={18} strokeWidth={2.5} />
        </button>
      </div>

      {/* Main Focus Centerpiece Screen */}
      <div 
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '90%',
          maxHeight: '82%',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'mediaZoom 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
          cursor: 'default',
          boxShadow: '0 30px 60px rgba(0,0,0,0.4)'
        }}
      >
        {mediaType === 'video' ? (
          <video 
            src={mediaUrl} 
            controls 
            autoPlay 
            playsInline
            style={{
              maxWidth: '100%',
              maxHeight: '80vh',
              borderRadius: '16px',
              objectFit: 'contain',
              background: '#000000'
            }}
          />
        ) : (
          <img 
            src={mediaUrl} 
            alt="Cinema Fullscreen View" 
            style={{
              maxWidth: '100%',
              maxHeight: '80vh',
              borderRadius: '16px',
              objectFit: 'contain',
              userSelect: 'none'
            }}
          />
        )}
      </div>
    </div>
  );
};
