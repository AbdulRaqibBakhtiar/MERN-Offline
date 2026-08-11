import React from 'react';
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Video,
  VideoOff
} from 'lucide-react';

export const CallOverlay = ({ chatProps }) => {
  const {
    callState = 'idle',
    callType = 'video',
    remotePeerDetails = {},
    localVideoRef,
    remoteVideoRef,
    acceptIncomingCall,
    handleAcceptCall,
    endCallSession,
    handleEndCall,
    clearCallSessionState,
    isMicMuted = false,
    isCamOff = false,
    toggleMic,
    toggleCamera,
    callDuration = 0,
    formatTimer = s => `${s}s`,
    connectionQuality = 'good',
    user = {}
  } = chatProps || {};
  

  if (callState === 'idle') return null;

  const onAccept = acceptIncomingCall || handleAcceptCall;

  // IMPORTANT:
  // Never use clearCallSessionState as the primary end-call action.
  // The caller must notify the remote peer first.
  const onEnd = () => {
    if (endCallSession) {
      endCallSession();
      return;
    }

    if (handleEndCall) {
      handleEndCall();
      return;
    }

    // Last-resort local cleanup only.
    if (clearCallSessionState) {
      clearCallSessionState();
    }
  };

  const BASE_URL = 'http://localhost:5000';

  const remoteAvatarUrl = remotePeerDetails?.profileImage
    ? `${BASE_URL}${remotePeerDetails.profileImage}`
    : null;

  const localAvatarUrl = user?.profileImage
    ? `${BASE_URL}${user.profileImage}`
    : null;

  const remoteName =
    remotePeerDetails?.name ||
    remotePeerDetails?.username ||
    'Unknown User';

  const remoteInitial = remoteName.charAt(0).toUpperCase();

  const localInitial = (
    user?.firstName ||
    user?.username ||
    user?.name ||
    'U'
  ).charAt(0).toUpperCase();

  const qualityMap = {
    good: { color: '#16a34a', label: 'Good connection' },
    fair: { color: '#f59e0b', label: 'Fair connection' },
    poor: { color: '#f97316', label: 'Poor connection' },
    disconnected: { color: '#ef4444', label: 'Connection lost' }
  };

  const quality = qualityMap[connectionQuality] || qualityMap.good;

  const isConnected = callState === 'connected';
  const isVideoCall = callType === 'video';
  const isVoiceCall = callType === 'voice';
  const isIncoming = callState === 'incoming';
  const isConnecting = callState === 'connecting';
  const isRinging = callState === 'ringing';

  return (
    <div
      style={{
        position: 'absolute',
        top: '55px',
        left: 0,
        right: 0,
        bottom: 0,
        background: 'var(--bg-main, #f8fafc)',
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        color: 'var(--text-primary, #0f172a)',
        fontFamily: 'inherit',
        borderTop: '1px solid var(--border-color, #e2e8f0)'
      }}
    >
      {/* HEADER */}
      <div
        style={{
          height: '50px',
          minHeight: '50px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          padding: '0 14px',
          boxSizing: 'border-box',
          background: 'rgba(255,255,255,0.94)',
          borderBottom: '1px solid var(--border-color, #e2e8f0)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          zIndex: 20
        }}
      >
        {isConnected && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 10px',
              borderRadius: '20px',
              border: `1px solid ${quality.color}55`,
              background: `${quality.color}08`,
              color: '#475569',
              fontSize: '0.62rem',
              fontWeight: 600,
              whiteSpace: 'nowrap'
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: quality.color,
                boxShadow: `0 0 0 3px ${quality.color}15`
              }}
            />
            {quality.label}
          </div>
        )}
      </div>

      {/* HIDDEN AUDIO */}
      {isVoiceCall && (
        <>
          <audio ref={remoteVideoRef} autoPlay />
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            style={{ display: 'none' }}
          />
        </>
      )}

      {/* MAIN AREA */}
      <div
        style={{
          flex: 1,
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          background: 'linear-gradient(180deg,#f8fafc 0%,#f1f5f9 100%)'
        }}
      >
        {/* PRE-CONNECTION / VOICE */}
        {(!isConnected || isVoiceCall) && (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
              boxSizing: 'border-box'
            }}
          >
            <div
              style={{
                position: 'relative',
                width: '112px',
                height: '112px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '20px'
              }}
            >
              {(isRinging || isIncoming || isConnecting) && (
                <div
                  style={{
                    position: 'absolute',
                    inset: '-10px',
                    borderRadius: '50%',
                    border: '1px solid rgba(37,99,235,0.12)',
                    animation: 'callAvatarPulse 2s infinite ease-out'
                  }}
                />
              )}

              <div
                style={{
                  position: 'absolute',
                  inset: '-1px',
                  borderRadius: '50%',
                  border: '2px solid rgba(37,99,235,0.20)'
                }}
              />

              <div
                style={{
                  width: '96px',
                  height: '96px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  background: '#e2e8f0',
                  border: '1px solid rgba(37,99,235,0.18)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 8px 24px rgba(15,23,42,0.08)',
                  position: 'relative'
                }}
              >
                {remoteAvatarUrl ? (
                  <img
                    src={remoteAvatarUrl}
                    alt=""
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                ) : (
                  <span
                    style={{
                      fontSize: '2rem',
                      fontWeight: 700,
                      color: '#2563eb'
                    }}
                  >
                    {remoteInitial}
                  </span>
                )}
              </div>
            </div>

            <div
              style={{
                fontSize: '1rem',
                fontWeight: 700,
                color: 'var(--text-primary,#0f172a)',
                textAlign: 'center',
                maxWidth: '80%',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {remoteName}
            </div>

            {!isConnected && (
              <div
                style={{
                  marginTop: '7px',
                  fontSize: '0.67rem',
                  color: '#64748b',
                  fontWeight: 500,
                  textAlign: 'center'
                }}
              >
                {isRinging && 'Calling...'}
                {isIncoming &&
                  `Incoming ${isVideoCall ? 'video' : 'voice'} call`}
                {isConnecting && 'Connecting...'}
                {callState === 'busy' && 'User is unavailable'}
              </div>
            )}

            {isConnected && (
              <div
                style={{
                  marginTop: '10px',
                  fontSize: '0.68rem',
                  color: '#64748b',
                  fontVariantNumeric: 'tabular-nums'
                }}
              >
                {formatTimer(callDuration)}
              </div>
            )}
          </div>
        )}

        {/* CONNECTED VIDEO */}
        {isConnected && isVideoCall && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: '#0f172a',
              overflow: 'hidden'
            }}
          >
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
                background: '#0f172a'
              }}
            />

            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none',
                zIndex: 1
              }}
            >
              <div
                style={{
                  width: '82px',
                  height: '82px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  background: '#1e293b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: 0.85
                }}
              >
                {remoteAvatarUrl ? (
                  <img
                    src={remoteAvatarUrl}
                    alt=""
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                ) : (
                  <span
                    style={{
                      color: '#60a5fa',
                      fontSize: '1.8rem',
                      fontWeight: 700
                    }}
                  >
                    {remoteInitial}
                  </span>
                )}
              </div>
            </div>

            <div
              style={{
                position: 'absolute',
                right: '14px',
                bottom: '14px',
                width: '96px',
                height: '132px',
                borderRadius: '12px',
                overflow: 'hidden',
                background: '#1e293b',
                border: '1px solid rgba(255,255,255,0.25)',
                boxShadow: '0 6px 20px rgba(0,0,0,0.35)',
                zIndex: 5
              }}
            >
              {!isCamOff ? (
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
              ) : (
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#1e293b'
                  }}
                >
                  {localAvatarUrl ? (
                    <img
                      src={localAvatarUrl}
                      alt=""
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        opacity: 0.55
                      }}
                    />
                  ) : (
                    <span
                      style={{
                        fontSize: '1.5rem',
                        fontWeight: 700,
                        color: '#94a3b8'
                      }}
                    >
                      {localInitial}
                    </span>
                  )}
                </div>
              )}
            </div>

            <div
              style={{
                position: 'absolute',
                top: '12px',
                left: '50%',
                transform: 'translateX(-50%)',
                padding: '5px 10px',
                borderRadius: '14px',
                background: 'rgba(15,23,42,0.65)',
                color: '#fff',
                fontSize: '0.65rem',
                fontVariantNumeric: 'tabular-nums',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                zIndex: 6
              }}
            >
              {formatTimer(callDuration)}
            </div>
          </div>
        )}
      </div>

      {/* CONTROLS */}
      <div
        style={{
          minHeight: '92px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '12px 16px',
          boxSizing: 'border-box',
          background: 'rgba(255,255,255,0.96)',
          borderTop: '1px solid var(--border-color,#e2e8f0)',
          boxShadow: '0 -4px 16px rgba(15,23,42,0.04)',
          zIndex: 20
        }}
      >
        {/* INCOMING */}
        {isIncoming ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}
          >
            <button
              type="button"
              onClick={onAccept}
              style={{
                width: '52px',
                height: '52px',
                border: 'none',
                borderRadius: '50%',
                background: '#22c55e',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 5px 14px rgba(34,197,94,0.25)'
              }}
            >
              <Phone size={20} fill="currentColor" />
            </button>

            <button
              type="button"
              onClick={onEnd}
              style={{
                width: '52px',
                height: '52px',
                border: 'none',
                borderRadius: '50%',
                background: '#ef4444',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 5px 14px rgba(239,68,68,0.25)'
              }}
            >
              <PhoneOff size={20} />
            </button>
          </div>
        ) : (
          /* OUTGOING / CONNECTING / CONNECTED */
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '18px'
            }}
          >
            {isConnected && (
              <button
                type="button"
                onClick={toggleMic}
                title={isMicMuted ? 'Unmute microphone' : 'Mute microphone'}
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  border: '1px solid #e2e8f0',
                  background: isMicMuted ? '#fee2e2' : '#fff',
                  color: isMicMuted ? '#ef4444' : '#475569',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                {isMicMuted ? <MicOff size={18} /> : <Mic size={18} />}
              </button>
            )}

            {/* ALWAYS AVAILABLE WHILE RINGING/CONNECTING/CONNECTED */}
            <button
              type="button"
              onClick={onEnd}
              title={
                isRinging
                  ? 'Cancel call'
                  : isConnecting
                    ? 'Cancel connection'
                    : 'End call'
              }
              style={{
                width: '54px',
                height: '54px',
                border: 'none',
                borderRadius: '50%',
                background: '#ef4444',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 6px 18px rgba(239,68,68,0.28)'
              }}
            >
              <PhoneOff size={21} />
            </button>

            {isConnected && isVideoCall && (
              <button
                type="button"
                onClick={toggleCamera}
                title={isCamOff ? 'Turn camera on' : 'Turn camera off'}
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  border: '1px solid #e2e8f0',
                  background: isCamOff ? '#fee2e2' : '#fff',
                  color: isCamOff ? '#ef4444' : '#475569',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                {isCamOff ? <VideoOff size={18} /> : <Video size={18} />}
              </button>
            )}
          </div>
        )}
      </div>

      <style>
        {`
          @keyframes callAvatarPulse {
            0% {
              transform: scale(0.92);
              opacity: 0.75;
            }
            70% {
              transform: scale(1.08);
              opacity: 0;
            }
            100% {
              transform: scale(1.08);
              opacity: 0;
            }
          }
        `}
      </style>
    </div>
  );
};
