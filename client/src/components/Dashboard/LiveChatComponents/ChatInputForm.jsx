import React, { useState, useRef, useEffect } from 'react';
import { Smile, Paperclip, Square, Mic, ArrowUp, X, FileText, AudioLines } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import { ReplyPreview } from './ReplyPreview'; // 🚀 FIX: Imports the component definition to resolve 'ReplyPreview' is not defined


export const ChatInputForm = ({ chatProps }) => {
  const {
    message, setMessage, showEmojiPicker, setShowEmojiPicker, selectedFile, setSelectedFile, handleInputChange, handleFileChange, handleSendMessage, socket, currentRoom, currentUserId, replyingMessage, cancelReply,
    isUploading
  } = chatProps || {};



  const [localRecording, setLocalRecording] = useState(false);
  const [localDuration, setLocalDuration] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);
  const streamRef = useRef(null);
  const formRef = useRef(null);

  // 🚀 FIXED: High-resolution timestamp pointers to run real-time clock math
  const recordingStartTimeRef = useRef(0);

  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    };
  }, []);

  // 🚀 FIXED: Dynamic interval engine optimized to prevent asynchronous state lag
  useEffect(() => {
    if (localRecording) {
      setLocalDuration(0);
      recordingTimerRef.current = setInterval(() => {
        // Run precise clock math directly against the system's baseline hardware clock
        const totalElapsedSeconds = Math.floor((Date.now() - recordingStartTimeRef.current) / 1000);
        setLocalDuration(totalElapsedSeconds);
      }, 250); // Checks every 250ms for seamless UI updates, completely eliminating skips
    } else {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    }
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    };
  }, [localRecording]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (message?.trim() || selectedFile) {
        if (handleSendMessage) {
          handleSendMessage(e);
        } else if (formRef.current) {
          formRef.current.requestSubmit();
        }
      }
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    if (!localRecording) setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (localRecording || !e.dataTransfer.files || e.dataTransfer.files.length === 0) return;
    const droppedFile = e.dataTransfer.files[0];
    if (handleFileChange) {
      const syntheticEvent = { target: { files: [droppedFile] } };
      handleFileChange(syntheticEvent);
    }
  };

  const localStartRecordingAction = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      streamRef.current = stream;

      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        // Calculate precise runtime length straight from the high-res system clock
        const timeElapsedInMs = Date.now() - recordingStartTimeRef.current;
        const totalDurationSeconds = Math.round(timeElapsedInMs / 1000) || 1;

        let durationLabel = `${totalDurationSeconds} sec`;
        if (totalDurationSeconds >= 60) {
          const mins = Math.floor(totalDurationSeconds / 60);
          const secs = totalDurationSeconds % 60;
          durationLabel = `${mins} min${mins > 1 ? 's' : ''} ${secs} sec`;
        }

        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm;codecs=opus' });
        const reader = new FileReader();

        reader.onloadend = () => {
          if (setSelectedFile) {
            setSelectedFile({
              name: `Voice Note`,
              url: reader.result,
              type: 'audio',
              durationText: durationLabel
            });
          }
        };

        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach(track => track.stop());
        setLocalRecording(false);
      };

      // Lock in the precise start time before spinning up the audio stream engine
      recordingStartTimeRef.current = Date.now();
      recorder.start(100);
      setLocalRecording(true);

    } catch (err) {
      console.error("❌ Microphone access failed:", err);
      alert("Microphone permission denied or device inaccessible.");
    }
  };

  const localStopRecordingAction = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  const formatRecordingTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remain = secs % 60;
    return `${mins}:${remain < 10 ? '0' : ''}${remain}`;
  };

  return (
    <div style={{ background: 'var(--bg-card, #ffffff)', borderTop: '1px solid var(--border-color, #e2e8f0)', position: 'relative', fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <style>{` 
        @keyframes voiceWavePulse { 0%, 100% { transform: scaleY(0.3); } 50% { transform: scaleY(1); } } 
        @keyframes containerPulseGlow { 0%, 100% { box-shadow: 0 8px 32px rgba(244, 63, 94, 0.04), 0 0 0 1px rgba(244, 63, 94, 0.1); } 50% { box-shadow: 0 8px 32px rgba(244, 63, 94, 0.12), 0 0 0 2px rgba(244, 63, 94, 0.2); } } 
        @keyframes recordingIndicatorFlash { 0% { opacity: 0.3; transform: scale(0.9); } 100% { opacity: 1; transform: scale(1.1); } } 
        @keyframes mediaCardReveal { 0% { opacity: 0; transform: translateY(12px) scale(0.98); } 100% { opacity: 1; transform: translateY(0) scale(1); } } 
        .custom-input-scroll::-webkit-scrollbar { width: 4px; } 
        .custom-input-scroll::-webkit-scrollbar-track { background: transparent; } 
        .custom-input-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; } 
      `}</style>
      <ReplyPreview replyingMessage={replyingMessage} onCancel={cancelReply} />

      {showEmojiPicker && (
        <div style={{ position: 'absolute', bottom: '100%', left: '16px', zIndex: 10000, paddingBottom: '12px', filter: 'drop-shadow(0 12px 24px rgba(0,0,0,0.06))' }}>
          <EmojiPicker onEmojiClick={(ed) => {
            if (chatProps?.emojiTargetMessageId) {
              if (chatProps.triggerAddReaction) {
                chatProps.triggerAddReaction(chatProps.emojiTargetMessageId, ed.emoji);
              }
              if (chatProps.setEmojiTargetMessageId) {
                chatProps.setEmojiTargetMessageId(null);
              }
            } else {
              setMessage(p => p + ed.emoji);
            }
            setShowEmojiPicker(false);
          }} width={320} height={380} searchDisabled previewConfig={{ showPreview: false }} />
        </div>
      )}

      {selectedFile && (
        <div style={{ background: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(16px)', padding: '12px 20px', borderBottom: '1px solid rgba(226, 232, 240, 0.8)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', animation: 'mediaCardReveal 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards', position: 'relative' /* Essential anchor for absolute loaders */ }}>

          {/* 🚀 UPGRADED LOADING SPINNER OVERLAY: Renders gracefully over the staging preview card block */}
          {isUploading && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: 'rgba(255, 255, 255, 0.85)',
              zIndex: 50,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              borderRadius: 'inherit',
              backdropFilter: 'blur(2px)'
            }}>
              {/* Inline CSS Keyframe Style Injection */}
              <style>{`
          @keyframes supportDeskUploadSpin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
              <div style={{
                width: '18px',
                height: '18px',
                border: '2px solid #e2e8f0',
                borderTop: '2px solid #2563eb',
                borderRadius: '50%',
                animation: 'supportDeskUploadSpin 0.7s linear infinite'
              }} />
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#2563eb', letterSpacing: '-0.01em' }}>Processing Media...</span>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
            {selectedFile.type === 'image' ? (
              // ... your existing selectedfile rendering logic templates remain perfectly unchanged ...

              <div style={{ position: 'relative', width: '42px', height: '42px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #cbd5e1', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', flexShrink: 0 }}>
                <img src={selectedFile.url} alt="Staged Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            ) : selectedFile.type === 'video' ? (
              <div style={{ position: 'relative', width: '42px', height: '42px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #cbd5e1', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', flexShrink: 0, background: '#000000' }}>
                <video src={selectedFile.url} muted autoPlay loop playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            ) : selectedFile.type === 'audio' ? (
              <div style={{ width: '42px', height: '42px', borderRadius: '8px', background: 'rgba(37, 99, 235, 0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb', flexShrink: 0 }}>
                <AudioLines size={20} strokeWidth={2.5} style={{ animation: 'voiceWavePulse 1.2s infinite ease-in-out' }} />
              </div>
            ) : (
              <div style={{ width: '42px', height: '42px', borderRadius: '8px', background: 'rgba(100, 116, 139, 0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', flexShrink: 0 }}>
                <FileText size={20} />
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0, flex: 1 }}>
              <span style={{ fontSize: '0.62rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {selectedFile.type === 'video' ? 'Video Clip' : selectedFile.type === 'audio' ? 'Voice Memo' : 'Media File'}
              </span>
              <span style={{ fontSize: '0.8rem', color: '#0f172a', fontWeight: 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {selectedFile.type === 'audio' ? `${selectedFile.name} (${selectedFile.durationText || '0 sec'})` : selectedFile.name}
              </span>
            </div>
          </div>
          <button type="button" onClick={() => setSelectedFile(null)} style={{ border: 'none', background: 'rgba(239, 68, 68, 0.06)', width: '26px', height: '26px', borderRadius: '50%', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease' }} onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.12)'; e.currentTarget.style.transform = 'scale(1.08)' }} onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.06)'; e.currentTarget.style.transform = 'scale(1)' }}>
            <X size={14} strokeWidth={2.5} />
          </button>
        </div>
      )}

      <form ref={formRef} onSubmit={handleSendMessage} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} style={{ margin: '12px', padding: '8px 12px', display: 'flex', flexDirection: 'row', alignItems: 'flex-end', gap: '10px', background: isDragging ? 'rgba(239, 246, 255, 0.85)' : '#ffffff', border: isDragging ? '1px dashed #2563eb' : '1px solid #e2e8f0', borderRadius: '24px', boxSizing: 'border-box', boxShadow: isDragging ? '0 10px 25px rgba(37, 99, 235, 0.08)' : '0 8px 24px rgba(15, 23, 22, 0.03)', transition: 'all 0.23s cubic-bezier(0.4, 0, 0.2, 1)', animation: localRecording ? 'containerPulseGlow 2s infinite ease-in-out' : 'none', pointerEvents: 'auto' }} >
        <div style={{ display: 'flex', alignItems: 'center', gap: '2px', flexShrink: 0, paddingBottom: '2px', opacity: isDragging ? 0.3 : 1, transition: 'opacity 0.2s ease' }}>
          <button type="button" disabled={localRecording} onClick={() => setShowEmojiPicker(!showEmojiPicker)} style={{ border: 'none', background: 'transparent', color: localRecording ? '#cbd5e1' : '#64748b', cursor: localRecording ? 'not-allowed' : 'pointer', width: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}><Smile size={18} /></button>
          <label style={{ color: localRecording ? '#cbd5e1' : '#64748b', width: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', cursor: localRecording ? 'not-allowed' : 'pointer' }}><Paperclip size={18} /><input type="file" accept="image/*,video/*,audio/*" onChange={handleFileChange} style={{ display: 'none' }} /> </label>
          {localRecording ? (
            <button type="button" onClick={localStopRecordingAction} style={{ border: 'none', background: 'linear-gradient(135deg, #ef4444, #f43f5e)', color: '#ffffff', cursor: 'pointer', width: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}><Square size={10} fill="currentColor" /></button>
          ) : !message?.trim() && (
            <button type="button" onClick={localStartRecordingAction} style={{ border: 'none', background: 'transparent', color: '#64748b', cursor: 'pointer', width: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }} title="Record audio note"><Mic size={18} /></button>
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0, display: 'flex' }}>
          {localRecording ? (
            <div style={{ flex: 1, height: '34px', background: 'rgba(244, 63, 94, 0.02)', border: '1px solid rgba(244, 63, 94, 0.12)', borderRadius: '14px', display: 'flex', alignItems: 'center', padding: '0 12px', justifyContent: 'space-between', boxSizing: 'border-box', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444', animation: 'recordingIndicatorFlash 0.8s infinite alternate' }} />
                <span style={{ fontSize: '0.68rem', color: '#f43f5e', fontWeight: 700, letterSpacing: '0.04em' }}>REC</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '3px', flex: 1, justifyContent: 'center', height: '14px' }}>
                {[0.4, 0.8, 0.5, 0.9, 0.3, 0.7, 0.4, 0.8].map((val, i) => (
                  <div key={i} style={{ width: '2px', height: '100%', background: '#f43f5e', borderRadius: '1px', transformOrigin: 'center', animation: `voiceWavePulse ${0.4 + (i * 0.03)}s infinite ease-in-out alternate`, animationDelay: `${i * 0.04}s` }} />
                ))}
              </div>
              <span style={{ fontSize: '0.75rem', color: '#475569', fontWeight: 400, fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>{formatRecordingTime(localDuration)}</span>
            </div>
          ) : (
            <textarea
              className="custom-input-scroll"
              rows={1}
              value={isDragging ? "Drop your files here..." : message}
              onKeyDown={handleKeyDown}
              disabled={isDragging}

              /* WHATSAPP CLICK ENGINE ACCELERATOR FOCUS TRIGGER */
              onFocus={() => {
                if (socket && currentRoom) {
                  const targetRoomId = currentRoom.id || currentRoom._id;
                  socket.emit("mark_room_as_read", { room: targetRoomId, userId: currentUserId });
                }
              }}

              onChange={(e) => {
                if (handleInputChange) handleInputChange(e);
                e.target.style.height = 'auto';
                e.target.style.height = `${Math.min(e.target.scrollHeight, 140)}px`;
              }}
              placeholder="Type a message..."
              style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: '0.88rem', fontWeight: 400, color: isDragging ? '#2563eb' : '#0f172a', padding: '6px 2px', margin: 0, minWidth: 0, resize: 'none', maxHeight: '140px', lineHeight: '1.4', fontFamily: 'inherit', textAlign: isDragging ? 'center' : 'left' }}
            />
          )}
        </div>

        <div style={{ flexShrink: 0, paddingBottom: '2px', opacity: isDragging ? 0.3 : 1, transition: 'opacity 0.2s ease' }}>
          {/* Right Side: Dispatch Action Arrow */}
          <button
            type="submit"
            disabled={localRecording || (!message?.trim() && !selectedFile)}
            style={{
              width: '34px',
              height: '34px',
              border: 'none',
              borderRadius: '50%',
              background: (localRecording || (!message?.trim() && !selectedFile)) ? '#f1f5f9' : 'linear-gradient(135deg, #2563eb, #3b82f6)',
              color: (localRecording || (!message?.trim() && !selectedFile)) ? '#cbd5e1' : '#ffffff',
              cursor: (localRecording || (!message?.trim() && !selectedFile)) ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              if (!localRecording && (message?.trim() || selectedFile)) e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'none';
            }}
          >
            <ArrowUp size={16} strokeWidth={2.5} />
          </button>
        </div>
      </form>
    </div>
  );
};
