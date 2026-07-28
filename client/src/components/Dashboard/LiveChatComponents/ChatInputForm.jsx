import React, { useState, useRef, useEffect } from 'react';
import { Smile, Paperclip, Square, Mic, ArrowUp, X, FileText, AudioLines } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import { ReplyPreview } from './ReplyPreview'; 

export const ChatInputForm = ({ chatProps }) => {
  const { 
    message, setMessage, showEmojiPicker, setShowEmojiPicker, selectedFile, 
    setSelectedFile, handleInputChange, handleFileChange, handleSendMessage, 
    socket, currentRoom, currentUserId, replyingMessage, cancelReply, isUploading 
  } = chatProps || {};

  const [localRecording, setLocalRecording] = useState(false);
  const [localDuration, setLocalDuration] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);
  const streamRef = useRef(null);
  const formRef = useRef(null);
  const recordingStartTimeRef = useRef(0);

  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    };
  }, []);

  useEffect(() => {
    if (localRecording) {
      setLocalDuration(0);
      recordingTimerRef.current = setInterval(() => {
        const totalElapsedSeconds = Math.floor((Date.now() - recordingStartTimeRef.current) / 1000);
        setLocalDuration(totalElapsedSeconds);
      }, 250);
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
    const droppedFile = e.dataTransfer.files;
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
            setSelectedFile({ name: `Voice Note`, url: reader.result, type: 'audio', durationText: durationLabel });
          }
        };
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach(track => track.stop());
        setLocalRecording(false);
      };
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
    <div style={{ background: 'var(--bg-card, #ffffff)', borderTop: '1px solid var(--border-color, #e2e8f0)', position: 'relative', fontFamily: 'inherit' }}>
      <style>{`
        @keyframes voiceWavePulse { 0%, 100% { transform: scaleY(0.3); } 50% { transform: scaleY(1); } }
        @keyframes containerPulseGlow { 0%, 100% { box-shadow: 0 4px 12px rgba(244, 63, 94, 0.05); } 50% { box-shadow: 0 4px 16px rgba(244, 63, 94, 0.15); } }
        @keyframes recordingIndicatorFlash { 0% { opacity: 0.3; } 100% { opacity: 1; } }
        @keyframes mediaCardReveal { 0% { opacity: 0; transform: translateY(6px); } 100% { opacity: 1; transform: translateY(0); } }
        .custom-input-scroll::-webkit-scrollbar { width: 4px; }
        .custom-input-scroll::-webkit-scrollbar-track { background: transparent; }
        .custom-input-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
      `}</style>

      <ReplyPreview replyingMessage={replyingMessage} onCancel={cancelReply} />

      {showEmojiPicker && (
        <div style={{ position: 'absolute', bottom: '100%', left: '12px', zIndex: 10000, paddingBottom: '12px', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.05))' }}>
          <EmojiPicker 
            onEmojiClick={(ed) => {
              if (chatProps?.emojiTargetMessageId) {
                chatProps.triggerAddReaction?.(chatProps.emojiTargetMessageId, ed.emoji);
                chatProps.setEmojiTargetMessageId?.(null);
              } else {
                setMessage(p => p + ed.emoji);
              }
              setShowEmojiPicker(false);
            }} 
            width={300} 
            height={360} 
            searchDisabled 
            previewConfig={{ showPreview: false }} 
          />
        </div>
      )}

      {selectedFile && (
        <div style={{ background: '#ffffff', padding: '10px 14px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', animation: 'mediaCardReveal 0.2s ease-out', position: 'relative' }}>
          {isUploading && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(255, 255, 255, 0.85)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', backdropFilter: 'blur(2px)' }}>
              <style>{` @keyframes supportDeskUploadSpin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } } `}</style>
              <div style={{ width: '14px', height: '14px', border: '2px solid #e2e8f0', borderTop: '2px solid #2563eb', borderRadius: '50%', animation: 'supportDeskUploadSpin 0.7s linear infinite' }} />
              <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#2563eb' }}>Processing Media...</span>
            </div>
          )}
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
            {selectedFile.type === 'image' ? (
              /* 🎯 FIXED PORTRAIT PREVIEW: Width auto + contain tells the staging card to show full true aspect ratio with zero squish */
              <div style={{ position: 'relative', width: 'auto', maxWidth: '54px', height: '38px', overflow: 'hidden', border: '1px solid #e2e8f0', flexShrink: 0, background: '#f8fafc' }}>
                <img src={selectedFile.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </div>
            ) : selectedFile.type === 'video' ? (
              <div style={{ position: 'relative', width: 'auto', maxWidth: '54px', height: '38px', overflow: 'hidden', border: '1px solid #e2e8f0', flexShrink: 0, background: '#000000' }}>
                <video src={selectedFile.url} muted autoPlay loop playsInline style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </div>
            ) : selectedFile.type === 'audio' ? (
              <div style={{ width: '36px', height: '36px', borderRadius: '4px', background: 'rgba(37, 99, 235, 0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb', flexShrink: 0 }}>
                <AudioLines size={16} strokeWidth={2} style={{ animation: 'voiceWavePulse 1.2s infinite ease-in-out' }} />
              </div>
            ) : (
              <div style={{ width: '36px', height: '36px', borderRadius: '4px', background: 'rgba(100, 116, 139, 0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', flexShrink: 0 }}>
                <FileText size={16} />
              </div>
            )}
            
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
              <span style={{ fontSize: '0.58rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                {selectedFile.type === 'video' ? 'Video Clip' : selectedFile.type === 'audio' ? 'Voice Memo' : 'Media File'}
              </span>
              <span style={{ fontSize: '0.78rem', color: '#0f172a', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {selectedFile.type === 'audio' ? `${selectedFile.name} (${selectedFile.durationText || '0 sec'})` : selectedFile.name}
              </span>
            </div>
          </div>

          <button type="button" onClick={() => setSelectedFile(null)} style={{ border: 'none', background: 'rgba(239, 68, 68, 0.06)', width: '24px', height: '24px', borderRadius: '4px', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={13} strokeWidth={2.5} />
          </button>
        </div>
      )}
      {/* 🎯 GEOMETRIC SYSTEM INPUT TRAY */}
      <form 
        ref={formRef} 
        onSubmit={handleSendMessage} 
        onDragOver={handleDragOver} 
        onDragLeave={handleDragLeave} 
        onDrop={handleDrop} 
        style={{ 
          margin: '10px 12px', 
          padding: '6px 10px', 
          display: 'flex', 
          flexDirection: 'row', 
          alignItems: 'flex-end', 
          gap: '8px', 
          background: isDragging ? '#f0f7ff' : '#ffffff', 
          border: isDragging ? '1px dashed #2563eb' : '1px solid #e2e8f0', 
          borderRadius: '6px', 
          boxSizing: 'border-box', 
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.03)',
          transition: 'all 0.2s ease', 
          animation: localRecording ? 'containerPulseGlow 2s infinite ease-in-out' : 'none'
        }} 
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1px', flexShrink: 0, opacity: isDragging ? 0.2 : 1 }}>
          <button type="button" disabled={localRecording} onClick={() => setShowEmojiPicker(!showEmojiPicker)} style={{ border: 'none', background: 'transparent', color: localRecording ? '#cbd5e1' : '#64748b', cursor: localRecording ? 'not-allowed' : 'pointer', width: '30px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px' }}><Smile size={16} /></button>
          
          <label style={{ color: localRecording ? '#cbd5e1' : '#64748b', width: '30px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px', cursor: localRecording ? 'not-allowed' : 'pointer' }}>
            <Paperclip size={16} />
            <input type="file" accept="image/*,video/*,audio/*" onChange={handleFileChange} style={{ display: 'none' }} />
          </label>

          {localRecording ? (
            <button type="button" onClick={localStopRecordingAction} style={{ border: 'none', background: '#ef4444', color: '#ffffff', cursor: 'pointer', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px' }}><Square size={10} fill="currentColor" /></button>
          ) : !message?.trim() && (
            <button type="button" onClick={localStartRecordingAction} style={{ border: 'none', background: 'transparent', color: '#64748b', cursor: 'pointer', width: '30px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px' }} title="Record audio note"><Mic size={16} /></button>
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0, display: 'flex' }}>
          {localRecording ? (
            <div style={{ flex: 1, height: '34px', background: 'rgba(244, 63, 94, 0.02)', border: '1px solid rgba(244, 63, 94, 0.1)', borderRadius: '4px', display: 'flex', alignItems: 'center', padding: '0 10px', justifyContent: 'space-between', boxSizing: 'border-box', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#ef4444', animation: 'recordingIndicatorFlash 0.8s infinite alternate' }} />
                <span style={{ fontSize: '0.62rem', color: '#f43f5e', fontWeight: 700, letterSpacing: '0.02em' }}>REC</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '3px', flex: 1, justifyContent: 'center', height: '14px' }}>
                {[0.4, 0.8, 0.5, 0.9, 0.3, 0.7, 0.4, 0.8].map((val, i) => (
                  <div key={i} style={{ width: '2px', height: '100%', background: '#f43f5e', transformOrigin: 'center', animation: `voiceWavePulse ${0.4 + (i * 0.03)}s infinite ease-in-out alternate`, animationDelay: `${i * 0.04}s` }} />
                ))}
              </div>
              <span style={{ fontSize: '0.72rem', color: '#475569', fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>{formatRecordingTime(localDuration)}</span>
            </div>
          ) : (
            <textarea 
              className="custom-input-scroll" 
              rows={1} 
              value={isDragging ? "Drop your files here..." : message} 
              onKeyDown={handleKeyDown} 
              disabled={isDragging} 
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
              style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: '0.85rem', fontWeight: 400, color: isDragging ? '#2563eb' : '#0f172a', padding: '6px 2px', margin: 0, minWidth: 0, resize: 'none', maxHeight: '140px', lineHeight: '1.4', fontFamily: 'inherit', textAlign: isDragging ? 'center' : 'left' }} 
            />
          )}
        </div>

        <div style={{ flexShrink: 0, paddingBottom: '0px', opacity: isDragging ? 0.2 : 1 }}>
          <button 
            type="submit" 
            disabled={localRecording || (!message?.trim() && !selectedFile)} 
            style={{ width: '32px', height: '32px', border: 'none', borderRadius: '4px', background: (localRecording || (!message?.trim() && !selectedFile)) ? '#f1f5f9' : 'linear-gradient(135deg, #2563eb, #3b82f6)', color: (localRecording || (!message?.trim() && !selectedFile)) ? '#cbd5e1' : '#ffffff', cursor: (localRecording || (!message?.trim() && !selectedFile)) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
          >
            <ArrowUp size={15} strokeWidth={2.5} />
          </button>
        </div>
      </form>
    </div>
  );
};
