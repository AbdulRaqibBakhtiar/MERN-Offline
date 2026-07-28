import React, { useState, useRef, useEffect } from 'react';

export const PremiumVideoPlayer = ({ src, onDurationChange, isPlaying, onTimeUpdate }) => {
  const videoRef = useRef(null);
  const [isPortrait, setIsPortrait] = useState(false);

  useEffect(() => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.play().catch((err) => console.log("Video auto-play blocked:", err));
    } else {
      videoRef.current.pause();
    }
  }, [isPlaying]);

  const handleMetadata = (e) => {
    if (e.target.videoWidth && e.target.videoHeight) {
      setIsPortrait(e.target.videoHeight > e.target.videoWidth);
    }
    const d = e.target.duration || 0;
    onDurationChange?.(d);
  };

  const handleTimeChange = () => {
    if (!videoRef.current) return;
    onTimeUpdate?.(videoRef.current.currentTime);
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: '#090d16', display: 'block', overflow: 'hidden' }}>
      {isPortrait && (
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${src})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(24px) brightness(0.35)', transform: 'scale(1.2)', zIndex: 1 }} />
      )}
      
      <video 
        ref={videoRef} 
        id={`vid-element-${src.substring(src.length - 10)}`}
        src={src} 
        playsInline 
        preload="metadata" 
        onLoadedMetadata={handleMetadata} 
        onTimeUpdate={handleTimeChange}
        style={{ width: '100%', height: '100%', display: 'block', objectFit: isPortrait ? 'contain' : 'cover', position: 'relative', zIndex: 2 }} 
      />
    </div>
  );
};
