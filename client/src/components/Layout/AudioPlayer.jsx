import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';
import WaveSurfer from "wavesurfer.js";

export const AudioPlayer = ({ src, msgId, isMe, chatProps, onDurationChange, avatarUrl }) => {
  const { activeAudioMemoId, setActivePlayingMemoId } = chatProps || {};
  const waveformRef = useRef(null);
  const waveSurferRef = useRef(null);
  const onDurationChangeRef = useRef(onDurationChange);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => { onDurationChangeRef.current = onDurationChange; }, [onDurationChange]);

  useEffect(() => {
    let ws = null;
    const initTimer = setTimeout(() => {
      if (!waveformRef.current) return;
      try {
        ws = WaveSurfer.create({
          container: waveformRef.current,
          url: src,
          height: 30,
          waveColor: isMe ? "#93c5fd" : "#cbd5e1",
          progressColor: isMe ? "#ffffff" : "#2563eb",
          cursorColor: "transparent",
          barWidth: 3,
          barGap: 2,
          barRadius: 3,
          normalize: true,
          
          // 🎯 THE PERMANENT FIX: Instructs WaveSurfer to pass CORS requests cleanly across ports 3000 & 5000
          fetchOptions: {
            mode: 'cors',
            credentials: 'omit'
          }
        });
        
        waveSurferRef.current = ws;

        ws.on("ready", () => {
          const d = ws.getDuration();
          setDuration(d);
          onDurationChangeRef.current?.(d);
        });

        ws.on("play", () => setIsPlaying(true));
        ws.on("pause", () => setIsPlaying(false));
        ws.on("timeupdate", time => setCurrentTime(time));
        ws.on("seeking", time => setCurrentTime(time));
        ws.on("finish", () => setIsPlaying(false));
      } catch (err) {
        console.error("❌ WaveSurfer initialization failed:", err);
      }
    }, 50);

    return () => {
      clearTimeout(initTimer);
      if (ws) {
        try {
          ws.destroy();
        } catch (e) {
          console.error(e);
        }
      }
    };
  }, [src, isMe]);
  useEffect(() => {
    if (activeAudioMemoId !== msgId && waveSurferRef.current && isPlaying) {
      waveSurferRef.current.pause();
    }
  }, [activeAudioMemoId, msgId, isPlaying]);

  const togglePlayPause = (e) => {
    e.stopPropagation();
    if (!waveSurferRef.current) return;
    if (!isPlaying && setActivePlayingMemoId) {
      setActivePlayingMemoId(msgId);
    }
    waveSurferRef.current.playPause();
  };

  const formatTime = value => {
    const safeValue = Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
    return `${Math.floor(safeValue / 60)}:${String(safeValue % 60).padStart(2, '0')}`;
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: '9px', width: "100%", boxSizing: "border-box", userSelect: "none", padding: '5px 2px 4px 0px' }}>
      
      {/* Play / Pause circle button icon control */}
      <button 
        onClick={togglePlayPause} 
        aria-label={isPlaying ? 'Pause voice message' : 'Play voice message'}
        style={{ width: 32, height: 32, borderRadius: "50%", border: isMe ? "1px solid rgba(255,255,255,.2)" : "1px solid rgba(37,99,235,.12)", background: isMe ? "rgba(255, 255, 255, 0.17)" : "linear-gradient(145deg,#eff6ff,#dbeafe)", color: isMe ? "#ffffff" : "#1d4ed8", cursor: 'pointer', display: "flex", justifyContent: "center", alignItems: "center", flexShrink: 0, transition: "transform .18s ease, background .18s ease", padding: 0 }}
      >
        {isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" style={{ marginLeft: '2px' }} />}
      </button>

      {/* Waveform Track Line frame */}
      <div onClick={(e) => e.stopPropagation()} style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
        <div ref={waveformRef} style={{ cursor: "pointer", width: "100%", minHeight: 30 }} />
      </div>

      <span aria-label="Playback time" style={{ minWidth: 31, color: isMe ? 'rgba(255,255,255,.86)' : '#64748b', fontSize: 10, fontVariantNumeric: 'tabular-nums', fontWeight: 650 }}>{formatTime(isPlaying || currentTime > 0 ? currentTime : duration)}</span>

      {/* 🎯 SHOW AVATAR AT THE END OF SOUND WAVE */}
      {avatarUrl && (
        <img src={avatarUrl} alt="" style={{ width: '25px', height: '25px', borderRadius: '50%', objectFit: 'cover', background: 'rgba(255,255,255,0.15)', border: isMe ? '1.5px solid rgba(255,255,255,.55)' : '1.5px solid #dbeafe', flexShrink: 0, display: 'block' }} />
      )}
    </div>
  );
};
