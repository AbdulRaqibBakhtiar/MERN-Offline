import React, { useState, useRef, useEffect } from 'react';
import {
  Smile,
  Paperclip,
  Square,
  Mic,
  ArrowUp,
  X,
  FileText,
  AudioLines,
  Image,
  MapPin,
} from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import { ReplyPreview } from './ReplyPreview';

export const ChatInputForm = ({ chatProps }) => {
  const {
    message,
    setMessage,
    showEmojiPicker,
    setShowEmojiPicker,
    handleInputChange,
    handleSendMessage,
    socket,
    currentRoom,
    currentUserId,
    replyingMessage,
    cancelReply,
    selectedFiles,
    setSelectedFiles,
  } = chatProps || {};

  const [localRecording, setLocalRecording] = useState(false);
  const [localDuration, setLocalDuration] = useState(0);
  const [isRecordPaused, setIsRecordPaused] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);

  // Real-time microphone wave heights
  const [waveHeights, setWaveHeights] = useState(
    Array(24).fill(5)
  );

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
  const sourceRef = useRef(null);

  // Prevent animation loops from being duplicated
  const waveRunningRef = useRef(false);

  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      if (sourceRef.current) {
        try {
          sourceRef.current.disconnect();
        } catch (_) {}
      }

      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, []);

  useEffect(() => {
    if (localRecording && !isRecordPaused) {
      recordingTimerRef.current = setInterval(() => {
        const elapsed = Math.floor(
          (Date.now() - recordingStartTimeRef.current) / 1000
        );

        setLocalDuration(elapsed);
      }, 100);
    } else {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    }

    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, [localRecording, isRecordPaused]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();

      if (message?.trim() || selectedFiles?.length > 0) {
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

    if (!localRecording) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    if (
      localRecording ||
      !e.dataTransfer.files ||
      e.dataTransfer.files.length === 0
    ) {
      return;
    }

    handleUniversalFileChange({
      target: {
        files: e.dataTransfer.files,
      },
    });
  };

  // ============================================================
  // FILE HANDLING
  // ============================================================

  const handleUniversalFileChange = (e) => {
    const files = Array.from(e?.target?.files || []);

    if (files.length === 0) {
      return;
    }

    setShowAttachmentMenu(false);

    const newFiles = [];

    for (const file of files) {
      const fileType = file.type?.toLowerCase() || '';

      if (
        fileType.startsWith('video/') &&
        file.size > 15 * 1024 * 1024
      ) {
        alert(
          `${file.name} is too large. Maximum video size is 15MB.`
        );
        continue;
      }

      const objectUrl = URL.createObjectURL(file);

      let type = 'file';

      if (fileType.startsWith('image/')) {
        type = 'image';
      } else if (fileType.startsWith('video/')) {
        type = 'video';
      } else if (fileType.startsWith('audio/')) {
        type = 'audio';
      }

      newFiles.push({
        name: file.name,
        url: objectUrl,
        rawFile: file,
        type,
        mimeType: file.type,
        size: file.size,
        ...(type === 'audio'
          ? { durationText: 'Audio track' }
          : {}),
      });
    }

    if (newFiles.length > 0) {
      setSelectedFiles((prev) => [...prev, ...newFiles]);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // ============================================================
  // LOCATION
  // ============================================================

  const handleShareLocationCoordinates = (e) => {
    e.preventDefault();
    e.stopPropagation();

    setShowAttachmentMenu(false);

    if (!navigator.geolocation) {
      alert(
        'Geolocation is not supported by this browser.'
      );
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        const mapsLinkString =
          `📍 Current Location: ` +
          `https://www.google.com/maps?q=${lat},${lng}`;

        if (socket && currentRoom) {
          const roomId =
            currentRoom.id || currentRoom._id;

          socket.emit('send_message', {
            room: roomId,
            senderId: currentUserId,
            senderName:
              chatProps?.currentUsername ||
              'Support Officer',
            message: mapsLinkString,
            type: 'text',
            createdAt: new Date(),
          });

          if (setMessage) {
            setMessage('');
          }
        }
      },
      () => {
        alert(
          'Unable to obtain your current location.'
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 7000,
      }
    );
  };

  // ============================================================
  // REAL MICROPHONE WAVEFORM
  //
  // IMPORTANT:
  // We use getByteTimeDomainData(), not frequency bins.
  //
  // This measures the actual microphone waveform and calculates
  // RMS volume every animation frame (~60fps).
  // ============================================================

  const stopWaveAnimation = () => {
    waveRunningRef.current = false;

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  };

  const startWaveAnimation = () => {
    if (!analyserRef.current) {
      return;
    }

    if (waveRunningRef.current) {
      return;
    }

    waveRunningRef.current = true;

    const analyser = analyserRef.current;

    // Time-domain buffer.
    const bufferLength = analyser.fftSize;
    const dataArray = new Uint8Array(bufferLength);

    const BAR_COUNT = 24;

    const updateWaveData = () => {
      if (
        !waveRunningRef.current ||
        !analyserRef.current
      ) {
        return;
      }

      analyser.getByteTimeDomainData(dataArray);

      // Calculate RMS amplitude from the REAL microphone signal.
      let sumSquares = 0;

      for (let i = 0; i < bufferLength; i++) {
        const normalized =
          (dataArray[i] - 128) / 128;

        sumSquares += normalized * normalized;
      }

      const rms = Math.sqrt(
        sumSquares / bufferLength
      );

      /*
       * Amplify normal speech.
       *
       * A quiet microphone can have RMS around 0.005-0.02.
       * Normal speech can be considerably higher.
       */
      const amplified = Math.min(
        1,
        rms * 8
      );

      /*
       * Smooth enough to look natural but NOT delayed.
       *
       * 0.65 current + 0.35 previous gives fast response.
       */
      setWaveHeights((previous) => {
        const next = [];

        for (let i = 0; i < BAR_COUNT; i++) {
          /*
           * Give each bar a slightly different response.
           * This creates a natural waveform instead of
           * making every bar identical.
           */
          const centerDistance =
            Math.abs(
              i - (BAR_COUNT - 1) / 2
            ) /
            ((BAR_COUNT - 1) / 2);

          const centerBoost =
            1 - centerDistance * 0.25;

          // Tiny deterministic variation.
          const variation =
            0.88 +
            ((i * 17) % 13) / 100;

          const target =
            amplified *
            30 *
            centerBoost *
            variation;

          const previousHeight =
            previous[i] || 5;

          const smoothed =
            previousHeight * 0.35 +
            Math.max(4, target) * 0.65;

          next.push(
            Math.max(
              4,
              Math.min(30, smoothed)
            )
          );
        }

        return next;
      });

      animationFrameRef.current =
        requestAnimationFrame(updateWaveData);
    };

    updateWaveData();
  };

  // ============================================================
  // START RECORDING
  // ============================================================

  const localStartRecordingAction = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (localRecording) {
      return;
    }

    audioChunksRef.current = [];

    try {
      const stream =
        await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
          video: false,
        });

      streamRef.current = stream;

      // ----------------------------------------
      // AudioContext
      // ----------------------------------------

      const AudioContextClass =
        window.AudioContext ||
        window.webkitAudioContext;

      if (!AudioContextClass) {
        throw new Error(
          'Web Audio API is not supported.'
        );
      }

      const audioContext =
        new AudioContextClass();

      audioContextRef.current = audioContext;

      // Some browsers initially suspend AudioContext.
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      const analyser =
        audioContext.createAnalyser();

      /*
       * Lower fftSize = faster responsive waveform.
       *
       * We only need amplitude, so 512 is plenty.
       */
      analyser.fftSize = 512;

      /*
       * smoothingTimeConstant is intentionally LOW.
       *
       * High values create the delayed/bouncy feeling.
       */
      analyser.smoothingTimeConstant = 0.15;

      analyser.minDecibels = -90;
      analyser.maxDecibels = -10;

      const source =
        audioContext.createMediaStreamSource(
          stream
        );

      source.connect(analyser);

      analyserRef.current = analyser;
      sourceRef.current = source;

      // ----------------------------------------
      // MediaRecorder
      // ----------------------------------------

      let mimeType = 'audio/webm;codecs=opus';

      if (
        !MediaRecorder.isTypeSupported(
          mimeType
        )
      ) {
        mimeType = 'audio/webm';
      }

      if (
        !MediaRecorder.isTypeSupported(
          mimeType
        )
      ) {
        mimeType = '';
      }

      const recorder = mimeType
        ? new MediaRecorder(stream, {
            mimeType,
          })
        : new MediaRecorder(stream);

      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (
          event.data &&
          event.data.size > 0
        ) {
          audioChunksRef.current.push(
            event.data
          );
        }
      };

      recorder.onstop = () => {
        stopWaveAnimation();

        if (sourceRef.current) {
          try {
            sourceRef.current.disconnect();
          } catch (_) {}
        }

        if (audioContextRef.current) {
          audioContextRef.current
            .close()
            .catch(() => {});
        }

        sourceRef.current = null;
        analyserRef.current = null;
        audioContextRef.current = null;

        const elapsedMs =
          Date.now() -
          recordingStartTimeRef.current;

        const totalDurationSeconds =
          Math.max(
            1,
            Math.round(elapsedMs / 1000)
          );

        const audioBlob = new Blob(
          audioChunksRef.current,
          {
            type:
              mimeType ||
              'audio/webm',
          }
        );

        const audioUrl =
          URL.createObjectURL(audioBlob);

        if (setSelectedFiles) {
          setSelectedFiles((prev) => [
            ...prev,
            {
              name: 'Voice Note',
              url: audioUrl,
              rawFile: audioBlob,
              type: 'audio',
              durationText:
                `${totalDurationSeconds} sec`,
              mimeType:
                mimeType ||
                'audio/webm',
              size: audioBlob.size,
            },
          ]);
        }

        if (streamRef.current) {
          streamRef.current
            .getTracks()
            .forEach((track) =>
              track.stop()
            );
        }

        streamRef.current = null;

        setLocalRecording(false);
        setIsRecordPaused(false);
        setLocalDuration(0);
        setWaveHeights(
          Array(24).fill(5)
        );
      };

      recordingStartTimeRef.current =
        Date.now();

      recorder.start(100);

      setLocalRecording(true);
      setIsRecordPaused(false);
      setLocalDuration(0);

      // Start immediately after recording begins.
      startWaveAnimation();
    } catch (err) {
      console.error(
        'Microphone configuration access blocked:',
        err
      );

      stopWaveAnimation();

      if (streamRef.current) {
        streamRef.current
          .getTracks()
          .forEach((track) =>
            track.stop()
          );
      }

      streamRef.current = null;

      alert(
        'Microphone access could not be started.'
      );
    }
  };

  // ============================================================
  // STOP / SAVE
  // ============================================================

  const localStopRecordingAction = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !==
        'inactive'
    ) {
      mediaRecorderRef.current.stop();
    }
  };

  // ============================================================
  // PAUSE / RESUME
  // ============================================================

  const toggleRecordingPauseAction = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const recorder =
      mediaRecorderRef.current;

    if (!recorder) {
      return;
    }

    if (recorder.state === 'recording') {
      recorder.pause();

      setIsRecordPaused(true);

      stopWaveAnimation();
    } else if (
      recorder.state === 'paused'
    ) {
      recorder.resume();

      setIsRecordPaused(false);

      /*
       * AudioContext can sometimes become suspended
       * after a pause/resume.
       */
      if (
        audioContextRef.current &&
        audioContextRef.current.state ===
          'suspended'
      ) {
        audioContextRef.current
          .resume()
          .catch(() => {});
      }

      startWaveAnimation();
    }
  };

  // ============================================================
  // CANCEL RECORDING
  // ============================================================

  const localCancelRecordingAction = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const recorder =
      mediaRecorderRef.current;

    if (recorder) {
      recorder.onstop = null;

      if (recorder.state !== 'inactive') {
        recorder.stop();
      }
    }

    stopWaveAnimation();

    if (sourceRef.current) {
      try {
        sourceRef.current.disconnect();
      } catch (_) {}
    }

    if (audioContextRef.current) {
      audioContextRef.current
        .close()
        .catch(() => {});
    }

    if (streamRef.current) {
      streamRef.current
        .getTracks()
        .forEach((track) =>
          track.stop()
        );
    }

    mediaRecorderRef.current = null;
    sourceRef.current = null;
    analyserRef.current = null;
    audioContextRef.current = null;
    streamRef.current = null;

    setLocalRecording(false);
    setIsRecordPaused(false);
    setLocalDuration(0);
    setWaveHeights(
      Array(24).fill(5)
    );
  };

  const formatRecordingTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remain = secs % 60;

    return `${mins}:${
      remain < 10 ? '0' : ''
    }${remain}`;
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div
      style={{
        background:
          'var(--bg-card, #ffffff)',
        borderTop:
          '1px solid var(--border-color, #e2e8f0)',
        position: 'relative',
        fontFamily: 'inherit',
      }}
    >
      <style>
        {`
          .whatsapp-attach-btn {
            display: flex;
            align-items: center;
            gap: 10px;
            width: 100%;
            padding: 10px 14px;
            border: none;
            background: transparent;
            color: #475569;
            font-size: 0.8rem;
            font-weight: 500;
            cursor: pointer;
            text-align: left;
            transition: background 0.15s ease;
          }

          .whatsapp-attach-btn:hover {
            background: #f1f5f9;
          }

          .custom-input-scroll::-webkit-scrollbar {
            width: 4px;
          }

          .custom-input-scroll::-webkit-scrollbar-track {
            background: transparent;
          }

          .custom-input-scroll::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 4px;
          }

          .live-mic-wave-bar {
            width: 2px;
            min-width: 2px;
            background: #ef4444;
            border-radius: 3px;
            transform-origin: center;
            will-change: height;
          }

          @keyframes recordingIndicatorFlash {
            from {
              opacity: 1;
            }

            to {
              opacity: 0.3;
            }
          }

          @keyframes containerPulseGlow {
            0% {
              box-shadow:
                0 1px 3px
                rgba(15, 23, 42, 0.03);
            }

            50% {
              box-shadow:
                0 0 8px
                rgba(239, 68, 68, 0.2);
            }

            100% {
              box-shadow:
                0 1px 3px
                rgba(15, 23, 42, 0.03);
            }
          }

          @keyframes mediaCardReveal {
            from {
              opacity: 0;
              transform: translateY(5px);
            }

            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>

      {/* ======================================================
          REPLY PREVIEW
      ====================================================== */}

      {replyingMessage && (
        <ReplyPreview
          replyingMessage={replyingMessage}
          onCancel={cancelReply}
          currentUsername={
            chatProps?.currentUsername
          }
        />
      )}

      {/* ======================================================
          ATTACHMENT MENU
      ====================================================== */}

      {showAttachmentMenu && (
        <div
          style={{
            position: 'absolute',
            bottom: 'calc(100% + 8px)',
            left: '44px',
            background: '#ffffff',
            border:
              '1px solid #e2e8f0',
            borderRadius: '12px',
            boxShadow:
              '0 8px 24px rgba(15, 23, 42, 0.12)',
            zIndex: 10005,
            width: '175px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            animation:
              'mediaCardReveal 0.18s cubic-bezier(0.16, 1, 0.3, 1) forwards',
          }}
        >
          <button
            type="button"
            className="whatsapp-attach-btn"
            onClick={() => {
              fileInputRef.current.accept =
                '.pdf,.doc,.docx,.xls,.xlsx,.zip,.rar,.7z';

              fileInputRef.current.click();

              setShowAttachmentMenu(false);
            }}
          >
            <FileText
              size={15}
              color="#2563eb"
            />

            <span>
              Document File
            </span>
          </button>

          <button
            type="button"
            className="whatsapp-attach-btn"
            onClick={() => {
              fileInputRef.current.accept =
                'image/*,video/*';

              fileInputRef.current.click();

              setShowAttachmentMenu(false);
            }}
          >
            <Image
              size={15}
              color="#ec4899"
            />

            <span>
              Photo or Video
            </span>
          </button>

          {/* AUDIO */}
          <button
            type="button"
            className="whatsapp-attach-btn"
            onClick={() => {
              fileInputRef.current.accept =
                'audio/*';

              fileInputRef.current.click();

              setShowAttachmentMenu(false);
            }}
          >
            <AudioLines
              size={15}
              color="#8b5cf6"
            />

            <span>
              Audio
            </span>
          </button>

          <button
            type="button"
            className="whatsapp-attach-btn"
            onClick={
              handleShareLocationCoordinates
            }
            style={{
              borderTop:
                '1px solid #f1f5f9',
            }}
          >
            <MapPin
              size={15}
              color="#22c55e"
            />

            <span>
              Share Location
            </span>
          </button>
        </div>
      )}

      {/* Hidden file input */}

      <input
        type="file"
        ref={fileInputRef}
        multiple
        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.zip,.rar,.7z"
        onChange={
          handleUniversalFileChange
        }
        style={{
          display: 'none',
        }}
      />

      {/* ======================================================
          EMOJI PICKER
      ====================================================== */}

      {showEmojiPicker && (
        <div
          style={{
            position: 'absolute',
            bottom: '100%',
            left: '12px',
            zIndex: 10000,
            paddingBottom: '12px',
            filter:
              'drop-shadow(0 4px 12px rgba(0,0,0,0.05))',
          }}
        >
          <EmojiPicker
            onEmojiClick={(emojiData) => {
              if (
                chatProps?.emojiTargetMessageId
              ) {
                chatProps.triggerAddReaction?.(
                  chatProps.emojiTargetMessageId,
                  emojiData.emoji
                );

                chatProps.setEmojiTargetMessageId?.(
                  null
                );
              } else {
                setMessage?.(
                  (prev) =>
                    `${prev || ''}${emojiData.emoji}`
                );
              }

              setShowEmojiPicker(false);
            }}
            width={300}
            height={360}
            searchDisabled
            previewConfig={{
              showPreview: false,
            }}
          />
        </div>
      )}

      {/* ======================================================
          SELECTED FILES
      ====================================================== */}

      {selectedFiles?.length > 0 && (
        <div
          style={{
            background: '#ffffff',
            padding: '10px 14px',
            borderBottom:
              '1px solid #f1f5f9',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            maxHeight: '180px',
            overflowY: 'auto',
          }}
        >
          {selectedFiles.map(
            (file, index) => (
              <div
                key={`${file.name}-${index}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '6px',
                  border:
                    '1px solid #e2e8f0',
                  borderRadius: '8px',
                  background: '#f8fafc',
                }}
              >
                {/* Preview */}

                {file.type === 'image' ? (
                  <img
                    src={file.url}
                    alt=""
                    style={{
                      width: '48px',
                      height: '42px',
                      objectFit: 'cover',
                      borderRadius: '5px',
                      flexShrink: 0,
                    }}
                  />
                ) : file.type === 'video' ? (
                  <video
                    src={file.url}
                    muted
                    playsInline
                    style={{
                      width: '48px',
                      height: '42px',
                      objectFit: 'cover',
                      borderRadius: '5px',
                      background: '#000',
                      flexShrink: 0,
                    }}
                  />
                ) : file.type === 'audio' ? (
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '6px',
                      background:
                        '#eff6ff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#2563eb',
                      flexShrink: 0,
                    }}
                  >
                    <AudioLines
                      size={18}
                    />
                  </div>
                ) : (
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '6px',
                      background:
                        '#eff6ff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#2563eb',
                      flexShrink: 0,
                    }}
                  >
                    <FileText
                      size={18}
                    />
                  </div>
                )}

                {/* File name */}

                <div
                  style={{
                    flex: 1,
                    minWidth: 0,
                    display: 'flex',
                    flexDirection:
                      'column',
                  }}
                >
                  <span
                    style={{
                      fontSize:
                        '0.58rem',
                      color: '#64748b',
                      fontWeight: 700,
                      textTransform:
                        'uppercase',
                    }}
                  >
                    {file.type}
                  </span>

                  <span
                    style={{
                      fontSize:
                        '0.78rem',
                      color: '#0f172a',
                      overflow:
                        'hidden',
                      textOverflow:
                        'ellipsis',
                      whiteSpace:
                        'nowrap',
                    }}
                  >
                    {file.name}
                  </span>
                </div>

                {/* Remove */}

                <button
                  type="button"
                  onClick={() => {
                    if (
                      file.url?.startsWith(
                        'blob:'
                      )
                    ) {
                      URL.revokeObjectURL(
                        file.url
                      );
                    }

                    setSelectedFiles(
                      (prev) =>
                        prev.filter(
                          (_, i) =>
                            i !== index
                        )
                    );
                  }}
                  style={{
                    border: 'none',
                    background:
                      'rgba(239, 68, 68, 0.06)',
                    width: '26px',
                    height: '26px',
                    borderRadius: '5px',
                    color: '#ef4444',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems:
                      'center',
                    justifyContent:
                      'center',
                    flexShrink: 0,
                  }}
                >
                  <X size={13} />
                </button>
              </div>
            )
          )}

          {/* Clear all */}

          {selectedFiles.length > 1 && (
            <button
              type="button"
              onClick={() => {
                selectedFiles.forEach(
                  (file) => {
                    if (
                      file.url?.startsWith(
                        'blob:'
                      )
                    ) {
                      URL.revokeObjectURL(
                        file.url
                      );
                    }
                  }
                );

                setSelectedFiles([]);
              }}
              style={{
                alignSelf: 'flex-end',
                border: 'none',
                background:
                  'transparent',
                color: '#ef4444',
                fontSize: '0.7rem',
                cursor: 'pointer',
                padding: '2px 5px',
              }}
            >
              Clear all
            </button>
          )}
        </div>
      )}

      {/* ======================================================
          MAIN INPUT
      ====================================================== */}

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
          background: isDragging
            ? '#f0f7ff'
            : '#ffffff',
          border: isDragging
            ? '1px dashed #2563eb'
            : '1px solid #e2e8f0',
          borderRadius: '6px',
          boxSizing: 'border-box',
          boxShadow:
            '0 1px 3px rgba(15, 23, 42, 0.03)',
          transition: 'all 0.2s ease',
          animation: localRecording
            ? 'containerPulseGlow 2s infinite ease-in-out'
            : 'none',
        }}
      >
        {/* LEFT CONTROLS */}

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1px',
            flexShrink: 0,
            opacity: isDragging
              ? 0.2
              : 1,
          }}
        >
          {/* EMOJI */}

          <button
            type="button"
            disabled={localRecording}
            onClick={() => {
              setShowEmojiPicker(
                !showEmojiPicker
              );

              setShowAttachmentMenu(
                false
              );
            }}
            style={{
              border: 'none',
              background: 'transparent',
              color: localRecording
                ? '#cbd5e1'
                : '#64748b',
              cursor: localRecording
                ? 'not-allowed'
                : 'pointer',
              width: '30px',
              height: '34px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '4px',
            }}
          >
            <Smile size={16} />
          </button>

          {/* PAPERCLIP */}

          <button
            type="button"
            disabled={localRecording}
            onClick={() => {
              setShowAttachmentMenu(
                !showAttachmentMenu
              );

              setShowEmojiPicker(
                false
              );
            }}
            style={{
              border: 'none',
              background: 'transparent',
              color: localRecording
                ? '#cbd5e1'
                : '#64748b',
              cursor: localRecording
                ? 'not-allowed'
                : 'pointer',
              width: '30px',
              height: '34px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '4px',
            }}
          >
            <Paperclip size={16} />
          </button>

          {/* RECORDING CONTROLS */}

          {localRecording ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                flexShrink: 0,
              }}
            >
              <button
                type="button"
                onClick={
                  toggleRecordingPauseAction
                }
                style={{
                  border: 'none',
                  background:
                    isRecordPaused
                      ? '#2563eb'
                      : '#f1f5f9',
                  color:
                    isRecordPaused
                      ? '#ffffff'
                      : '#475569',
                  cursor: 'pointer',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems:
                    'center',
                  justifyContent:
                    'center',
                  borderRadius: '50%',
                  fontSize: '0.75rem',
                  fontWeight: 'bold',
                }}
                title={
                  isRecordPaused
                    ? 'Resume Recording'
                    : 'Pause Recording'
                }
              >
                {isRecordPaused
                  ? '▶'
                  : '||'}
              </button>

              <button
                type="button"
                onClick={
                  localStopRecordingAction
                }
                style={{
                  border: 'none',
                  background:
                    '#ef4444',
                  color: '#ffffff',
                  cursor: 'pointer',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems:
                    'center',
                  justifyContent:
                    'center',
                  borderRadius: '50%',
                }}
                title="Finish and Save"
              >
                <Square
                  size={11}
                  fill="currentColor"
                />
              </button>
            </div>
          ) : (
            !message?.trim() &&
            (!selectedFiles ||
              selectedFiles.length ===
                0) && (
              <button
                type="button"
                onClick={
                  localStartRecordingAction
                }
                style={{
                  border: 'none',
                  background:
                    'transparent',
                  color: '#64748b',
                  cursor: 'pointer',
                  width: '30px',
                  height: '34px',
                  display: 'flex',
                  alignItems:
                    'center',
                  justifyContent:
                    'center',
                  borderRadius: '4px',
                }}
                title="Record audio note"
              >
                <Mic size={16} />
              </button>
            )
          )}
        </div>

        {/* ====================================================
            RECORDING DISPLAY
        ==================================================== */}

        <div
          style={{
            flex: 1,
            minWidth: 0,
            display: 'flex',
          }}
        >
          {localRecording ? (
            <div
              style={{
                flex: 1,
                height: '34px',
                background:
                  'rgba(239, 68, 68, 0.02)',
                border:
                  '1px solid rgba(239, 68, 68, 0.08)',
                borderRadius: '18px',
                display: 'flex',
                alignItems:
                  'center',
                padding: '0 8px',
                boxSizing:
                  'border-box',
                gap: '8px',
                width: '100%',
              }}
            >
              {/* TIMER */}

              <div
                style={{
                  display: 'flex',
                  alignItems:
                    'center',
                  gap: '6px',
                  flexShrink: 0,
                  background:
                    '#f8fafc',
                  padding:
                    '3px 8px',
                  borderRadius:
                    '12px',
                  border:
                    '1px solid #e2e8f0',
                }}
              >
                <div
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius:
                      '50%',
                    background:
                      '#ef4444',
                    animation:
                      isRecordPaused
                        ? 'none'
                        : 'recordingIndicatorFlash 0.6s infinite alternate',
                  }}
                />

                <span
                  style={{
                    fontSize:
                      '0.72rem',
                    color:
                      isRecordPaused
                        ? '#64748b'
                        : '#0f172a',
                    fontWeight: 700,
                    fontVariantNumeric:
                      'tabular-nums',
                    whiteSpace:
                      'nowrap',
                  }}
                >
                  {formatRecordingTime(
                    localDuration
                  )}
                </span>
              </div>

              {/* =================================================
                  LIVE REAL MICROPHONE WAVE
              ================================================= */}

              <div
                style={{
                  display: 'flex',
                  alignItems:
                    'center',
                  gap: '2px',
                  flex: 1,
                  justifyContent:
                    'center',
                  height: '32px',
                  minWidth: 0,
                  overflow:
                    'hidden',
                  padding:
                    '0 4px',
                }}
              >
                {waveHeights.map(
                  (
                    barHeight,
                    index
                  ) => (
                    <div
                      key={index}
                      className="live-mic-wave-bar"
                      style={{
                        height: `${
                          isRecordPaused
                            ? 7
                            : barHeight
                        }px`,
                        background:
                          isRecordPaused
                            ? '#cbd5e1'
                            : '#ef4444',
                      }}
                    />
                  )
                )}
              </div>

              {/* CANCEL */}

              <button
                type="button"
                onClick={
                  localCancelRecordingAction
                }
                style={{
                  border: 'none',
                  background:
                    'rgba(239, 68, 68, 0.06)',
                  color: '#ef4444',
                  cursor: 'pointer',
                  width: '26px',
                  height: '26px',
                  display: 'flex',
                  alignItems:
                    'center',
                  justifyContent:
                    'center',
                  borderRadius: '50%',
                  flexShrink: 0,
                }}
                title="Discard Recording"
              >
                <X
                  size={13}
                  strokeWidth={2.5}
                />
              </button>
            </div>
          ) : (
            <textarea
              value={message || ''}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Message"
              rows={1}
              style={{
                width: '100%',
                border: 'none',
                outline: 'none',
                resize: 'none',
                padding: '8px 0',
                fontSize: '0.9rem',
                color: '#0f172a',
                background:
                  'transparent',
                maxHeight: '100px',
                overflowY: 'auto',
              }}
              className="custom-input-scroll"
            />
          )}
        </div>

        {/* SEND */}

        {!localRecording &&
          (message?.trim() ||
            selectedFiles?.length >
              0) && (
            <button
              type="submit"
              style={{
                border: 'none',
                background: '#2563eb',
                color: '#ffffff',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                cursor: 'pointer',
                display: 'flex',
                alignItems:
                  'center',
                justifyContent:
                  'center',
                flexShrink: 0,
              }}
            >
              <ArrowUp
                size={18}
                strokeWidth={3}
              />
            </button>
          )}
      </form>
    </div>
  );
};

