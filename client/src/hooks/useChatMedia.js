import { useState, useRef, useCallback, useEffect } from 'react';
import { useCallSounds } from './useCallSounds';

const RTC_CONFIG = {
  iceServers: [
    { urls: ["stun:stun.l.google.com:19302",
        "stun:stun1.l.google.com:19302"] }
  ],
  iceCandidatePoolSize: 10
};

export const useChatMedia = (socket, currentUsername, triggerToast) => {
  const { playIncomingTone, playOutgoingTone, playConnectedTone, playEndedTone, stopAllCallSounds } = useCallSounds();

  const [callState, setCallState] = useState('idle'); 
  const [callType, setCallType] = useState('video');
  const [remotePeerDetails, setRemotePeerDetails] = useState({ socketId: '', name: '', room: '' });

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

  // 1. SOUND & STATE TRANSITIONS
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
      case 'connected':
        wasNotIdleRef.current = true;
        playConnectedTone();
        break;
      case 'idle':
        if (wasNotIdleRef.current) playEndedTone();
        else stopAllCallSounds();
        wasNotIdleRef.current = false;
        break;
      case 'busy':
        triggerToast("User is busy on another line", "info");
        setTimeout(() => setCallState('idle'), 3500);
        break;
      default:
        stopAllCallSounds();
        break;
    }
    return () => stopAllCallSounds();
  }, [callState, playIncomingTone, playOutgoingTone, playConnectedTone, playEndedTone, stopAllCallSounds, triggerToast]);

  // 2. CALL DURATION TIMER ENGINE
  useEffect(() => {
    if (callState === 'connected') {
      setCallDuration(0);
      durationTimerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(durationTimerRef.current);
    }
    return () => clearInterval(durationTimerRef.current);
  }, [callState]);

  // 3. HARDWARE CONTROLS HANDLERS (FIXED: Re-added track offset [0] array references)
  const toggleMic = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMicMuted(!audioTrack.enabled);
      }
    }
  }, []);

  const toggleCamera = useCallback(() => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCamOff(!videoTrack.enabled);
      }
    }
  }, []);

  const formatTimer = useCallback((secs) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  }, []);

  const clearCallSessionState = useCallback(() => {
    setCallState('idle');
    setCallDuration(0);
    setIsMicMuted(false);
    setIsCamOff(false);
    setConnectionQuality('good');
    
    if (ringTimeoutRef.current) clearTimeout(ringTimeoutRef.current);
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    setRemotePeerDetails({ socketId: '', name: '', room: '' });
  }, []);

  const endCallSession = useCallback(() => {
    socket.emit("end_call_session", {
      room: remotePeerDetails.room || "global_workspace",
      toSocketId: remotePeerDetails.socketId
    });
    clearCallSessionState();
  }, [socket, remotePeerDetails, clearCallSessionState]);
  // 4. WEBRTC MONITORING & RECOVERIES
  const getOrCreatePeerConnection = useCallback((targetSocketId) => {
    if (peerConnectionRef.current) {
      return peerConnectionRef.current;
    }

    const pc = new RTCPeerConnection(RTC_CONFIG);

    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit("send_ice_candidate", { toSocketId: targetSocketId, candidate: event.candidate });
      }
    };

    pc.ontrack = (event) => {
      if (remoteVideoRef.current && event.streams[0]) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    pc.onconnectionstatechange = () => {
      switch (pc.connectionState) {
        case "connected":
          setCallState("connected");
          break;
        case 'failed':
          setConnectionQuality('disconnected');
          console.error("ICE connection failed.");
          endCallSession(); 
          break;
        case "closed":
          clearCallSessionState();
          break;
        default:
          break;
      }
    };

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    peerConnectionRef.current = pc;
    return pc;
  }, [socket, endCallSession, clearCallSessionState]);

  const createPeerConnection = useCallback(async (targetSocketId) => {
    try {
      setCallState('connecting'); 
      const pc = getOrCreatePeerConnection(targetSocketId);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit("send_rtc_offer", { toSocketId: targetSocketId, offer: pc.localDescription });
    } catch (err) {
      console.error(err);
      endCallSession(); 
    }
  }, [getOrCreatePeerConnection, endCallSession, socket]);

  // 5. INITIATE WITH AUTOMATIC RING TIMEOUT
  const initiateCallSession = async (type, options = {}) => {
    setCallState('ringing');
    setCallType(type);
    const rId = options.roomId || "global_workspace";
    const pId = options.targetPeerId;
    setRemotePeerDetails({ socketId: pId, room: rId, name: "" });

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true, 
        video: type === 'video' 
      });

      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      
      socket.emit("initiate_call", { room: rId, targetPeerId: pId, callerName: currentUsername, type });

      ringTimeoutRef.current = setTimeout(() => {
        if (peerConnectionRef.current?.iceConnectionState !== 'connected') {
          triggerToast("No answer from receiver", "info");
          endCallSession();
        }
      }, 30000);
    } catch (err) {
      console.error(err);
      setCallState('idle');
      triggerToast("Hardware permissions denied", "error");
    }
  };

  const acceptIncomingCall = async () => {
    if (ringTimeoutRef.current) clearTimeout(ringTimeoutRef.current);
    try {
      setCallState('connecting');
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true, 
        video: callType === 'video' 
      });

      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;

      if (remotePeerDetails.socketId) {
        getOrCreatePeerConnection(remotePeerDetails.socketId);
      }
      
      socket.emit("accept_incoming_call", { toSocketId: remotePeerDetails.socketId });
    } catch (err) {
      console.error(err);
      triggerToast("Could not access media devices", "error");
      endCallSession(); 
    }
  };

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
