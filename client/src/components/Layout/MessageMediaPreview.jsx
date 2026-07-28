import React, { useState } from 'react';
import { Check, Eye, Film, Maximize2, Play, Pause } from 'lucide-react';
import { PremiumVideoPlayer } from './PremiumVideoPlayer';

export const MessageMediaPreview = ({ msg, isMe }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);
  const [videoDuration, setVideoDuration] = useState(0);
  const [videoCurrentTime, setVideoCurrentTime] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const isVideo = msg.type === 'video';
  const timestamp = new Date(msg.createdAt).toLocaleTimeString([], { 
    hour: "2-digit", 
    minute: "2-digit" 
  });

  const formatVideoDuration = (time) => {
    if (!time || isNaN(time)) return "0:00";
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const handleVideoClick = (e) => {
    e.stopPropagation();
    setIsVideoPlaying(!isVideoPlaying);
  };

  const openFullscreenView = (e) => {
    e.stopPropagation();
    setShowLightbox(true);
  };

  return (
    <>
      <div 
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={(e) => {
          if (!isVideo) {
            e.stopPropagation();
            setShowLightbox(true);
          } else {
            handleVideoClick(e);
          }
        }}
        style={{ 
          position: 'relative', 
          width: 'auto',
          // 🎯 RESTORED: Dynamic natural aspect bounds with crisp, premium corners
          maxWidth: isVideo ? '340px' : '300px', 
          maxHeight: isVideo ? '460px' : '400px', 
          overflow: 'hidden', 
          borderRadius: isMe ? '12px 12px 2px 12px' : '12px 12px 12px 2px', 
          background: isVideo ? '#000000' : '#0f172a', 
          boxShadow: isHovered 
            ? '0 20px 25px -5px rgba(15, 23, 42, 0.25)' 
            : '0 10px 25px -5px rgba(15, 23, 42, 0.12)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          cursor: 'pointer',
          transformOrigin: isMe ? 'right bottom' : 'left bottom',
          display: 'block',
          transform: isHovered && !isVideo ? 'scale(1.02)' : 'scale(1)'
        }}
      >
        {/* Shimmer Placeholder (Images only) */}
        {!isLoaded && !isVideo && (
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, #1e293b 25%, #334155 50%, #1e293b 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite linear', height: '280px' }} />
        )}
        {/* Media Render Core */}
        {!isVideo ? (
          <img 
            src={msg.attachment} 
            alt="Attachment" 
            onLoad={() => setIsLoaded(true)}
            style={{ width: '100%', height: 'auto', maxHeight: '400px', objectFit: 'contain', display: 'block', opacity: isLoaded ? 1 : 0, transition: 'opacity 0.3s ease-in-out' }} 
          />
        ) : (
          <div style={{ width: '100%', height: '100%', maxHeight: '460px', display: 'block', position: 'relative' }}>
            <PremiumVideoPlayer 
              src={msg.attachment} 
              onDurationChange={setVideoDuration} 
              onTimeUpdate={setVideoCurrentTime}
              isPlaying={isVideoPlaying}
              onTogglePlay={handleVideoClick}
            />
          </div>
        )}
        
        {/* Hover View Action Badge (Images only) */}
        {!isVideo && (
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.15)', width: '46px', height: '46px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', opacity: isHovered ? 1 : 0, transition: 'all 0.25s ease', zIndex: 15, boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
            <Eye size={20} strokeWidth={2.5} />
          </div>
        )}

        {/* Big Center Play Button (Visible on Video ONLY when paused) */}
        {isVideo && !isVideoPlaying && (
          <div 
            style={{
              position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
              background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255, 255, 255, 0.15)',
              width: '54px', height: '54px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#ffffff', zIndex: 15, boxShadow: '0 8px 20px rgba(0,0,0,0.4)', transition: 'all 0.2s'
            }}
          >
            <Play size={22} fill="currentColor" style={{ marginLeft: '3px' }} />
          </div>
        )}

        {/* 🎯 RE-ADDED ACCENT: Big Center Pause Button (Visible on Video ONLY when playing AND hovering) */}
        {isVideo && isVideoPlaying && isHovered && (
          <div 
            style={{
              position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
              background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255, 255, 255, 0.15)',
              width: '54px', height: '54px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#ffffff', zIndex: 15, boxShadow: '0 8px 20px rgba(0,0,0,0.4)', transition: 'all 0.2s'
            }}
          >
            <Pause size={22} fill="currentColor" />
          </div>
        )}

        {/* Maximize Button */}
        {isHovered && (
          <button 
            onClick={openFullscreenView}
            style={{
              position: 'absolute', top: '12px', right: '12px',
              background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255, 255, 255, 0.15)',
              width: '32px', height: '32px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#ffffff', zIndex: 25, transition: 'all 0.2s', cursor: 'pointer', padding: 0
            }}
          >
            <Maximize2 size={14} strokeWidth={2.5} />
          </button>
        )}

        {/* Hover Progress Bar Overlay (Only visible for videos) */}
        {isVideo && isHovered && (
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '4px', background: 'rgba(255, 255, 255, 0.2)', zIndex: 30, pointerEvents: 'none' }}>
            <div style={{ 
              height: '100%', 
              background: '#2563eb', 
              width: `${(videoCurrentTime / (videoDuration || 1)) * 100}%`,
              transition: 'width 0.1s linear',
              boxShadow: '0 0 8px #60a5fa'
            }} />
          </div>
        )}

        {/* Sender Header Profile Info Shield */}
        {(!isVideo || !isVideoPlaying) && (
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', padding: '12px 14px 28px', background: 'linear-gradient(to bottom, rgba(15,23,42,0.8) 0%, rgba(15,23,42,0) 100%)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxSizing: 'border-box', pointerEvents: 'none', zIndex: 5 }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#ffffff', letterSpacing: '0.01em', textShadow: '0 1px 3px rgba(0,0,0,0.6)' }}>
              {isMe ? 'You' : msg.senderName}
            </span>
          </div>
        )}

        {/* Static Status Metrics Footer */}
        {(!isVideo || !isVideoPlaying) && (
          <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', padding: '28px 14px 10px', background: 'linear-gradient(to top, rgba(15,23,42,0.85) 0%, rgba(15,23,42,0) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxSizing: 'border-box', pointerEvents: 'none', zIndex: 5 }}>
            {isVideo ? (
              <div style={{ display: "flex", alignItems: "center", gap: '4px', background: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(4px)', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <Film size={10} strokeWidth={2.5} color="#ffffff" />
                <span style={{ fontSize: '0.64rem', color: '#ffffff', fontWeight: 600 }}>{formatVideoDuration(videoDuration)}</span>
              </div>
            ) : <div />}
            
            <div style={{ background: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(4px)', padding: '2px 6px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '5px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ fontSize: '0.64rem', color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>{timestamp}</span>
              {isMe && (
                <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                  {msg.readBy?.length > 0 ? (
                    <><Check size={11} strokeWidth={3} color="#60a5fa" /><Check size={11} strokeWidth={3} color="#60a5fa" style={{ marginLeft: -6 }} /></>
                  ) : msg.delivered ? (
                    <><Check size={11} strokeWidth={3} color="#ffffff" /><Check size={11} strokeWidth={3} color="#ffffff" style={{ marginLeft: -6 }} /></>
                  ) : <Check size={11} strokeWidth={3} color="rgba(255,255,255,0.6)" />}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Lightbox Portal Modal */}
      {showLightbox && (
        <div onClick={() => setShowLightbox(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(7, 10, 19, 0.93)', backdropFilter: 'blur(25px)', zIndex: 9999999, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.25s ease-out', padding: '24px' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ position: 'relative', width: isVideo ? '80vw' : 'auto', maxWidth: '90vw', maxHeight: '85vh', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', background: '#000' }}>
            {isVideo ? (
              <video src={msg.attachment} controls autoPlay style={{ width: '100%', maxHeight: '85vh', display: 'block' }} />
            ) : (
              <img src={msg.attachment} alt="Fullscreen Lightbox" style={{ maxWidth: '100%', maxHeight: '85vh', objectFit: 'contain', display: 'block' }} />
            )}
          </div>
        </div>
      )}
    </>
  );
};
