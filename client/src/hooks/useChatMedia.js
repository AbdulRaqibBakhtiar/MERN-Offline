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
  const rtcConfigRef = useRef(RTC_CONFIG);

  useEffect(() => {
    if (!socket) return undefined;
    const updateIceServers = servers => {
      if (Array.isArray(servers) && servers.length) rtcConfigRef.current = { ...RTC_CONFIG, iceServers: servers };
    };
    socket.on('rtc_ice_servers', updateIceServers);
    if (socket.connected) socket.emit('request_rtc_ice_servers');
    return () => socket.off('rtc_ice_servers', updateIceServers);
  }, [socket]);

  const [remotePeerDetails, setRemotePeerDetails] = useState({
    socketId: '',
    name: '',
    room: ''
  });

  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isCamOff, setIsCamOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [connectionQuality, setConnectionQuality] = useState('good');
  const [callParticipants, setCallParticipants] = useState([]);
  const [remoteStreams, setRemoteStreams] = useState([]);
  const [isConferenceCall, setIsConferenceCall] = useState(false);

  const wasNotIdleRef = useRef(false);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  const localStreamRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const peerConnectionsRef = useRef(new Map());

  const durationTimerRef = useRef(null);
  const ringTimeoutRef = useRef(null);

  const iceQueueRef = useRef([]);

  const callSessionIdRef = useRef(0);

  // IMPORTANT:
  // Keep the latest call type in a ref as well as React state.
  // React state updates are asynchronous and WebRTC signaling can
  // arrive before the state update has rendered.
  const callTypeRef = useRef('video');
  const updateCallType = useCallback(type => {
    callTypeRef.current = type;
    setCallType(type);
  }, []);

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

    // Close every peer connection in the call.
    const connections = new Set(peerConnectionsRef.current.values());
    if (peerConnectionRef.current) connections.add(peerConnectionRef.current);
    connections.forEach(pc => {

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

    });
    peerConnectionsRef.current.clear();
    peerConnectionRef.current = null;
    setRemoteStreams([]);
    setCallParticipants([]);
    setIsConferenceCall(false);

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

  const endCallSession = useCallback((reason) => {
    const peerId = remotePeerDetails?.socketId;
    const room =
      remotePeerDetails?.room ||
      'global_workspace';

    console.log('📞 END CALL');
    console.log('My socket:', socket?.id);
    console.log('Remote socket:', peerId);

    if (socket?.connected) {
      socket.emit('end_call_session', {
        room,
        toSocketId: peerId,
        reason
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
      const existing = peerConnectionsRef.current.get(targetSocketId);
      if (existing) return existing;

      if (!socket || !targetSocketId) {
        throw new Error(
          'Cannot create peer connection without socket/peer'
        );
      }

      console.log(
        '[WebRTC] Creating peer connection for:',
        targetSocketId
      );

      const pc = new RTCPeerConnection(rtcConfigRef.current);

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
              candidate: event.candidate.toJSON()
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
          setRemoteStreams(previous => {
            const current = previous.find(item => item.socketId === targetSocketId);
            if (current?.stream === event.streams[0]) return previous;
            return [...previous.filter(item => item.socketId !== targetSocketId), { socketId: targetSocketId, stream: event.streams[0] }];
          });
          if (callParticipants.length <= 1) attachRemoteStream(event.streams[0]);
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

            if (isConferenceCall) {
              peerConnectionsRef.current.delete(targetSocketId);
              setRemoteStreams(previous => previous.filter(item => item.socketId !== targetSocketId));
              setCallParticipants(previous => previous.map(item => item.socketId === targetSocketId ? { ...item, state: 'connection_failed' } : item));
              pc.close();
              triggerToast('One participant lost their connection.', 'info');
            } else endCallSession('failed');
            break;

          case 'closed':
            peerConnectionsRef.current.delete(targetSocketId);
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
          if (isConferenceCall) {
            peerConnectionsRef.current.delete(targetSocketId);
            setRemoteStreams(previous => previous.filter(item => item.socketId !== targetSocketId));
            setCallParticipants(previous => previous.map(item => item.socketId === targetSocketId ? { ...item, state: 'connection_failed' } : item));
            pc.close();
            triggerToast('One participant could not connect. A TURN relay may be needed on restrictive networks.', 'info');
          } else {
            triggerToast('A network relay is required for this connection. Configure a TURN service to call across restrictive networks.', 'error');
            endCallSession('failed');
          }
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

      // A mesh conference sends this camera stream to every participant.
      // Keep each outgoing leg modest so a 10-person room does not saturate
      // the caller's upload connection.
      if (isConferenceCall) {
        pc.getSenders().forEach(sender => {
          if (sender.track?.kind !== 'video' || !sender.getParameters || !sender.setParameters) return;
          const parameters = sender.getParameters();
          parameters.encodings = parameters.encodings?.length ? parameters.encodings : [{}];
          parameters.encodings = parameters.encodings.map(encoding => ({
            ...encoding,
            maxBitrate: 220000,
            maxFramerate: 15
          }));
          sender.setParameters(parameters).catch(error => {
            console.warn('[WebRTC] Could not apply conference video limit:', error);
          });
        });
      }

      peerConnectionsRef.current.set(targetSocketId, pc);
      if (!peerConnectionRef.current) peerConnectionRef.current = pc;

      return pc;
    },
    [
      socket,
      attachRemoteStream,
      endCallSession,
      triggerToast,
      callParticipants,
      isConferenceCall
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
              pc.localDescription.toJSON()
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

        endCallSession('failed');
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
    if (!socket?.connected) {
      triggerToast('Chat is disconnected. Reconnect before starting a call.', 'error');
      return;
    }

    const roomId =
      options.roomId ||
      'global_workspace';

    const peerId =
      options.targetPeerId;

    const targets = Array.isArray(options.targets) ? options.targets.slice(0, 3) : [];
    if (!peerId && targets.length === 0) {
      triggerToast('Choose at least one participant for the call.', 'error');
      return;
    }

    const sessionId =
      ++callSessionIdRef.current;

    // Keep both state and ref synchronized.
    callTypeRef.current = type;
    updateCallType(type);

    // Clear stale ICE
    iceQueueRef.current = [];

    // Clear stale PC if one somehow remains.
    peerConnectionsRef.current.forEach(pc => { try { pc.close(); } catch (err) {} });
    peerConnectionsRef.current.clear();
    peerConnectionRef.current = null;
    setRemoteStreams([]);
    setIsConferenceCall(Boolean(options.conference));
    setCallParticipants(targets.length
      ? targets.map(target => ({ socketId: null, userId: target.userId || target.id, name: target.name || target.username || 'Bazzar contact', profileImage: target.profileImage || target.avatar || null, state: 'invited' }))
      : [{ socketId: null, userId: peerId, name: options.targetName || 'Bazzar contact', profileImage: options.targetAvatar || null, state: 'invited' }]);

    setCallState('ringing');

    setRemotePeerDetails({
      socketId: peerId || '',
      room: roomId,
      name: options.targetName || 'Bazzar contact',
      profileImage: options.targetAvatar || null
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
                  ideal: options.conference ? 640 : 1280
                },
                height: {
                  ideal: options.conference ? 360 : 720
                },
                frameRate: options.conference ? { ideal: 15, max: 20 } : undefined,
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
          targetPeerIds: targets.map(target => target.userId || target.id),
          conference: Boolean(options.conference),
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

            endCallSession('no_answer');
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

        const conference = isConferenceCall;
        const mediaConstraints = {
          audio: true,
          video:
            activeCallType === 'video'
              ? {
                  width: {
                    ideal: conference ? 640 : 1280
                  },
                  height: {
                    ideal: conference ? 360 : 720
                  },
                  frameRate: conference ? { ideal: 15, max: 20 } : undefined,
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
    setCallType: updateCallType,

    remotePeerDetails,
    setRemotePeerDetails,
    callParticipants,
    setCallParticipants,
    remoteStreams,
    setRemoteStreams,
    isConferenceCall,
    setIsConferenceCall,

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
    peerConnectionRef,
    peerConnectionsRef
  };
};
