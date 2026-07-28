import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';
import WaveSurfer from "wavesurfer.js";

export const AudioPlayer = ({ src, msgId, isMe, chatProps, onDurationChange, avatarUrl }) => {
  const { activeAudioMemoId, setActivePlayingMemoId } = chatProps || {};
  const waveformRef = useRef(null);
  const waveSurferRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    let ws = null;
    const initTimer = setTimeout(() => {
      if (!waveformRef.current) return;
      try {
        ws = WaveSurfer.create({
          container: waveformRef.current,
          url: src,
          height: 24, 
          // 🎯 MODERN SLIDER COLORS: Vibrant high-contrast clean design profiles
          waveColor: isMe ? "rgba(255, 255, 255, 0.28)" : "#cbd5e1",
          progressColor: isMe ? "#ffffff" : "#2563eb",
          cursorColor: "transparent",
          barWidth: 2,
          barGap: 1.5,
          barRadius: 2,
          normalize: true,
        });
        waveSurferRef.current = ws;
        ws.on("ready", () => {
          const d = ws.getDuration();
          onDurationChange?.(d);
        });
        ws.on("play", () => setIsPlaying(true));
        ws.on("pause", () => setIsPlaying(false));
        ws.on("finish", () => setIsPlaying(false));
      } catch (err) {
        console.error("❌ WaveSurfer initialization failed:", err);
      }
    }, 50);

    return () => {
      clearTimeout(initTimer);
      if (ws) {
        try { ws.destroy(); } catch (e) { console.error(e); }
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

  return (
    <div style={{ display: "flex", alignItems: "center", gap: '10px', width: "100%", boxSizing: "border-box", userSelect: "none", padding: '4px 2px 0px 0px' }}>
      {/* Play / Pause circle button icon control */}
      <button 
        onClick={togglePlayPause} 
        style={{ width: 26, height: 24, borderRadius: "50%", border: "none", background: isMe ? "rgba(255, 255, 255, 0.16)" : "rgba(37, 99, 235, 0.06)", color: isMe ? "#ffffff" : "#2563eb", cursor: 'pointer', display: "flex", justifyContent: "center", alignItems: "center", flexShrink: 0, transition: "0.2s", padding: 0 }}
      >
        {isPlaying ? <Pause size={11} fill="currentColor" /> : <Play size={11} fill="currentColor" style={{ marginLeft: '1px' }} />}
      </button>

      {/* Waveform Track Line frame */}
      <div onClick={(e) => e.stopPropagation()} style={{ flex: 1, minWidth: 0 }}>
        <div ref={waveformRef} style={{ cursor: "pointer", width: "100%" }} />
      </div>

      {/* 🎯 SHOW AVATAR AT THE END OF SOUND WAVE */}
      {avatarUrl && (
        <img 
          src={avatarUrl} 
          alt="" 
          style={{ width: '22px', height: '22px', borderRadius: '50%', objectFit: 'cover', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.1)', flexShrink: 0, display: 'block' }} 
        />
      )}
    </div>
  );
};
