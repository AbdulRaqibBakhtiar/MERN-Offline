import React from 'react';
import { getAvatarUrl } from '../../../utils/avatar';
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, ShieldCheck, Signal } from 'lucide-react';

export const CallOverlay = ({ chatProps = {} }) => {
  const {
    callState = 'idle', callType = 'video', remotePeerDetails = {},
    localVideoRef, acceptIncomingCall, endCallSession,
    isMicMuted = false, isCamOff = false, toggleMic, toggleCamera,
    callDuration = 0, formatTimer = seconds => `${seconds}s`,
    connectionQuality = 'good', user = {}, callParticipants = [], remoteStreams = [], isConferenceCall = false
  } = chatProps;
  const [remoteAvatarFailed, setRemoteAvatarFailed] = React.useState(false);
  const [localAvatarFailed, setLocalAvatarFailed] = React.useState(false);
  const remoteAvatar = getAvatarUrl(remotePeerDetails.profileImage || remotePeerDetails.avatar);
  const localAvatar = getAvatarUrl(user.profileImage || user.avatar);
  const localInitial = (user.firstName || user.username || user.name || 'Y').trim().charAt(0).toUpperCase();
  React.useEffect(() => setRemoteAvatarFailed(false), [remoteAvatar]);
  React.useEffect(() => setLocalAvatarFailed(false), [localAvatar]);
  if (callState === 'idle') return null;

  const connected = callState === 'connected';
  const incoming = callState === 'incoming';
  const videoCall = callType === 'video';
  const displayName = isConferenceCall ? 'Conference call' : remotePeerDetails.name || remotePeerDetails.username || 'Bazzar contact';
  const initial = displayName.trim().charAt(0).toUpperCase() || 'B';
  const visibleParticipants = callParticipants.filter(peer => !['declined', 'left'].includes(peer.state));
  const qualityLabels = { good: 'Connected', fair: 'Unstable connection', poor: 'Weak connection', disconnected: 'Connection lost' };
  const status = incoming ? `Incoming ${videoCall ? 'video' : 'voice'} call` : connected ? formatTimer(callDuration) : callState === 'ringing' ? 'Calling…' : callState === 'busy' ? 'Unavailable' : 'Connecting…';
  const hangUp = () => endCallSession?.(incoming ? 'declined' : callState === 'ringing' ? 'cancelled' : undefined);
  const avatar = (src, failed, size, className, fallbackInitial = initial) => src && !failed
    ? <img className={className} src={src} alt="" onError={() => className === 'call-avatar call-avatar-remote' ? setRemoteAvatarFailed(true) : setLocalAvatarFailed(true)} />
    : <span className={className} aria-hidden="true" style={{ fontSize: size * .38 }}>{fallbackInitial}</span>;

  return <section className={`call-overlay ${connected && videoCall ? 'call-overlay-video' : ''}`} role="dialog" aria-label={`${videoCall ? 'Video' : 'Voice'} call with ${displayName}`}>
    <header className="call-topbar">
      <div className="call-brand"><span className="call-brand-mark"><Phone size={14} /></span><div><strong>Bazzar call</strong><small>{videoCall ? 'Video conversation' : 'Voice conversation'}</small></div></div>
      <div className={`call-status-pill ${connectionQuality}`}><i />{connected ? qualityLabels[connectionQuality] || 'Connected' : status}</div>
    </header>

    {!videoCall && <>{remoteStreams.map(item => <audio key={item.socketId} autoPlay ref={node => { if (node && node.srcObject !== item.stream) node.srcObject = item.stream; }} />)}<video ref={localVideoRef} autoPlay playsInline muted style={{ display: 'none' }} /></>}

    {videoCall ? <div className="call-video-stage">
      {!connected ? <div className="call-video-waiting"><div className="call-avatar-wrap">{avatar(remoteAvatar, remoteAvatarFailed, 116, 'call-avatar call-avatar-remote')}</div><strong>{displayName}</strong><span>{status}{isConferenceCall ? ` · ${visibleParticipants.length} invited` : ''}</span></div> : <div className={`call-video-grid count-${Math.min(10, visibleParticipants.length + 1)}`}>
        {visibleParticipants.map(peer => {
          const media = remoteStreams.find(item => item.socketId === peer.socketId)?.stream;
          const peerName = peer.name || 'Participant';
          const peerAvatar = getAvatarUrl(peer.profileImage || peer.avatar);
          return <article className="call-video-card" key={peer.socketId || peer.userId || peerName}>
            {media ? <video autoPlay playsInline ref={node => { if (node && node.srcObject !== media) node.srcObject = media; }} /> : <div className="call-video-placeholder">{peerAvatar ? <img src={peerAvatar} alt="" /> : <span>{peerName.charAt(0).toUpperCase()}</span>}</div>}
            <span className="call-video-card-name">{peer.state === 'connection_failed' ? `${peerName} · Connection issue` : peerName}</span>
          </article>;
        })}
        <article className="call-video-card is-local">
          {!isCamOff ? <video ref={localVideoRef} autoPlay playsInline muted /> : <div className="call-video-placeholder">{avatar(localAvatar, localAvatarFailed, 44, 'call-avatar call-avatar-local', localInitial)}</div>}
          <span className="call-video-card-name">You</span>
        </article>
      </div>}
      {connected && <div className="call-video-name"><span className="call-live-dot" />{isConferenceCall ? `${visibleParticipants.length + 1} people` : displayName}<span className="call-video-time">{formatTimer(callDuration)}</span></div>}
    </div> : <main className="call-voice-stage">
      <div className={`call-orbit ${incoming || callState === 'ringing' ? 'is-ringing' : ''}`}>
        <div className="call-avatar-wrap">{avatar(remoteAvatar, remoteAvatarFailed, 116, 'call-avatar call-avatar-remote')}</div>
        <span className="call-type-badge">{videoCall ? <Video size={15} /> : <Phone size={15} />}</span>
      </div>
      <h2>{displayName}</h2>
      <p>{status}</p>
      {connected && <span className="call-duration"><Signal size={14} /> {formatTimer(callDuration)}</span>}
      {isConferenceCall && <div className="call-voice-participants">{visibleParticipants.map(peer => <span key={peer.socketId || peer.userId} title={peer.name}>{peer.name?.charAt(0)?.toUpperCase() || 'B'}</span>)}<small>{visibleParticipants.length + 1} participants</small></div>}
      {!connected && <div className="call-secure-note"><ShieldCheck size={14} /> Private, real-time conversation</div>}
    </main>}

    <footer className="call-controls">
      {incoming ? <>
        <button className="call-control call-decline" type="button" onClick={hangUp} aria-label="Decline call"><PhoneOff size={20} /></button>
        <button className="call-control call-accept" type="button" onClick={acceptIncomingCall} aria-label="Answer call"><Phone size={20} /></button>
      </> : <>
        {connected && <button className={`call-control ${isMicMuted ? 'is-toggled' : ''}`} type="button" onClick={toggleMic} aria-label={isMicMuted ? 'Unmute microphone' : 'Mute microphone'} title={isMicMuted ? 'Unmute microphone' : 'Mute microphone'}>{isMicMuted ? <MicOff size={19} /> : <Mic size={19} />}<small>{isMicMuted ? 'Muted' : 'Mute'}</small></button>}
        <button className="call-control call-decline call-end" type="button" onClick={hangUp} aria-label={callState === 'ringing' ? 'Cancel call' : 'End call'}><PhoneOff size={20} /><small>{connected ? 'End' : 'Cancel'}</small></button>
        {connected && videoCall && <button className={`call-control ${isCamOff ? 'is-toggled' : ''}`} type="button" onClick={toggleCamera} aria-label={isCamOff ? 'Turn camera on' : 'Turn camera off'} title={isCamOff ? 'Turn camera on' : 'Turn camera off'}>{isCamOff ? <VideoOff size={19} /> : <Video size={19} />}<small>{isCamOff ? 'Camera off' : 'Camera'}</small></button>}
      </>}
    </footer>
  </section>;
};
