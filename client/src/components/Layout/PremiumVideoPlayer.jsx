import React, { useState, useRef, useEffect } from 'react'; 
import { Play, Pause, Volume2, VolumeX, Maximize } from 'lucide-react'; 

export const PremiumVideoPlayer = ({ src }) => { 
  const videoRef = useRef(null); 
  const [isPlaying, setIsPlaying] = useState(false); 
  const [isMuted, setIsMuted] = useState(false); 
  const [currentTime, setCurrentTime] = useState(0); 
  const [duration, setDuration] = useState(0); 
  
  // FIXED: Default to false so player loads completely empty on chat open
  const [showControls, setShowControls] = useState(false); 
  const [isPortrait, setIsPortrait] = useState(false); 
  const controlsTimeoutRef = useRef(null); 

  const togglePlay = (e) => { 
    e.stopPropagation(); 
    if (!videoRef.current) return; 
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
  }; 

  const toggleMute = (e) => { 
    e.stopPropagation(); 
    if (!videoRef.current) return; 
    videoRef.current.muted = !isMuted; 
    setIsMuted(!isMuted); 
    triggerControlsHover();
  }; 

  const handleFullscreen = (e) => { 
    e.stopPropagation(); 
    if (!videoRef.current) return; 
    if (videoRef.current.requestFullscreen) videoRef.current.requestFullscreen(); 
    else if (videoRef.current.webkitRequestFullscreen) videoRef.current.webkitRequestFullscreen(); 
    triggerControlsHover();
  }; 

  const handleScrub = (e) => { 
    if (!videoRef.current) return; 
    const newTime = parseFloat(e.target.value); 
    videoRef.current.currentTime = newTime; 
    setCurrentTime(newTime); 
    triggerControlsHover();
  }; 
  // FIXED HOVER RULE: Controls reveal on mouse activity, but auto-hide if playing and static
  const triggerControlsHover = () => { 
    setShowControls(true); 
    clearTimeout(controlsTimeoutRef.current); 
    
    // Only start the auto-hide timer if the video is actively playing
    if (videoRef.current && !videoRef.current.paused) { 
      controlsTimeoutRef.current = setTimeout(() => { 
        setShowControls(false); 
      }, 2000); // 2 seconds of stationary cursor hides it
    } 
  }; 

  const handleMouseLeaveTrigger = () => {
    // Hide controls immediately on mouse exit, unless the video is paused
    if (videoRef.current && !videoRef.current.paused) {
      setShowControls(false);
    }
  };

  useEffect(() => {
    return () => clearTimeout(controlsTimeoutRef.current);
  }, []);

  const formatTime = (time) => { 
    if (isNaN(time)) return "0:00"; 
    const mins = Math.floor(time / 60); 
    const secs = Math.floor(time % 60); 
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`; 
  }; 

  const handleMetadata = (e) => { 
    if (e.target.videoWidth && e.target.videoHeight) { 
      setIsPortrait(e.target.videoHeight > e.target.videoWidth); 
    } 
    setDuration(e.target.duration || 0); 
  }; 
  return ( 
    <div 
      onMouseMove={triggerControlsHover} 
      onMouseLeave={handleMouseLeaveTrigger} 
      style={{ 
        position: 'relative', 
        width: '100%', 
        height: isPortrait ? '340px' : '160px', 
        background: '#090d16', 
        display: 'block', 
        overflow: 'hidden', 
        transition: 'height 0.35s cubic-bezier(0.25, 1, 0.5, 1)', 
        margin: 0, 
        padding: 0 
      }} 
    > 
      <style>{` 
        @keyframes electricGlow { 
          0% { background-position: 0% 50%; box-shadow: 0 0 4px #3b82f6; } 
          50% { background-position: 100% 50%; box-shadow: 0 0 12px #60a5fa, 0 0 4px #2563eb; } 
          100% { background-position: 0% 50%; box-shadow: 0 0 4px #3b82f6; } 
        } 
        input[type=range]::-webkit-slider-thumb { 
          -webkit-appearance: none; 
          height: 10px; 
          width: 10px; 
          border-radius: 50%; 
          background: #ffffff; 
          box-shadow: 0 0 8px #2563eb; 
          cursor: pointer; 
          transition: transform 0.15s ease; 
        } 
        input[type=range]::-webkit-slider-thumb:hover { 
          transform: scale(1.3); 
        } 
      `}</style> 

      {isPortrait && ( 
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundImage: `url(${src})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(24px) brightness(0.35)', transform: 'scale(1.2)', zIndex: 1 }} /> 
      )} 

      <video 
        ref={videoRef} 
        src={src} 
        playsInline 
        preload="metadata" 
        onClick={togglePlay} 
        onTimeUpdate={() => videoRef.current && setCurrentTime(videoRef.current.currentTime)} 
        onLoadedMetadata={handleMetadata} 
        onPlay={() => { setIsPlaying(true); triggerControlsHover(); }} 
        // FIXED: Force controls back to visible immediately when pause or end states fire
        onPause={() => { setIsPlaying(false); setShowControls(true); }} 
        onEnded={() => { setIsPlaying(false); setShowControls(true); }} 
        style={{ width: '100%', height: '100%', display: 'block', objectFit: isPortrait ? 'contain' : 'cover', cursor: 'pointer', position: 'relative', zIndex: 2 }} 
      /> 
      {/* FLOATING TRANSPARENT HUD CONTROL HUB */} 
      <div style={{ 
        position: 'absolute', 
        bottom: '12px', 
        left: '12px', 
        right: '12px', 
        background: 'rgba(11, 17, 32, 0.82)', 
        backdropFilter: 'blur(20px)', 
        WebkitBackdropFilter: 'blur(20px)', 
        padding: '12px 14px', 
        borderRadius: '14px', 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '10px', 
        border: '1px solid rgba(255, 255, 255, 0.08)', 
        boxShadow: '0 12px 40px rgba(0, 0, 0, 0.35)', 
        transition: 'all 0.3s cubic-bezier(0.25, 1, 0.5, 1)', 
        // FIXED ACTION FLAGS: Transitions visibility state completely driven by active showControls variable toggles
        opacity: showControls ? 1 : 0, 
        transform: showControls ? 'translateY(0)' : 'translateY(12px)', 
        pointerEvents: showControls ? 'auto' : 'none', 
        zIndex: 10 
      }} onClick={(e) => e.stopPropagation()}> 
        
        <div style={{ width: '100%', display: 'flex', alignItems: 'center', position: 'relative' }}> 
          <input 
            type="range" 
            min="0" 
            max={duration || 0} 
            step="0.1" 
            value={currentTime} 
            onChange={handleScrub} 
            style={{ 
              width: '100%', 
              height: '4px', 
              WebkitAppearance: 'none', 
              borderRadius: '3px', 
              outline: 'none', 
              cursor: 'pointer', 
              margin: 0, 
              padding: 0, 
              background: `linear-gradient(to right, #2563eb 0%, #60a5fa ${(currentTime / (duration || 1)) * 100}%, rgba(255,255,255,0.18) ${(currentTime / (duration || 1)) * 100}%, rgba(255,255,255,0.18) 100%)`, 
              backgroundSize: '200% 200%', 
              animation: isPlaying ? 'electricGlow 3s infinite ease-in-out' : 'none', 
              transition: 'box-shadow 0.3s ease' 
            }} 
          /> 
        </div> 

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#ffffff', width: '100%' }}> 
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}> 
            <button onClick={togglePlay} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: '#fff', cursor: 'pointer', width: '26px', height: '26px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, transition: 'all 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.16)'} onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'} > 
              {isPlaying ? <Pause size={12} fill="currentColor" /> : <Play size={12} fill="currentColor" style={{ marginLeft: '1px' }} />} 
            </button> 
            <span style={{ fontSize: '0.68rem', fontWeight: 700, opacity: 0.9, fontVariantNumeric: 'tabular-nums', color: '#cbd5e1' }}> 
              {formatTime(currentTime)} <span style={{ color: 'rgba(255,255,255,0.3)', margin: '0 2px' }}>/</span> {formatTime(duration)} 
            </span> 
          </div> 
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}> 
            <button onClick={toggleMute} style={{ background: 'transparent', border: 'none', color: '#cbd5e1', cursor: 'pointer', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, transition: 'color 0.2s' }} onMouseEnter={(e) => { e.currentTarget.style.color = '#ffffff'; }} onMouseLeave={(e) => { e.currentTarget.style.color = '#cbd5e1'; }} > 
              {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />} 
            </button> 
            <button onClick={handleFullscreen} style={{ background: 'transparent', border: 'none', color: '#cbd5e1', cursor: 'pointer', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, transition: 'color 0.2s' }} onMouseEnter={(e) => { e.currentTarget.style.color = '#ffffff'; }} onMouseLeave={(e) => { e.currentTarget.style.color = '#cbd5e1'; }} > 
              <Maximize size={14} /> 
            </button> 
          </div> 
        </div> 
      </div> 
    </div> 
  ); 
};
