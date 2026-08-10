import React, { useState, useRef, useEffect } from 'react';
import { Smile, Paperclip, Square, Mic, ArrowUp, X, FileText, AudioLines, Image, MapPin } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import { ReplyPreview } from './ReplyPreview';

export const ChatInputForm = ({ chatProps }) => {
  const {
    message, setMessage, showEmojiPicker, setShowEmojiPicker,
    selectedFile, setSelectedFile, handleInputChange, handleFileChange,
    handleSendMessage, socket, currentRoom, currentUserId,
    replyingMessage, cancelReply, isUploading
  } = chatProps || {};

  const [localRecording, setLocalRecording] = useState(false);
  const [localDuration, setLocalDuration] = useState(0);
  const [isRecordPaused, setIsRecordPaused] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);

  // 🎯 Dynamic UI Audio Wave Tracking States
  const [waveHeights, setWaveHeights] = useState(Array(18).fill(12));

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);
  const streamRef = useRef(null);
  const formRef = useRef(null);
  const recordingStartTimeRef = useRef(0);
  const fileInputRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);

  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (audioContextRef.current) audioContextRef.current.close().catch(() => { });
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

    const droppedFiles = e.dataTransfer.files;
    const syntheticEvent = { target: { files: droppedFiles } };
    handleUniversalFileChange(syntheticEvent);
  };

  // 🎯 FIXED: Properly checks if 'files' exists and extracts the first array item safely to prevent crashes
  const handleUniversalFileChange = (e) => {
    const files = e?.target?.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const fileType = file.type ? file.type.toLowerCase() : '';
    const fileName = file.name ? file.name.toLowerCase() : '';
    const objectUrl = URL.createObjectURL(file);

    setShowAttachmentMenu(false); // Close dropdown menu overlay upon selection

    if (fileType.startsWith('image/')) {
      setSelectedFile({ name: file.name, url: objectUrl, type: 'image' });
    } else if (fileType.startsWith('video/')) {
      if (file.size > 15 * 1024 * 1024) {
        alert("Video file size cannot exceed 15MB parameters.");
        return;
      }
      setSelectedFile({ name: file.name, url: objectUrl, type: 'video' });
    } else if (fileType.startsWith('audio/')) {
      setSelectedFile({ name: file.name, url: objectUrl, type: 'audio', durationText: 'Audio track' });
    } else {
      // Handles PDF, Office documents, ZIP, RAR, etc.
      setSelectedFile({ name: file.name, url: objectUrl, type: 'file' });
    }
  };

  const handleShareLocationCoordinates = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowAttachmentMenu(false);

    if (!navigator.geolocation) {
      alert("Geolocation utilities are not supported by this browser configuration.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const mapsLinkString = `📍 Current Location: https://google.com{lat},${lng}`;

        if (socket && currentRoom) {
          const roomId = currentRoom.id || currentRoom._id;
          socket.emit('send_message', {
            room: roomId,
            senderId: currentUserId,
            senderName: chatProps?.currentUsername || "Support Officer",
            message: mapsLinkString,
            type: "text",
            createdAt: new Date()
          });
          if (setMessage) setMessage('');
        }
      },
      () => {
        alert("Unable to fetch exact hardware GPS coordinate positioning safely.");
      },
      { enableHighAccuracy: true, timeout: 7000 }
    );
  };

  // 🎯 Dynamic Sound Wave Engine: Reads raw microphone decibels continuously
  const visualizeLiveMicrophoneStream = () => {
    if (!analyserRef.current) return;
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const updateWaveData = () => {
      if (!localRecording && !analyserRef.current) return;
      analyserRef.current.getByteFrequencyData(dataArray);

      // Map raw spectrum amplitudes down to 18 clean bar height percentages
      const nextHeights = Array.from({ length: 18 }, (_, i) => {
        const value = dataArray[Math.floor(i * (bufferLength / 18))] || 0;
        // Clamp height calculation constraints between 4px minimum and 32px maximum
        return Math.max(4, Math.min(32, (value / 255) * 32));
      });

      setWaveHeights(nextHeights);
      animationFrameRef.current = requestAnimationFrame(updateWaveData);
    };

    updateWaveData();
  };

  const localStartRecordingAction = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    audioChunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      streamRef.current = stream;

      // 🎯 Route audio track down into standard HTML5 Web Audio Analyser
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      const audioContext = new AudioContextClass();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);

      analyser.fftSize = 64;
      source.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      recorder.onstop = () => {
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        if (audioContextRef.current) audioContextRef.current.close().catch(() => { });

        const timeElapsedInMs = Date.now() - recordingStartTimeRef.current;
        const totalDurationSeconds = Math.round(timeElapsedInMs / 1000) || 1;
        let durationLabel = `${totalDurationSeconds} sec`;

        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm;codecs=opus' });
        const efficientObjectUrl = URL.createObjectURL(audioBlob);
        if (setSelectedFile) {
          setSelectedFile({ name: `Voice Note`, url: efficientObjectUrl, rawFile: audioBlob, type: 'audio', durationText: durationLabel });
        }
        stream.getTracks().forEach(track => track.stop());
        setLocalRecording(false);

        stream.getTracks().forEach(track => track.stop());
        setLocalRecording(false);
        setIsRecordPaused(false);
      };

      recordingStartTimeRef.current = Date.now();
      recorder.start(100);
      setLocalRecording(true);

      // Ignite live canvas animation triggers instantly
      visualizeLiveMicrophoneStream();
    } catch (err) {
      console.error("Microphone configuration access blocked:", err);
    }
  };

  const localStopRecordingAction = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };
  const toggleRecordingPauseAction = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!mediaRecorderRef.current) return;

    if (mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setIsRecordPaused(true);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);

      // 🎯 PATCH: Cancels the soundwave animation loop instantly to freeze the waves
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    } else if (mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.play?.() || mediaRecorderRef.current.resume();
      setIsRecordPaused(false);

      recordingTimerRef.current = setInterval(() => {
        const totalElapsedSeconds = Math.floor((Date.now() - recordingStartTimeRef.current) / 1000);
        setLocalDuration(totalElapsedSeconds);
      }, 250);

      // 🎯 PATCH: Restarts the soundwave animation loop smoothly when resuming
      visualizeLiveMicrophoneStream();
    }
  };
  // 🎯 PATCH: Handles discarding the live recording and resetting your stream contexts safely
  const localCancelRecordingAction = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (mediaRecorderRef.current) {
      // Temporarily clear the onstop handler so it doesn't trigger a file preview card load
      mediaRecorderRef.current.onstop = null;
      if (mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    }

    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (audioContextRef.current) audioContextRef.current.close().catch(() => { });
    if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());

    // Reset all recording variables to default resting state values
    setLocalRecording(false);
    setIsRecordPaused(false);
    setLocalDuration(0);
    setWaveHeights(Array(18).fill(12));
  };


  const formatRecordingTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remain = secs % 60;
    return `${mins}:${remain < 10 ? '0' : ''}${remain}`;
  };
  return (
    <div style={{ background: 'var(--bg-card, #ffffff)', borderTop: '1px solid var(--border-color, #e2e8f0)', position: 'relative', fontFamily: 'inherit' }}>
      <style>{`
        .whatsapp-attach-btn { display: flex; align-items: center; gap: 10px; width: 100%; padding: 10px 14px; border: none; background: transparent; color: #475569; font-size: 0.8rem; font-weight: 500; cursor: pointer; text-align: left; transition: background 0.15s ease; }
        .whatsapp-attach-btn:hover { background: #f1f5f9; }
        .custom-input-scroll::-webkit-scrollbar { width: 4px; }
        .custom-input-scroll::-webkit-scrollbar-track { background: transparent; }
        .custom-input-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        .live-mic-wave-bar { width: 3px; background: #ef4444; border-radius: 2px; transition: height 0.05s ease; transform-origin: center; }
        @keyframes recordingIndicatorFlash { from { opacity: 1; } to { opacity: 0.3; } }
        @keyframes containerPulseGlow { 0% { box-shadow: 0 1px 3px rgba(15,23,42,0.03); } 50% { box-shadow: 0 0 8px rgba(239, 68, 68, 0.2); } 100% { box-shadow: 0 1px 3px rgba(15,23,42,0.03); } }
        @keyframes mediaCardReveal { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes supportDeskUploadSpin { to { transform: rotate(360deg); } }
      `}</style>

      {replyingMessage && (
        <ReplyPreview replyingMessage={replyingMessage} onCancel={cancelReply} currentUsername={chatProps?.currentUsername} />
      )}

      {/* WHATSAPP STYLE ATTACHMENTS POP-UP DROPDOWN MENU */}
      {showAttachmentMenu && (
        <div style={{
          position: 'absolute', bottom: 'calc(100% + 8px)', left: '44px',
          background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px',
          boxShadow: '0 8px 24px rgba(15, 23, 42, 0.12)', zIndex: 10005,
          width: '175px', overflow: 'hidden', display: 'flex', flexDirection: 'column',
          animation: 'mediaCardReveal 0.18s cubic-bezier(0.16, 1, 0.3, 1) forwards'
        }}>
          <button type="button" onClick={() => { fileInputRef.current.accept = ".pdf,.doc,.docx,.xls,.xlsx,.zip,.rar,.7z"; fileInputRef.current.click(); }} className="whatsapp-attach-btn">
            <FileText size={15} color="#2563eb" /> <span>Document File</span>
          </button>
          <button type="button" onClick={() => { fileInputRef.current.accept = "image/*,video/*"; fileInputRef.current.click(); }} className="whatsapp-attach-btn">
            <Image size={15} color="#ec4899" /> <span>Photo or Video</span>
          </button>
          <button type="button" onClick={handleShareLocationCoordinates} className="whatsapp-attach-btn" style={{ borderTop: '1px solid #f1f5f9' }}>
            <MapPin size={15} color="#22c55e" /> <span>Share Location</span>
          </button>
        </div>
      )}

      <input type="file" ref={fileInputRef} onChange={handleUniversalFileChange} style={{ display: 'none' }} />

      {showEmojiPicker && (
        <div style={{ position: 'absolute', bottom: '100%', left: '12px', zIndex: 10000, paddingBottom: '12px', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.05))' }}>
          <EmojiPicker onEmojiClick={(ed) => {
            if (chatProps?.emojiTargetMessageId) {
              chatProps.triggerAddReaction?.(chatProps.emojiTargetMessageId, ed.emoji);
              chatProps.setEmojiTargetMessageId?.(null);
            } else {
              setMessage(p => p + ed.emoji);
            }
            setShowEmojiPicker(false);
          }} width={300} height={360} searchDisabled previewConfig={{ showPreview: false }} />
        </div>
      )}

      {/* Selected File Pre-send Staging Card row */}
      {selectedFile && (
        <div style={{ background: '#ffffff', padding: '10px 14px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', animation: 'mediaCardReveal 0.2s ease-out', position: 'relative' }}>
          {isUploading && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(255, 255, 255, 0.85)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', backdropFilter: 'blur(2px)' }}>
              <div style={{ width: '14px', height: '14px', border: '2px solid #e2e8f0', borderTop: '2px solid #2563eb', borderRadius: '50%', animation: 'supportDeskUploadSpin 0.7s linear infinite' }} />
              <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#2563eb' }}>Processing Media...</span>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
            {selectedFile.type === 'image' ? (
              <div style={{ position: 'relative', width: 'auto', maxWidth: '54px', height: '38px', overflow: 'hidden', border: '1px solid #e2e8f0', flexShrink: 0, background: '#f8fafc' }}>
                <img src={selectedFile.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </div>
            ) : selectedFile.type === 'video' ? (
              <div style={{ position: 'relative', width: 'auto', maxWidth: '54px', height: '38px', overflow: 'hidden', border: '1px solid #e2e8f0', flexShrink: 0, background: '#000000' }}>
                <video src={selectedFile.url} muted autoPlay loop playsInline style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </div>
            ) : selectedFile.type === 'audio' ? (
              <div style={{ width: '36px', height: '36px', borderRadius: '4px', background: 'rgba(37, 99, 235, 0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb', flexShrink: 0 }}>
                <AudioLines size={16} strokeWidth={2} />
              </div>
            ) : (
              <div style={{ width: '36px', height: '36px', borderRadius: '4px', background: 'rgba(37, 99, 235, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb', flexShrink: 0 }}>
                <FileText size={16} />
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1, textAlignment: 'left', textAlign: 'left' }}>
              <span style={{ fontSize: '0.58rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                {selectedFile.type === 'video' ? 'Video Clip' : selectedFile.type === 'audio' ? 'Voice Memo' : 'Attachment Asset'}
              </span>
              <span style={{ fontSize: '0.78rem', color: '#0f172a', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {selectedFile.name}
              </span>
            </div>
          </div>
          <button type="button" onClick={() => setSelectedFile(null)} style={{ border: 'none', background: 'rgba(239, 68, 68, 0.06)', width: '24px', height: '24px', borderRadius: '4px', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={13} strokeWidth={2.5} />
          </button>
        </div>
      )}

      {/* Main Composition Entry Bar Form Wrapper */}
      <form ref={formRef} onSubmit={handleSendMessage} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} style={{ margin: '10px 12px', padding: '6px 10px', display: 'flex', flexDirection: 'row', alignItems: 'flex-end', gap: '8px', background: isDragging ? '#f0f7ff' : '#ffffff', border: isDragging ? '1px dashed #2563eb' : '1px solid #e2e8f0', borderRadius: '6px', boxSizing: 'border-box', boxShadow: '0 1px 3px rgba(15, 23, 42, 0.03)', transition: 'all 0.2s ease', animation: localRecording ? 'containerPulseGlow 2s infinite ease-in-out' : 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1px', flexShrink: 0, opacity: isDragging ? 0.2 : 1 }}>
          <button type="button" disabled={localRecording} onClick={() => { setShowEmojiPicker(!showEmojiPicker); setShowAttachmentMenu(false); }} style={{ border: 'none', background: 'transparent', color: localRecording ? '#cbd5e1' : '#64748b', cursor: localRecording ? 'not-allowed' : 'pointer', width: '30px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px' }}><Smile size={16} /></button>

          <button type="button" disabled={localRecording} onClick={() => { setShowAttachmentMenu(!showAttachmentMenu); setShowEmojiPicker(false); }} style={{ border: 'none', background: 'transparent', color: localRecording ? '#cbd5e1' : '#64748b', cursor: localRecording ? 'not-allowed' : 'pointer', width: '30px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px' }}><Paperclip size={16} /></button>

          {localRecording ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
              {/* 🎯 Pause / Resume Button Icon Toggler */}
              <button
                type="button"
                onClick={toggleRecordingPauseAction}
                style={{
                  border: 'none',
                  background: isRecordPaused ? '#2563eb' : '#f1f5f9',
                  color: isRecordPaused ? '#ffffff' : '#475569',
                  cursor: 'pointer',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  fontSize: '0.75rem',
                  fontWeight: 'bold',
                  transition: 'all 0.2s'
                }}
                title={isRecordPaused ? "Resume Recording" : "Pause Recording"}
              >
                {isRecordPaused ? "▶" : "||"}
              </button>

              {/* 🎯 Stop & Save Voice Blob Check Indicator Button */}
              <button
                type="button"
                onClick={localStopRecordingAction}
                style={{
                  border: 'none',
                  background: '#ef4444',
                  color: '#ffffff',
                  cursor: 'pointer',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  transition: 'all 0.2s'
                }}
                title="Finish and Save"
              >
                <Square size={11} fill="currentColor" />
              </button>
            </div>
          ) : !message?.trim() && !selectedFile && (

            <button type="button" onClick={localStartRecordingAction} style={{ border: 'none', background: 'transparent', color: '#64748b', cursor: 'pointer', width: '30px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px' }} title="Record audio note"><Mic size={16} /></button>
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0, display: 'flex' }}>
          {localRecording ? (
            <div style={{
              flex: 1,
              height: '34px',
              background: 'rgba(239, 68, 68, 0.02)',
              border: '1px solid rgba(239, 68, 68, 0.08)',
              borderRadius: '18px',
              display: 'flex',
              alignItems: 'center',
              padding: '0 10px',
              boxSizing: 'border-box',
              gap: '10px',
              width: '100%'
            }}>

              {/* 🎯 CONSOLIDATED TRACKER: Replaced 'REC' word with a flashing pulse dot paired directly with your timer */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                flexShrink: 0,
                background: '#f8fafc',
                padding: '3px 8px',
                borderRadius: '12px',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: '#ef4444',
                  animation: isRecordPaused ? 'none' : 'recordingIndicatorFlash 0.6s infinite alternate'
                }} />
                <span style={{
                  fontSize: '0.72rem',
                  color: isRecordPaused ? '#64748b' : '#0f172a',
                  fontWeight: 700,
                  fontVariantNumeric: 'tabular-nums',
                  whiteSpace: 'nowrap'
                }}>
                  {formatRecordingTime(localDuration)}
                </span>
              </div>

              {/* Max-width real-time audio fluctuating wave track lane */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '2px',
                flex: 1,
                justifyContent: 'center',
                height: '32px',
                minWidth: 0,
                overflow: 'hidden',
                padding: '0 2px'
              }}>
                {waveHeights.map((barHeight, i) => (
                  <div
                    key={i}
                    className="live-mic-wave-bar"
                    style={{
                      height: `${isRecordPaused ? 8 : barHeight}px`,
                      width: '2px', // Compact bar width footprint
                      background: isRecordPaused ? '#cbd5e1' : '#ef4444',
                      transition: isRecordPaused ? 'height 0.2s ease, background 0.2s' : 'height 0.05s ease',
                      flexShrink: 0
                    }}
                  />
                ))}
              </div>

              {/* Compact Far-Right Trash Discard Option Button Trigger */}
              <button
                type="button"
                onClick={localCancelRecordingAction}
                style={{
                  border: 'none',
                  background: 'rgba(239, 68, 68, 0.06)',
                  color: '#ef4444',
                  cursor: 'pointer',
                  width: '26px',
                  height: '26px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  flexShrink: 0,
                  transition: 'background 0.2s'
                }}
                title="Discard Recording"
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.12)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.06)'}
              >
                <X size={13} strokeWidth={2.5} />
              </button>
            </div>
          ) : (
            <textarea


              value={message}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Message"
              rows={1}
              style={{ width: '100%', border: 'none', outline: 'none', resize: 'none', padding: '8px 0', fontSize: '0.9rem', color: '#0f172a', background: 'transparent', maxHeight: '100px', overflowY: 'auto' }}
              className="custom-input-scroll"
            />
          )}
        </div>

        {!localRecording && (message?.trim() || selectedFile) && (
          <button type="submit" style={{ border: 'none', background: '#2563eb', color: '#ffffff', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><ArrowUp size={18} strokeWidth={3} /></button>
        )}
      </form>
    </div>
  );
};
