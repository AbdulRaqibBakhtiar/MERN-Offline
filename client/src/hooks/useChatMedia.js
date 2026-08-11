import { useState, useRef, useCallback, useEffect } from 'react';
import { useCallSounds } from './useCallSounds';

const RTC_CONFIG = {
  iceServers: [
    {
      urls: [
        'stun:stun.l.google.com:19302',
        'stun:stun1.l.google.com:19302'
      ]
    }
  ],
  iceCandidatePoolSize: 10
};

export const useChatMedia = (
  socket,
  currentUsername,
  triggerToast
) => {
  const {
    playIncomingTone,
    playOutgoingTone,
    playConnectedTone,
    playEndedTone,
    stopAllCallSounds
  } = useCallSounds();

  const [callState, setCallState] = useState('idle');
  const [callType, setCallType] = useState('video');

  const [remotePeerDetails, setRemotePeerDetails] = useState({
    socketId: '',
    name: '',
    room: ''
  });

  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isCamOff, setIsCamOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [connectionQuality, setConnectionQuality] = useState('good');

  const wasNotIdleRef = useRef(false);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  const localStreamRef = useRef(null);
  const peerConnectionRef = useRef(null);

  const durationTimerRef = useRef(null);
  const ringTimeoutRef = useRef(null);

  const iceQueueRef = useRef([]);

  const callSessionIdRef = useRef(0);

  // IMPORTANT:
  // Keep the latest call type in a ref as well as React state.
  // React state updates are asynchronous and WebRTC signaling can
  // arrive before the state update has rendered.
  const callTypeRef = useRef('video');

  // ---------------------------------------------------------
  // MEDIA ELEMENT ATTACHMENT
  // ---------------------------------------------------------

  const attachLocalStream = useCallback(() => {
    const video = localVideoRef.current;
    const stream = localStreamRef.current;

    if (!video || !stream) return;

    if (video.srcObject !== stream) {
      video.srcObject = stream;
    }

    video.autoplay = true;
    video.muted = true;
    video.playsInline = true;

    const playPromise = video.play();

    if (playPromise?.catch) {
      playPromise.catch(err => {
        console.warn(
          '[WebRTC] Local video autoplay blocked:',
          err
        );
      });
    }
  }, []);

  const attachRemoteStream = useCallback((stream) => {
    const video = remoteVideoRef.current;

    if (!video || !stream) return;

    if (video.srcObject !== stream) {
      video.srcObject = stream;
    }

    video.autoplay = true;
    video.playsInline = true;

    const playPromise = video.play();

    if (playPromise?.catch) {
      playPromise.catch(err => {
        console.warn(
          '[WebRTC] Remote video autoplay blocked:',
          err
        );
      });
    }
  }, []);

  // ---------------------------------------------------------
  // CLEANUP
  // ---------------------------------------------------------

  const clearCallSessionState = useCallback(() => {
    console.log('[WebRTC] Clearing call session');

    callSessionIdRef.current += 1;

    if (ringTimeoutRef.current) {
      clearTimeout(ringTimeoutRef.current);
      ringTimeoutRef.current = null;
    }

    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }

    // Stop local media
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        try {
          track.stop();
        } catch (err) {
          console.warn(
            '[WebRTC] Track stop failed:',
            err
          );
        }
      });

      localStreamRef.current = null;
    }

    // Close peer connection
    if (peerConnectionRef.current) {
      const pc = peerConnectionRef.current;

      pc.onicecandidate = null;
      pc.ontrack = null;
      pc.onconnectionstatechange = null;
      pc.oniceconnectionstatechange = null;
      pc.onicegatheringstatechange = null;

      try {
        pc.getSenders().forEach(sender => {
          try {
            sender.replaceTrack(null);
          } catch (err) {
            // Ignore sender cleanup errors
          }
        });
      } catch (err) {
        // Ignore
      }

      try {
        pc.close();
      } catch (err) {
        console.warn(
          '[WebRTC] Peer close failed:',
          err
        );
      }

      peerConnectionRef.current = null;
    }

    iceQueueRef.current = [];

    // Clear media elements
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }

    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }

    stopAllCallSounds();

    setCallState('idle');
    setCallDuration(0);
    setIsMicMuted(false);
    setIsCamOff(false);
    setConnectionQuality('good');

    setRemotePeerDetails({
      socketId: '',
      name: '',
      room: ''
    });
  }, [stopAllCallSounds]);

  // ---------------------------------------------------------
  // END CALL
  // ---------------------------------------------------------

  const endCallSession = useCallback(() => {
    const peerId = remotePeerDetails?.socketId;
    const room =
      remotePeerDetails?.room ||
      'global_workspace';

    console.log('📞 END CALL');
    console.log('My socket:', socket?.id);
    console.log('Remote socket:', peerId);

    if (socket?.connected && peerId) {
      socket.emit('end_call_session', {
        room,
        toSocketId: peerId
      });
    }

    clearCallSessionState();
  }, [
    socket,
    remotePeerDetails,
    clearCallSessionState
  ]);

  // ---------------------------------------------------------
  // CALL SOUNDS
  // ---------------------------------------------------------

  useEffect(() => {
    switch (callState) {
      case 'incoming':
        wasNotIdleRef.current = true;
        playIncomingTone();
        break;

      case 'ringing':
        wasNotIdleRef.current = true;
        playOutgoingTone();
        break;

      case 'connecting':
        wasNotIdleRef.current = true;
        playConnectedTone();
        break;

      case 'connected':
        wasNotIdleRef.current = true;
        playConnectedTone();
        break;

      case 'idle':
        if (wasNotIdleRef.current) {
          playEndedTone();
        } else {
          stopAllCallSounds();
        }

        wasNotIdleRef.current = false;
        break;

      case 'busy':
        triggerToast(
          'User is busy on another line',
          'info'
        );

        setTimeout(() => {
          setCallState('idle');
        }, 3500);
        break;

      default:
        stopAllCallSounds();
        break;
    }

    return () => stopAllCallSounds();
  }, [
    callState,
    playIncomingTone,
    playOutgoingTone,
    playConnectedTone,
    playEndedTone,
    stopAllCallSounds,
    triggerToast
  ]);

  // ---------------------------------------------------------
  // REMOTE TERMINATION
  // ---------------------------------------------------------

  useEffect(() => {
    if (!socket) return;

    const handleRemoteCallEnded = () => {
      console.log(
        '🚨 REMOTE CALL TERMINATION RECEIVED'
      );

      clearCallSessionState();
    };

    socket.on(
      'call_terminated_by_peer',
      handleRemoteCallEnded
    );

    return () => {
      socket.off(
        'call_terminated_by_peer',
        handleRemoteCallEnded
      );
    };
  }, [
    socket,
    clearCallSessionState
  ]);

  // ---------------------------------------------------------
  // CALL TIMER
  // ---------------------------------------------------------

  useEffect(() => {
    if (callState !== 'connected') {
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
        durationTimerRef.current = null;
      }

      return;
    }

    setCallDuration(0);

    durationTimerRef.current = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);

    return () => {
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
        durationTimerRef.current = null;
      }
    };
  }, [callState]);

  // ---------------------------------------------------------
  // HARDWARE
  // ---------------------------------------------------------

  const toggleMic = useCallback(() => {
    const stream = localStreamRef.current;

    if (!stream) return;

    const track = stream.getAudioTracks()[0];

    if (!track) return;

    track.enabled = !track.enabled;

    setIsMicMuted(!track.enabled);
  }, []);

  const toggleCamera = useCallback(() => {
    const stream = localStreamRef.current;

    if (!stream) return;

    const track = stream.getVideoTracks()[0];

    if (!track) return;

    track.enabled = !track.enabled;

    setIsCamOff(!track.enabled);
  }, []);

  const formatTimer = useCallback((secs) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;

    return `${mins
      .toString()
      .padStart(2, '0')}:${remainder
      .toString()
      .padStart(2, '0')}`;
  }, []);

  // ---------------------------------------------------------
  // PEER CONNECTION
  // ---------------------------------------------------------

  const getOrCreatePeerConnection = useCallback(
    targetSocketId => {
      if (peerConnectionRef.current) {
        return peerConnectionRef.current;
      }

      if (!socket || !targetSocketId) {
        throw new Error(
          'Cannot create peer connection without socket/peer'
        );
      }

      console.log(
        '[WebRTC] Creating peer connection for:',
        targetSocketId
      );

      const pc = new RTCPeerConnection(
        RTC_CONFIG
      );

      // -----------------------------------------------------
      // ICE
      // -----------------------------------------------------

      pc.onicecandidate = event => {
        if (
          event.candidate &&
          socket?.connected
        ) {
          socket.emit(
            'send_ice_candidate',
            {
              toSocketId: targetSocketId,
              candidate: event.candidate
            }
          );
        }
      };

      // -----------------------------------------------------
      // REMOTE TRACK
      // -----------------------------------------------------

      pc.ontrack = event => {
        console.log(
          '[WebRTC] Remote track received:',
          event.track.kind
        );

        if (
          event.streams &&
          event.streams[0]
        ) {
          attachRemoteStream(
            event.streams[0]
          );
        }
      };

      // -----------------------------------------------------
      // CONNECTION STATE
      // -----------------------------------------------------

      pc.onconnectionstatechange = () => {
        console.log(
          '[WebRTC] Connection state:',
          pc.connectionState
        );

        switch (pc.connectionState) {
          case 'connected':
            console.log(
              '[WebRTC] ✅ PEER CONNECTION CONNECTED'
            );

            setConnectionQuality('good');
            setCallState('connected');
            break;

          case 'disconnected':
            console.warn(
              '[WebRTC] Peer temporarily disconnected'
            );

            setConnectionQuality('fair');
            break;

          case 'failed':
            console.error(
              '[WebRTC] ❌ PEER CONNECTION FAILED'
            );

            setConnectionQuality(
              'disconnected'
            );

            endCallSession();
            break;

          case 'closed':
            clearCallSessionState();
            break;

          default:
            break;
        }
      };

      // -----------------------------------------------------
      // ICE CONNECTION STATE
      // -----------------------------------------------------

      pc.oniceconnectionstatechange = () => {
        console.log(
          '[WebRTC] ICE state:',
          pc.iceConnectionState
        );

        if (
          pc.iceConnectionState ===
            'connected' ||
          pc.iceConnectionState ===
            'completed'
        ) {
          setConnectionQuality('good');
        }

        if (
          pc.iceConnectionState ===
          'disconnected'
        ) {
          setConnectionQuality('fair');
        }

        if (
          pc.iceConnectionState ===
          'failed'
        ) {
          setConnectionQuality(
            'disconnected'
          );
        }
      };

      // -----------------------------------------------------
      // ADD LOCAL TRACKS
      // -----------------------------------------------------

      if (localStreamRef.current) {
        localStreamRef.current
          .getTracks()
          .forEach(track => {
            console.log(
              '[WebRTC] Adding local track:',
              track.kind,
              track.id,
              track.readyState
            );

            pc.addTrack(
              track,
              localStreamRef.current
            );
          });
      }

      peerConnectionRef.current = pc;

      return pc;
    },
    [
      socket,
      attachRemoteStream,
      endCallSession,
      clearCallSessionState
    ]
  );

  // ---------------------------------------------------------
  // CREATE OFFER
  // ---------------------------------------------------------

  const createPeerConnection = useCallback(
    async targetSocketId => {
      try {
        setCallState('connecting');

        const pc =
          getOrCreatePeerConnection(
            targetSocketId
          );

        console.log(
          '[WebRTC] Creating offer'
        );

        const offer =
          await pc.createOffer({
            offerToReceiveAudio: true,
            offerToReceiveVideo:
              callTypeRef.current ===
              'video'
          });

        await pc.setLocalDescription(
          offer
        );

        socket.emit(
          'send_rtc_offer',
          {
            toSocketId:
              targetSocketId,
            offer:
              pc.localDescription
          }
        );

        console.log(
          '[WebRTC] ✅ Offer sent'
        );
      } catch (err) {
        console.error(
          '[WebRTC] Offer creation failed:',
          err
        );

        triggerToast(
          `Call connection failed: ${
            err?.message || 'Unknown error'
          }`,
          'error'
        );

        endCallSession();
      }
    },
    [
      getOrCreatePeerConnection,
      endCallSession,
      socket,
      triggerToast
    ]
  );

  // ---------------------------------------------------------
  // INITIATE CALL
  // ---------------------------------------------------------

  const initiateCallSession = async (
    type,
    options = {}
  ) => {
    const roomId =
      options.roomId ||
      'global_workspace';

    const peerId =
      options.targetPeerId;

    const sessionId =
      ++callSessionIdRef.current;

    // Keep both state and ref synchronized.
    callTypeRef.current = type;
    setCallType(type);

    // Clear stale ICE
    iceQueueRef.current = [];

    // Clear stale PC if one somehow remains.
    if (peerConnectionRef.current) {
      try {
        peerConnectionRef.current.close();
      } catch (err) {}

      peerConnectionRef.current = null;
    }

    setCallState('ringing');

    setRemotePeerDetails({
      socketId: peerId || '',
      room: roomId,
      name: ''
    });

    try {
      console.log(
        '[WebRTC] Requesting local media:',
        type
      );

      if (
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
      ) {
        throw new Error(
          'getUserMedia is not supported by this browser/context.'
        );
      }

      const mediaConstraints = {
        audio: true,
        video:
          type === 'video'
            ? {
                width: {
                  ideal: 1280
                },
                height: {
                  ideal: 720
                },
                facingMode: 'user'
              }
            : false
      };

      console.log(
        '[WebRTC] Media constraints:',
        mediaConstraints
      );

      const stream =
        await navigator.mediaDevices.getUserMedia(
          mediaConstraints
        );

      // Call cancelled while permission dialog was open.
      if (
        sessionId !==
        callSessionIdRef.current
      ) {
        console.warn(
          '[WebRTC] Call session became stale while requesting media'
        );

        stream
          .getTracks()
          .forEach(track =>
            track.stop()
          );

        return;
      }

      localStreamRef.current =
        stream;

      console.log(
        '[WebRTC] ✅ Local media acquired:',
        stream
          .getTracks()
          .map(track => ({
            kind: track.kind,
            id: track.id,
            enabled: track.enabled,
            readyState:
              track.readyState,
            label: track.label
          }))
      );

      attachLocalStream();

      socket.emit(
        'initiate_call',
        {
          room: roomId,
          targetPeerId: peerId,
          callerName:
            currentUsername,
          type
        }
      );

      if (ringTimeoutRef.current) {
        clearTimeout(
          ringTimeoutRef.current
        );
      }

      ringTimeoutRef.current =
        setTimeout(() => {
          if (
            sessionId ===
              callSessionIdRef.current &&
            peerConnectionRef.current ===
              null
          ) {
            triggerToast(
              'No answer from receiver',
              'info'
            );

            endCallSession();
          }
        }, 30000);

    } catch (err) {
      console.error(
        '[WebRTC] ❌ Caller media error:',
        err
      );

      console.error(
        '[WebRTC] Error name:',
        err?.name
      );

      console.error(
        '[WebRTC] Error message:',
        err?.message
      );

      clearCallSessionState();

      let message =
        'Could not access camera or microphone.';

      if (err?.name === 'NotAllowedError') {
        message =
          'Camera/microphone permission was denied.';
      } else if (
        err?.name === 'NotFoundError'
      ) {
        message =
          'No camera or microphone was found.';
      } else if (
        err?.name === 'NotReadableError'
      ) {
        message =
          'Camera or microphone is already being used by another application.';
      } else if (
        err?.name === 'OverconstrainedError'
      ) {
        message =
          'The requested camera settings are not supported by this device.';
      } else if (
        err?.name === 'SecurityError'
      ) {
        message =
          'Browser security blocked camera/microphone access.';
      } else if (err?.message) {
        message =
          `Media access failed: ${err.message}`;
      }

      triggerToast(
        message,
        'error'
      );
    }
  };

  // ---------------------------------------------------------
  // ACCEPT CALL
  // ---------------------------------------------------------

  const acceptIncomingCall =
    async () => {
      if (
        ringTimeoutRef.current
      ) {
        clearTimeout(
          ringTimeoutRef.current
        );

        ringTimeoutRef.current =
          null;
      }

      const peerSocketId =
        remotePeerDetails?.socketId;

      if (!peerSocketId) {
        console.error(
          '[WebRTC] Cannot accept: missing peer socket'
        );

        clearCallSessionState();
        return;
      }

      const sessionId =
        ++callSessionIdRef.current;

      iceQueueRef.current = [];

      try {
        const activeCallType =
          callTypeRef.current;

        console.log(
          '[WebRTC] Receiver requesting media:',
          activeCallType
        );

        const mediaConstraints = {
          audio: true,
          video:
            activeCallType === 'video'
              ? {
                  width: {
                    ideal: 1280
                  },
                  height: {
                    ideal: 720
                  },
                  facingMode: 'user'
                }
              : false
        };

        console.log(
          '[WebRTC] Receiver media constraints:',
          mediaConstraints
        );

        const stream =
          await navigator.mediaDevices.getUserMedia(
            mediaConstraints
          );

        if (
          sessionId !==
          callSessionIdRef.current
        ) {
          stream
            .getTracks()
            .forEach(track =>
              track.stop()
            );

          return;
        }

        localStreamRef.current =
          stream;

        console.log(
          '[WebRTC] ✅ Receiver local media acquired:',
          stream
            .getTracks()
            .map(track => ({
              kind: track.kind,
              id: track.id,
              enabled: track.enabled,
              readyState:
                track.readyState,
              label: track.label
            }))
        );

        attachLocalStream();

        setCallState('connecting');

        // Create PC only after local tracks exist.
        getOrCreatePeerConnection(
          peerSocketId
        );

        socket.emit(
          'accept_incoming_call',
          {
            toSocketId:
              peerSocketId
          }
        );

        console.log(
          '[WebRTC] ✅ Incoming call accepted'
        );

      } catch (err) {
        console.error(
          '[WebRTC] ❌ Receiver media error:',
          err
        );

        console.error(
          '[WebRTC] Error name:',
          err?.name
        );

        console.error(
          '[WebRTC] Error message:',
          err?.message
        );

        let message =
          'Could not access camera or microphone.';

        if (
          err?.name ===
          'NotAllowedError'
        ) {
          message =
            'Camera/microphone permission was denied.';
        } else if (
          err?.name ===
          'NotFoundError'
        ) {
          message =
            'No camera or microphone was found.';
        } else if (
          err?.name ===
          'NotReadableError'
        ) {
          message =
            'Camera or microphone is already being used by another application.';
        } else if (
          err?.name ===
          'OverconstrainedError'
        ) {
          message =
            'The requested camera settings are not supported by this device.';
        } else if (
          err?.name ===
          'SecurityError'
        ) {
          message =
            'Browser security blocked camera/microphone access.';
        } else if (
          err?.message
        ) {
          message =
            `Media access failed: ${err.message}`;
        }

        triggerToast(
          message,
          'error'
        );

        socket.emit(
          'end_call_session',
          {
            room:
              remotePeerDetails?.room ||
              'global_workspace',
            toSocketId:
              peerSocketId
          }
        );

        clearCallSessionState();
      }
    };

  // ---------------------------------------------------------
  // RE-ATTACH LOCAL VIDEO AFTER RENDER
  // ---------------------------------------------------------

  useEffect(() => {
    if (
      callState !== 'idle' &&
      localStreamRef.current
    ) {
      const timer =
        requestAnimationFrame(() => {
          attachLocalStream();
        });

      return () =>
        cancelAnimationFrame(timer);
    }
  }, [
    callState,
    callType,
    attachLocalStream
  ]);

  // ---------------------------------------------------------
  // RETURN
  // ---------------------------------------------------------

  return {
    callState,
    setCallState,

    callType,
    setCallType,

    remotePeerDetails,
    setRemotePeerDetails,

    localVideoRef,
    remoteVideoRef,

    clearCallSessionState,

    getOrCreatePeerConnection,
    createPeerConnection,

    initiateCallSession,
    acceptIncomingCall,
    endCallSession,

    isMicMuted,
    isCamOff,

    toggleMic,
    toggleCamera,

    callDuration,
    formatTimer,

    connectionQuality,

    localStreamRef,
    peerConnectionRef
  };
};
