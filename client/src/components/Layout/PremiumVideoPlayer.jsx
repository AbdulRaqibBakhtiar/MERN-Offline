import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Maximize, Minimize, Volume2, VolumeX, X, RotateCcw, RotateCw } from 'lucide-react';

export const PremiumVideoPlayer = ({ src, isPlaying: initialPlaying, onClose, isPreview = false }) => {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const progressBarRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(initialPlaying);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isScrubbing, setIsScrubbing] = useState(false);

  const controlsTimeoutRef = useRef(null);

  useEffect(() => {
    if (isPreview && videoRef.current) {
      videoRef.current.muted = true;
      videoRef.current.pause();
    }
  }, [isPreview]);

  useEffect(() => {
    if (!isPreview) {
      const handleGlobalKeyDown = (e) => {
        if (e.key === 'Escape' && !document.fullscreenElement) onClose?.();
        if (e.key === ' ') { e.preventDefault(); togglePlay(); }
        if (e.key === 'ArrowRight') { e.preventDefault(); skipTime(5); }
        if (e.key === 'ArrowLeft') { e.preventDefault(); skipTime(-5); }
      };
      window.addEventListener('keydown', handleGlobalKeyDown);
      return () => window.removeEventListener('keydown', handleGlobalKeyDown);
    }
  }, [isPreview, isPlaying]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
    triggerControlsTimeout();
  };

  const skipTime = (seconds) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.max(0, Math.min(videoRef.current.duration, videoRef.current.currentTime + seconds));
    triggerControlsTimeout();
  };
  const handleTimeUpdate = () => {
    if (videoRef.current && !isScrubbing) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) setDuration(videoRef.current.duration);
  };

  // Modern Slider Fix: Calculates true horizontal layout offsets from click triggers
  const scrubTimeline = (e) => {
    if (!progressBarRef.current || !videoRef.current || !duration) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickX = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    const targetTime = percentage * duration;
    
    videoRef.current.currentTime = targetTime;
    setCurrentTime(targetTime);
  };

  const handleMouseDownScrub = (e) => {
    setIsScrubbing(true);
    scrubTimeline(e);
    
    const handleGlobalMouseMove = (moveEvent) => scrubTimeline(moveEvent);
    const handleGlobalMouseUp = () => {
      setIsScrubbing(false);
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
    
    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const triggerControlsTimeout = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    if (isPlaying && !isPreview && !isScrubbing) {
      controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 2200);
    }
  };

  const formatTime = (time) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (isPreview) {
    return (
      <video ref={videoRef} src={src} preload="metadata" playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
    );
  }
  const completionPercentage = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div 
      ref={containerRef}
      onMouseMove={triggerControlsTimeout}
      onMouseLeave={() => isPlaying && !isScrubbing && setShowControls(false)}
      style={{
        position: 'fixed', inset: 0, background: '#05070c',
        zIndex: 99999999, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'system-ui, -apple-system, sans-serif', animation: 'cinemaOpenFade 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        userSelect: 'none'
      }}
    >
      <style>{`
        @keyframes cinemaOpenFade { from { opacity: 0; filter: blur(8px); } to { opacity: 1; filter: blur(0); } }
        .control-trigger-btn { background: none; border: none; color: rgba(255,255,255,0.85); cursor: pointer; padding: 6px; display: flex; alignItems: center; justifyContent: center; transition: all 0.2s ease; borderRadius: '8px' }
        .control-trigger-btn:hover { color: #ffffff; background: rgba(255, 255, 255, 0.1); transform: scale(1.05); }
        .timeline-interactive-container { width: 100%; height: 20px; display: flex; alignItems: center; cursor: pointer; position: relative; }
        .timeline-bar-bg { width: 100%; height: 4px; background: rgba(255, 255, 255, 0.16); border-radius: 4px; position: relative; transition: height 0.2s cubic-bezier(0.16, 1, 0.3, 1); }
        .timeline-interactive-container:hover .timeline-bar-bg { height: 6px; }
        .timeline-bar-fill { height: 100%; background: linear-gradient(90deg, #2563eb, #60a5fa); border-radius: 4px; position: absolute; top: 0; left: 0; box-shadow: 0 0 12px rgba(37,99,235,0.6); }
        .timeline-handle-dot { width: 14px; height: 14px; background: #ffffff; border-radius: 50%; position: absolute; top: 50%; transform: translate(-50%, -50%) scale(0); left: 0; transition: transform 0.15s ease; box-shadow: 0 2px 6px rgba(0,0,0,0.4); border: 2px solid #2563eb; }
        .timeline-interactive-container:hover .timeline-handle-dot { transform: translate(-50%, -50%) scale(1); }
      `}</style>

      {/* Modern Floating Top Corner Dismissal */}
      <button 
        onClick={onClose}
        style={{
          position: 'absolute', top: '28px', right: '28px', background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.1)', color: '#ffffff', width: '42px', height: '42px',
          borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          opacity: showControls ? 1 : 0, transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)', zIndex: 10, backdropFilter: 'blur(16px)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
        }}
      >
        <X size={18} />
      </button>

      {/* Main Focus Cinematic View Panel */}
      <div onClick={togglePlay} style={{ width: '100%', maxHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <video 
          ref={videoRef} src={src} autoPlay={initialPlaying} playsInline
          onTimeUpdate={handleTimeUpdate} onLoadedMetadata={handleLoadedMetadata}
          style={{ maxWidth: '100vw', maxHeight: '100vh', objectFit: 'contain', boxShadow: '0 20px 80px rgba(0,0,0,0.6)' }}
        />
      </div>

      {/* Sleek Glassmorphic Floating Controller Tray Container */}
      <div style={{
        position: 'absolute', bottom: '24px', left: '24px', right: '24px',
        background: 'rgba(10, 15, 30, 0.65)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
        border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px',
        padding: '16px 24px', boxSizing: 'border-box',
        opacity: showControls || isScrubbing ? 1 : 0, transform: showControls || isScrubbing ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)', pointerEvents: showControls || isScrubbing ? 'auto' : 'none',
        display: 'flex', flexDirection: 'column', gap: '12px', boxShadow: '0 20px 50px rgba(0,0,0,0.3)'
      }}>
        
        {/* Custom Progress Bar Track Line Component */}
        <div 
          ref={progressBarRef}
          onMouseDown={handleMouseDownScrub}
          onTouchStart={handleMouseDownScrub}
          className="timeline-interactive-container"
        >
          <div className="timeline-bar-bg">
            <div className="timeline-bar-fill" style={{ width: `${completionPercentage}%` }} />
            <div className="timeline-handle-dot" style={{ left: `${completionPercentage}%` }} />
          </div>
        </div>

        {/* Dashboard Lower Parameter Elements Layer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#ffffff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button onClick={togglePlay} className="control-trigger-btn">
              {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
            </button>
            
            <button onClick={() => skipTime(-5)} className="control-trigger-btn" title="Rewind 5s">
              <RotateCcw size={18} />
            </button>
            <button onClick={() => skipTime(5)} className="control-trigger-btn" title="Forward 5s">
              <RotateCw size={18} />
            </button>

            <button onClick={toggleMute} className="control-trigger-btn">
              {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>

            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)', fontVariantNumeric: 'tabular-nums', letterSpacing: '0.02em', paddingLeft: '4px' }}>
              {formatTime(currentTime)} <span style={{ color: 'rgba(255,255,255,0.3)', margin: '0 4px' }}>/</span> {formatTime(duration)}
            </span>
          </div>

          <button onClick={toggleFullscreen} className="control-trigger-btn">
            {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
          </button>
        </div>
      </div>
    </div>
  );
};
