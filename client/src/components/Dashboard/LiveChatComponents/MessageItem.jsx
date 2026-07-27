import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Check, Edit2, Trash2, Clock, ThumbsUp, Play, Pause, Trash, Mic, CornerUpLeft, Copy } from 'lucide-react';
import WaveSurfer from "wavesurfer.js";
import { PremiumVideoPlayer } from '../../Layout/PremiumVideoPlayer';
import { ReplyQuote } from './ReplyQuote';

// ==========================================================
// ADAPTIVE DYNAMIC COLOR WAVE PLAYER WITH PLAYBACK LOCK
// ==========================================================
const AudioPlayer = ({ src, msgId, isMe, msg, chatProps, finalAvatarUrl, onDurationChange }) => {
  const { activeAudioMemoId, setActivePlayingMemoId } = chatProps || {};
  const waveformRef = useRef(null);
  const waveSurferRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    let ws = null;
    const initTimer = setTimeout(() => {
      if (!waveformRef.current) return;
      try {
        ws = WaveSurfer.create({
          container: waveformRef.current,
          url: src,
          height: 38,
          waveColor: isMe ? "rgba(255, 255, 255, 0.4)" : "#cbd5e1",
          progressColor: isMe ? "#ffffff" : "#2563eb",
          cursorColor: "transparent",
          barWidth: 3,
          barGap: 2,
          barRadius: 3,
          normalize: true,
        });
        waveSurferRef.current = ws;
        ws.on("ready", () => {
          const d = ws.getDuration();
          setDuration(d);
          onDurationChange?.(d);
        });
        ws.on("audioprocess", () => setCurrentTime(ws.getCurrentTime()));
        ws.on("seek", () => setCurrentTime(ws.getCurrentTime()));
        ws.on("play", () => setIsPlaying(true));
        ws.on("pause", () => setIsPlaying(false));
        ws.on("finish", () => {
          setIsPlaying(false);
          setCurrentTime(0);
        });
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
    <div style={{ display: "flex", flexDirection: "column", gap: '8px', width: "100%", boxSizing: "border-box", userSelect: "none", padding: '8px 10px 4px 10px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '2px 0' }}>
        <button onClick={(e) => { e.stopPropagation(); togglePlayPause(e); }} style={{ width: 28, height: 28, borderRadius: "50%", border: "none", background: isMe ? "rgba(255, 255, 255, 0.2)" : "rgba(37, 99, 235, 0.08)", color: isMe ? "#ffffff" : "#2563eb", cursor: 'pointer', display: "flex", justifyContent: "center", alignItems: "center", flexShrink: 0, transition: "0.2s" }}>
          {isPlaying ? <Pause size={12} fill="currentColor" /> : <Play size={12} fill="currentColor" style={{ marginLeft: '1.5px' }} />}
        </button>
        <div onClick={(e) => e.stopPropagation()} style={{ flex: 1, minWidth: 0 }}>
          <div ref={waveformRef} style={{ cursor: "pointer", width: "100%" }} />
        </div>
      </div>
    </div>
  );
};
export const MessageItem = ({ msg, idx, user, chatProps, resolveDrawerImgUrl }) => {
  const { chatLog, reactionsMap, editingMessageId, setEditingMessageId, editInput, setEditInput, REACTION_OPTIONS, triggerSaveEdit, triggerDelete, triggerAddReaction, startReply, triggerToast, isSelectionMode, setIsSelectionMode, selectedMessageIds, toggleSelectMessage } = chatProps;
  
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [menuCoords, setMenuCoords] = useState({ top: 0, left: 0 });
  const [hoveredBadgeEmoji, setHoveredBadgeEmoji] = useState(null);
  const [audioDuration, setAudioDuration] = useState(0);

  const [swipeTranslation, setSwipeTranslation] = useState(0);
  const [isSwipingActive, setIsSwipingActive] = useState(false);
  const touchStartCoordinatesRef = useRef({ x: 0, y: 0 });
  const swipeDeltaRef = useRef(0);
  const bubbleRef = useRef(null);
  const menuRef = useRef(null);

  const formatTime = (time) => {
    if (!time || isNaN(time)) return "0:00";
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  // 🚀 RESTRICTION SECURED: Rejects processing binary or multimedia media attachment clipboards entirely
  const handleCopyMessageTextContent = (e) => {
    if (e) e.stopPropagation();
    if (msg.type !== 'text') {
      if (triggerToast) triggerToast("Media assets cannot be copied to the clipboard", "error");
      return;
    }
    
    const textToCopy = msg.message || "";

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(textToCopy)
        .then(() => triggerToast && triggerToast("Copied to system clipboard", "success"))
        .catch(() => triggerToast && triggerToast("Clipboard permission restricted", "error"));
    } else {
      const textArea = document.createElement("textarea");
      textArea.value = textToCopy;
      textArea.style.position = "fixed";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        if (triggerToast) triggerToast("Copied to system clipboard", "success");
      } catch (err) {
        if (triggerToast) triggerToast("Copy operational runtime failure", "error");
      }
      document.body.removeChild(textArea);
    }
  };

  const currentUsername = user?.username || user?.name || "Anonymous";
  const isMe = (msg.senderId && user && String(msg.senderId) === String(user._id || user.id)) || (msg.senderName && user && (msg.senderName === user.username || msg.senderName === user.name));
  const isSame = chatLog[idx - 1] && chatLog[idx - 1].senderName === msg.senderName;
  
  const isSelected = selectedMessageIds?.has(msg._id) || false;
  const activeReactions = (msg.reactions && msg.reactions.length > 0) ? msg.reactions : (reactionsMap[msg._id] || []);
  
  const reactionGroups = activeReactions.reduce((acc, curr) => {
    if (!curr || !curr.emoji) return acc;
    const emojiKey = curr.emoji;
    if (!acc[emojiKey]) acc[emojiKey] = { count: 0, users: [] };
    acc[emojiKey].count += 1;
    acc[emojiKey].users.push(curr.username || "Anonymous");
    return acc;
  }, {});

  const isVoiceMemoFile = msg.type === 'audio' || (msg.type === 'file' && (msg.attachmentType?.endsWith('.webm') || (msg.attachment && msg.attachment.toLowerCase().match(/\.(mp3|wav|ogg|m4a|aac|flac)$/i))));
  const isCurrentlyEditing = editingMessageId === msg._id;

  const handleTouchStart = (e) => {
    if (isCurrentlyEditing || isSelectionMode) return;
    const touch = e.touches;
    touchStartCoordinatesRef.current = { x: touch.clientX, y: touch.clientY };
    setIsSwipingActive(true);
    swipeDeltaRef.current = 0;
  };

  const handleTouchMove = (e) => {
    if (!isSwipingActive || isSelectionMode) return;
    const touch = e.touches;
    const diffX = touch.clientX - touchStartCoordinatesRef.current.x;
    const diffY = touch.clientY - touchStartCoordinatesRef.current.y;

    if (Math.abs(diffX) > Math.abs(diffY)) {
      if (!isMe && diffX > 0) {
        e.preventDefault();
        const elasticDrag = Math.min(diffX * 0.4, 65);
        setSwipeTranslation(elasticDrag);
        swipeDeltaRef.current = diffX;
      } else if (isMe && diffX < 0) {
        e.preventDefault();
        const elasticDrag = Math.max(diffX * 0.4, -65);
        setSwipeTranslation(elasticDrag);
        swipeDeltaRef.current = diffX;
      }
    }
  };

  const handleTouchEnd = () => {
    if (!isSwipingActive || isSelectionMode) return;
    setIsSwipingActive(false);
    if (Math.abs(swipeDeltaRef.current) > 55 && startReply) {
      startReply(msg);
      if (navigator.vibrate) navigator.vibrate(12);
    }
    setSwipeTranslation(0);
    swipeDeltaRef.current = 0;
  };

  // 🚀 RESTRICTION SECURED INTERCEPT ENGINE: Clicking on a receiver's message during active selection displays a prompt warning
  const handleBubbleClick = (e) => {
    e.stopPropagation();
    if (isSelectionMode && toggleSelectMessage) {
      if (!isMe) {
        if (triggerToast) triggerToast("You can only bulk delete your own messages", "error");
        return;
      }
      toggleSelectMessage(msg._id);
      return;
    }
    if (editingMessageId) return;
    
    if (bubbleRef.current) {
      const rect = bubbleRef.current.getBoundingClientRect();
      const menuHeightEstimate = 145;
      const shouldFlip = (window.innerHeight - rect.bottom) < menuHeightEstimate;
      setMenuCoords({
        top: shouldFlip ? rect.top + window.scrollY - menuHeightEstimate : rect.bottom + window.scrollY + 4,
        left: isMe ? rect.right + window.scrollX - 240 : rect.left + window.scrollX
      });
    }
    setShowActionMenu(!showActionMenu);
  };

  const livePeerContact = !isMe && chatProps?.personalContacts?.find(c => String(c.id) === String(msg.senderId));
  const rawAvatarField = msg.senderAvatar || msg.avatar || (livePeerContact && (livePeerContact.avatar || livePeerContact.profileImage)) || (isMe && user && (user.profileImage || user.avatar)) || (msg.sender && (msg.sender.profileImage || msg.sender.avatar)) || msg.profileImage;
  const finalAvatarUrl = resolveDrawerImgUrl ? resolveDrawerImgUrl(rawAvatarField) : null;
  return (
    <div 
      id={`msg-${msg._id}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ 
        display: 'flex', 
        justifyContent: isMe ? 'flex-end' : 'flex-start', 
        alignItems: 'center',
        position: 'relative', 
        width: '100%', 
        overflow: 'visible', 
        marginBottom: isSame ? '2px' : '12px',
        transform: `translateX(${swipeTranslation}px)`,
        transition: isSwipingActive ? 'none' : 'transform 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.15)',
        background: isSelected ? 'rgba(37, 99, 235, 0.06)' : 'transparent',
        padding: isSelectionMode ? '4px 8px' : '0px',
        borderRadius: '6px'
      }}
    >
      {/* 🚀 RESTRICTION SECURED: Inline round tick checkboxes will ONLY appear next to your own messages (`isMe`) */}
      {isSelectionMode && isMe && (
        <div 
          onClick={() => toggleSelectMessage && toggleSelectMessage(msg._id)}
          style={{
            marginRight: '0px',
            marginLeft: '10px',
            order: 2,
            width: '18px',
            height: '18px',
            borderRadius: '50%',
            border: isSelected ? 'none' : '2px solid #cbd5e1',
            background: isSelected ? '#2563eb' : 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flexShrink: 0,
            transition: 'all 0.15s ease'
          }}
        >
          {isSelected && <Check size={11} strokeWidth={4} color="#ffffff" />}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start', position: 'relative', width: '100%', maxWidth: '78%', order: 1 }}>
        <div ref={bubbleRef} onClick={handleBubbleClick} style={{ 
          maxWidth: "100%", 
          padding: isCurrentlyEditing ? '12px 14px' : msg.type === 'image' ? '0px' : isVoiceMemoFile ? '4px' : '8px 14px', 
          borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px', 
          background: isCurrentlyEditing ? '#ffffff' : msg.type === 'image' ? 'transparent' : isMe ? 'linear-gradient(135deg, #2563eb, #1d4ed8)' : '#ffffff', 
          color: isMe && !isCurrentlyEditing ? '#ffffff' : '#0f172a', 
          fontSize: '0.88rem', 
          border: (isMe && !isCurrentlyEditing && msg.type !== 'image') ? '1px solid rgba(37, 99, 235, 0.1)' : msg.type === 'image' ? 'none' : '1px solid #e2e8f0', 
          boxShadow: msg.type === 'image' ? 'none' : isMe ? '0 2px 8px rgba(37,99,235,0.15)' : '0 1px 4px rgba(15,23,42,0.04)', 
          position: 'relative', 
          cursor: 'pointer', 
          width: isCurrentlyEditing ? '100%' : (isVoiceMemoFile || msg.type === 'video' || msg.type === 'image') ? '265px' : 'auto',
          transition: 'all 0.15s ease'
        }}>
          
          {!isCurrentlyEditing && msg.type !== 'image' && (!isSame || (msg.replyTo && msg.replyTo.messageId)) && (
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: isMe ? '#93c5fd' : '#2563eb', marginBottom: '6px', textAlign: 'left' }}>
              {isMe ? 'You' : msg.senderName}
            </div>
          )}

          {msg.type !== 'image' && <ReplyQuote replyTo={msg.replyTo} isMe={isMe} currentUsername={currentUsername} />}

          {isCurrentlyEditing ? (
            <div onClick={(e) => e.stopPropagation()} style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
              <textarea value={editInput} onChange={(e) => setEditInput(e.target.value)} autoFocus rows={1} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); triggerSaveEdit(msg._id); } }} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #2563eb', background: '#ffffff', color: '#0f172a', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box', resize: 'none', fontFamily: 'inherit', lineHeight: 1.4 }} />
              <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', width: '100%' }}>
                <button type="button" onClick={() => setEditingMessageId(null)} style={{ padding: '5px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#ffffff', fontSize: '0.75rem', color: '#64748b', cursor: 'pointer', fontWeight: 500 }}>Cancel</button>
                <button type="button" onClick={() => triggerSaveEdit(msg._id)} style={{ padding: '5px 14px', borderRadius: '6px', border: 'none', background: '#2563eb', fontSize: '0.75rem', color: '#ffffff', fontWeight: 600, cursor: 'pointer' }}>Save</button>
              </div>
            </div>
          ) : msg.type === 'image' && msg.attachment ? (
            <div style={{ position: 'relative', width: '265px', height: '265px', borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px', overflow: 'hidden', display: 'block', boxShadow: '0 2px 12px rgba(15,23,42,0.1)' }}>
              <img src={msg.attachment} alt="Attachment" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', padding: '10px 12px', background: 'linear-gradient(to bottom, rgba(15,23,42,0.6) 0%, rgba(15,23,42,0) 100%)', display: 'flex', justifyContent: 'flex-start', boxSizing: 'border-box', pointerEvents: 'none' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.01em', textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}>{isMe ? 'You' : msg.senderName}</span>
              </div>
              <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', padding: '12px 12px 6px 12px', background: 'linear-gradient(to top, rgba(15,23,42,0.65) 0%, rgba(15,23,42,0) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px', boxSizing: 'border-box', pointerEvents: 'none' }}>
                <span style={{ fontSize: '0.64rem', color: '#ffffff', fontWeight: 500, textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}>{new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                {isMe && (
                  <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                    {msg.readBy?.length > 0 ? (
                      <><Check size={12} strokeWidth={3} color="#93c5fd" /><Check size={12} strokeWidth={3} color="#93c5fd" style={{ marginLeft: -6 }} /></>
                    ) : msg.delivered ? (
                      <><Check size={12} strokeWidth={3} color="#ffffff" /><Check size={12} strokeWidth={3} color="#ffffff" style={{ marginLeft: -6 }} /></>
                    ) : <Check size={12} strokeWidth={3} color="#ffffff" />}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 2, width: "100%", padding: isVoiceMemoFile ? '0 10px 4px 10px' : '0px' }}>
              {msg.type === 'video' && msg.attachment ? (
                <PremiumVideoPlayer src={msg.attachment} />
              ) : isVoiceMemoFile && msg.attachment ? (
                <AudioPlayer src={msg.attachment} msgId={msg._id} isMe={isMe} triggerDelete={triggerDelete} msg={msg} chatProps={chatProps} finalAvatarUrl={finalAvatarUrl} onDurationChange={setAudioDuration} />
              ) : msg.type === 'file' && msg.attachment ? (
                <a href={msg.attachment} download style={{ display: 'flex', alignItems: 'center', gap: '8px', color: isMe ? '#fff' : '#2563eb', fontSize: '0.75rem', background: isMe ? 'rgba(255,255,255,0.18)' : '#f1f5f9', padding: '8px 12px', borderRadius: '8px', marginTop: '4px' }}>📁 Download</a>
              ) : (
                <span style={{ display: "block", lineHeight: 1.45, whiteSpace: "pre-wrap", overflowWrap: "break-word", textAlign: 'left' }}>{msg.message}</span>
              )}
              
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "6px", fontSize: "0.64rem", color: isMe ? "rgba(255,255,255,0.7)" : "#94a3b8" }}>
                {isVoiceMemoFile ? (
                  <div style={{ display: "flex", alignItems: "center", gap: '3px' }}>
                    <Mic size={11} strokeWidth={2.2} />
                    <span>{formatTime(audioDuration)}</span>
                  </div>
                ) : <div />}

                <div style={{ display: "flex", alignItems: "center", gap: '4px', marginLeft: "auto" }}>
                  <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                  {isMe && (
                    <span style={{ display: 'inline-flex' }}>
                      {msg.readBy?.length > 0 ? <Check size={12} strokeWidth={3} color="#93c5fd" /> : <Check size={12} strokeWidth={3} />}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
        {Object.keys(reactionGroups).length > 0 && (
          <div style={{ display: 'flex', gap: '3px', marginTop: '-7px', marginBottom: '2px', alignSelf: isMe ? 'flex-end' : 'flex-start', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '2px 7px', boxShadow: '0 2px 6px rgba(15,23,42,0.08)', zIndex: 10, cursor: 'pointer' }}>
            {Object.entries(reactionGroups).map(([emo, data]) => (
              <span key={emo} onMouseEnter={() => setHoveredBadgeEmoji(emo)} onMouseLeave={() => setHoveredBadgeEmoji(null)} style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', position: 'relative', fontSize: '0.78rem' }}>
                <span>{emo}</span>
                {data.count > 1 && <span style={{ fontSize: '0.66rem', color: '#64748b', fontWeight: 700 }}>{data.count}</span>}
                {hoveredBadgeEmoji === emo && (
                  <div style={{ position: 'absolute', bottom: '135%', [isMe ? 'right' : 'left']: '0px', background: '#0f172a', color: '#ffffff', padding: '6px 10px', borderRadius: '8px', fontSize: '0.7rem', display: 'flex', flexDirection: 'column', gap: '2px', boxShadow: '0 4px 12px rgba(15,23,42,0.15)', zIndex: 99999, minWidth: '110px', pointerEvents: 'none' }}>
                    <span style={{ fontWeight: 700, borderBottom: '1px solid rgba(255,255,255,0.15)', paddingBottom: '2px', marginBottom: '2px', textTransform: 'uppercase', color: '#94a3b8', fontSize: '0.58rem' }}>Reactions</span>
                    {data.users.map((name, i) => (<span key={i} style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 500, display: 'block' }}>👤 {name}</span>))}
                  </div>
                )}
              </span>
            ))}
          </div>
        )}
      </div>

      {showActionMenu && !isCurrentlyEditing && createPortal(
        <div ref={menuRef} onClick={(e) => e.stopPropagation()} style={{ position: 'fixed', top: `${menuCoords.top - window.scrollY}px`, left: `${menuCoords.left - window.scrollX}px`, display: 'flex', flexDirection: 'column', background: '#ffffff', padding: '6px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 12px 30px rgba(0,0,0,0.15)', zIndex: 9999999, minWidth: '220px', animation: 'smoothSpringMenu 0.22s cubic-bezier(0.34, 1.56, 0.64, 1) forwards' }}>
          <div style={{ display: 'flex', gap: '8px', padding: '6px 10px', borderBottom: '1px solid #f1f5f9', justifyContent: 'space-between' }}>
            {REACTION_OPTIONS.map(emoji => (
              <button key={emoji} onClick={() => { triggerAddReaction(msg._id, emoji); setShowActionMenu(false); }} style={{ background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer', transition: 'transform 0.1s' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.25)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>{emoji}</button>
            ))}
          </div>
          
          <button onClick={() => { if (startReply) startReply(msg); setShowActionMenu(false); }} style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '10px 12px', border: 'none', background: 'none', color: '#475569', fontSize: '0.82rem', cursor: 'pointer', textAlign: 'left' }}><CornerUpLeft size={14} /> Reply</button>
          
          {/* 🚀 RESTRICTION SECURED: The Copy action will strictly ONLY show up if the item is a plain text message string */}
          {msg.type === 'text' && (
            <button onClick={(e) => { handleCopyMessageTextContent(e); setShowActionMenu(false); }} style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '10px 12px', border: 'none', background: 'none', color: '#475569', fontSize: '0.82rem', cursor: 'pointer', textAlign: 'left' }}><Copy size={14} /> Copy Message Content</button>
          )}

          {/* 🚀 RESTRICTION SECURED: The Multi-Select trigger tool option will ONLY show up if you own this message row (`isMe`) */}
          {isMe && (
            <button onClick={() => { if (setIsSelectionMode) { setIsSelectionMode(true); if (toggleSelectMessage) toggleSelectMessage(msg._id); } setShowActionMenu(false); }} style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '10px 12px', border: 'none', background: 'none', color: '#475569', fontSize: '0.82rem', cursor: 'pointer', textAlign: 'left' }}><Check size={14} /> Select Multiple Messages</button>
          )}

          {isMe && !isVoiceMemoFile && msg.type === 'text' && (
            <button onClick={() => { if (setEditingMessageId) { setEditingMessageId(msg._id); setEditInput(msg.message || ''); } setShowActionMenu(false); }} style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '10px 12px', border: 'none', background: 'none', color: '#475569', fontSize: '0.82rem', cursor: 'pointer', textAlign: 'left' }}><Edit2 size={14} /> Edit Message</button>
          )}
          {isMe && (
            <button onClick={() => { triggerDelete(msg._id); setShowActionMenu(false); }} style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '10px 12px', border: 'none', background: 'none', color: '#ef4444', fontSize: '0.82rem', cursor: 'pointer', textAlign: 'left' }}><Trash2 size={14} /> Delete</button>
          )}
        </div>, document.body
      )}

      {showActionMenu && createPortal(
        <div onClick={() => setShowActionMenu(false)} style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'transparent', zIndex: 9999998 }} />, document.body
      )}
    </div>
  );
};
