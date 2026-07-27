import React, { useEffect } from 'react'; 
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, ShieldCheck, Activity } from 'lucide-react'; 

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
    clearCallSessionState, 
    handleEndCall, 
    isMicMuted = false, 
    isCamOff = false, 
    toggleMic, 
    toggleCamera, 
    callDuration = 0, 
    formatTimer = (s) => `${s}s`, 
    connectionQuality = 'good', 
    user = {} 
  } = chatProps || {}; 

  const onAcceptTrigger = acceptIncomingCall || handleAcceptCall; 
  const onEndTrigger = endCallSession || clearCallSessionState || handleEndCall; 

  if (callState === 'idle') return null; 

  const BASE_URL = 'http://localhost:5000'; 
  const remoteAvatarUrl = remotePeerDetails?.profileImage ? `${BASE_URL}${remotePeerDetails.profileImage}` : null; 
  const localAvatarUrl = user?.profileImage ? `${BASE_URL}${user.profileImage}` : null; 
  const remoteName = remotePeerDetails?.name || remotePeerDetails?.username || "Workspace Peer"; 
  const remoteInitial = remoteName.charAt(0).toUpperCase(); 
  const localInitial = (user?.firstName || user?.username || "U").charAt(0).toUpperCase(); 

  const qualityMap = { 
    good: { color: '#10b981', label: 'Signal Stable' }, 
    fair: { color: '#f59e0b', label: 'Resolving Routes' }, 
    poor: { color: '#f97316', label: 'Unstable Network' }, 
    disconnected: { color: '#ef4444', label: 'Link Offline' } 
  }; 

  const overlayAnimations = ` 
    @keyframes deepFluidBreathe { 0%, 100% { transform: scale(1) translate(0px, 0px); opacity: 0.2; } 33% { transform: scale(1.08) translate(15px, -25px); opacity: 0.3; } 66% { transform: scale(0.96) translate(-10px, 10px); opacity: 0.15; } } 
    @keyframes profilePulseWave { 0% { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.3), 0 0 0 0 rgba(56, 189, 248, 0.2); } 50% { box-shadow: 0 0 0 15px rgba(37, 99, 235, 0), 0 0 0 30px rgba(56, 189, 248, 0.03); } 100% { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0), 0 0 0 0 rgba(56, 189, 248, 0); } } 
    @keyframes dockReveal { 0% { transform: translateY(16px); opacity: 0; } 100% { transform: translateY(0); opacity: 1; } }
  `; 

  const isConnected = callState === 'connected';
  return ( 
    <div style={{ position: 'absolute', top: '55px', left: 0, right: 0, bottom: 0, background: '#02040a', zIndex: 99999, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', color: '#fff', padding: '24px 20px', overflow: 'hidden', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}> 
      <style>{overlayAnimations}</style> 
      
      {/* Background Animated Atmosphere Aura */}
      <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '120%', height: '140%', background: 'radial-gradient(circle at 50% 30%, #172554 0%, #090d16 55%, #020408 100%)', animation: 'deepFluidBreathe 10s infinite ease-in-out', zIndex: 0, pointerEvents: 'none' }} /> 

      {/* DYNAMIC HEADER CONTROLS LAYER */} 
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%', zIndex: 5, background: 'linear-gradient(to bottom, rgba(2,4,10,0.85), rgba(2,4,10,0))', paddingBottom: '20px', marginTop: '-4px' }}> 
        <div style={{ maxWidth: '70%' }}> 
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            <ShieldCheck size={12} color="#60a5fa" />
            <span style={{ fontSize: '0.62rem', fontWeight: 700, color: '#38bdf8', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Secure Link</span>
          </div>
          <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#f8fafc', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}> 
            {callState === 'ringing' && 'Ringing Inbound Route...'} 
            {callState === 'incoming' && 'Incoming Workspace Call'} 
            {callState === 'connecting' && 'Syncing ICE Handshake...'} 
            {callState === 'connected' && 'Session Synchronized'} 
            {callState === 'busy' && 'Line Busy Parameters'} 
          </h3> 
        </div> 

        {isConnected && ( 
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(15, 23, 42, 0.65)', padding: '6px 12px', borderRadius: '30px', border: `1px solid ${qualityMap[connectionQuality].color}`, backdropFilter: 'blur(12px)', flexShrink: 0 }}> 
            <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: qualityMap[connectionQuality].color, animation: 'pulse 1.5s infinite alternate' }} /> 
            <span style={{ fontSize: '0.58rem', fontWeight: 700, color: '#f8fafc', textTransform: 'uppercase', letterSpacing: '0.04em' }}> 
              {qualityMap[connectionQuality].label} 
            </span> 
          </div> 
        )} 
      </div> 

      {/* Hidden Hardware Binding Tracks for Voice Protocols Setup */} 
      <div style={{ display: 'none' }}> 
        <audio ref={callType === 'voice' ? remoteVideoRef : null} autoPlay /> 
        <video ref={callType === 'voice' ? localVideoRef : null} autoPlay playsInline muted /> 
      </div>
      {/* CENTRAL VISUAL HUB CONTAINER AREA */} 
      <div style={{ width: '100%', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1, position: 'relative', margin: '16px 0' }}> 
        
        {/* VIEW 1: Renders Profile Avatars for Voice Session Tracks or Outbound States */} 
        {(!isConnected || callType === 'voice') && ( 
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', animation: 'fadeIn 0.3s ease-out' }}> 
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}> 
              <div style={{ position: 'absolute', width: '124px', height: '124px', borderRadius: '50%', border: '2px solid rgba(59,130,246,0.3)', animation: (callState === 'ringing' || callState === 'connecting' || callState === 'incoming') ? 'profilePulseWave 2.2s infinite ease-in-out' : 'none', zIndex: 0 }} /> 
              <div style={{ width: '100px', height: '100px', borderRadius: '50%', overflow: 'hidden', border: '2px solid #2563eb', background: '#0f172a', position: 'relative', zIndex: 1, boxShadow: '0 16px 32px rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}> 
                {remoteAvatarUrl ? ( 
                  <img src={remoteAvatarUrl} alt="Remote Peer Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> 
                ) : ( 
                  <span style={{ fontSize: '2.2rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.03em' }}> {remoteInitial} </span> 
                )} 
              </div> 
            </div> 
            <span style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 600, letterSpacing: '0.01em', textAlign: 'center', maxWidth: '80%', lineHeight: 1.4 }}> 
              {callState === 'ringing' && 'Awaiting secure node acceptance pipeline...'} 
              {callState === 'connecting' && 'Negotiating symmetric tunneling parameters...'} 
              {callState === 'busy' && 'Remote station reporting busy network metrics.'} 
              {callState === 'connected' && callType === 'voice' && 'Audio matrix successfully stream synchronized.'} 
            </span> 
          </div> 
        )} 

        {/* VIEW 2: PREMIUM PICTURE-IN-PICTURE CHAT VIDEO CANVAS STACK */} 
        <div style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: (isConnected && callType === 'video') ? 'block' : 'none', borderRadius: '18px', overflow: 'hidden', background: '#010307', border: '1px solid #1e293b', boxShadow: '0 20px 40px rgba(0,0,0,0.6)' }}> 
          
          {/* Main Monitor Screen: Remote Stream Track */}
          <video ref={callType === 'video' ? remoteVideoRef : null} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', background: '#010307' }} /> 

          {/* CYBER-GLOW PICTURE-IN-PICTURE LOCAL VIDEO WINDOW */}
          <div style={{ 
            position: 'absolute', 
            bottom: '24px', 
            right: '24px', 
            width: '106px', 
            height: '154px', 
            borderRadius: '16px', 
            overflow: 'hidden', 
            border: '2px solid #2563eb', 
            background: '#020617', 
            boxShadow: '0 0 16px rgba(37, 99, 235, 0.4), 0 12px 24px rgba(0,0,0,0.6)', 
            zIndex: 5, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            animation: 'pipPulseGlow 3s infinite ease-in-out'
          }}> 
            <style>{`
              @keyframes pipPulseGlow {
                0%, 100% { border-color: #2563eb; box-shadow: 0 0 12px rgba(37, 99, 235, 0.35), 0 10px 20px rgba(0,0,0,0.5); }
                50% { border-color: #60a5fa; box-shadow: 0 0 22px rgba(96, 165, 250, 0.6), 0 10px 20px rgba(0,0,0,0.5); }
              }
              @keyframes neonTimePulse {
                0%, 100% { text-shadow: 0 0 4px rgba(56, 189, 248, 0.4); opacity: 0.9; }
                50% { text-shadow: 0 0 12px rgba(56, 189, 248, 0.8); opacity: 1; }
              }
            `}</style>

            <video 
              ref={callType === 'video' ? localVideoRef : null} 
              autoPlay 
              playsInline 
              muted 
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: !isCamOff ? 'block' : 'none' }} 
            /> 
            {isCamOff && ( 
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a' }}> 
                {localAvatarUrl ? ( 
                  <img src={localAvatarUrl} alt="Local User Profile" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.45 }} /> 
                ) : ( 
                  <span style={{ fontSize: '1.35rem', fontWeight: 800, color: '#64748b', letterSpacing: '-0.02em' }}> 
                    {localInitial} 
                  </span> 
                )} 
              </div> 
            )} 
          </div> 
        </div> 
      </div>
      {/* HIGHLY INTERACTIVE HUD SETTINGS DASHBOARD SYSTEM */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '22px', width: '100%', zIndex: 10, marginTop: 'auto', paddingBottom: '16px' }}> 
        
        {/* NEON CONNECTED TIMER CAPSULE */}
        {isConnected && ( 
          <div style={{ 
            background: 'rgba(15, 23, 42, 0.65)', 
            padding: '8px 20px', 
            borderRadius: '30px', 
            border: '1px solid rgba(255,255,255,0.08)', 
            fontSize: '0.86rem', 
            fontFamily: 'monospace',
            fontWeight: 800, 
            color: '#38bdf8', 
            letterSpacing: '0.12em', 
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
            animation: 'neonTimePulse 2s infinite ease-in-out'
          }}> 
            {formatTimer(callDuration)} 
          </div> 
        )} 

        {/* INTERACTIVE SHINY CONTROL STRIP SECTION NODE */}
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center', justifyContent: 'center', width: '100%' }}> 
          
          {/* CONTROL 1: MIC TOGGLE */}
          {isConnected && ( 
            <button 
              onClick={toggleMic} 
              title={isMicMuted ? "Unmute Mic" : "Mute Mic"}
              style={{ 
                background: isMicMuted ? 'linear-gradient(135deg, #ef4444, #b91c1c)' : 'rgba(30, 41, 59, 0.75)', 
                color: '#ffffff', 
                border: isMicMuted ? 'none' : '1px solid rgba(255,255,255,0.1)', 
                width: '52px', 
                height: '52px', 
                borderRadius: '50%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                cursor: 'pointer', 
                boxShadow: isMicMuted ? '0 4px 14px rgba(239,68,68,0.4)' : '0 4px 12px rgba(0,0,0,0.2)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)' 
              }} 
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.12)'; if(!isMicMuted) e.currentTarget.style.background = 'rgba(47, 61, 85, 0.9)'; }} 
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; if(!isMicMuted) e.currentTarget.style.background = 'rgba(30, 41, 59, 0.75)'; }} 
            > 
              {isMicMuted ? <MicOff size={20} strokeWidth={2.5} /> : <Mic size={20} strokeWidth={2.5} />} 
            </button> 
          )} 

          {/* CONTROL 2: INBOUND DIALOG CALL ROUTERS */}
          {(callState === 'incoming' || callState === 'connecting') ? ( 
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}> 
              
              <button 
                onClick={() => onAcceptTrigger && onAcceptTrigger()} 
                disabled={callState === 'connecting'} 
                style={{ 
                  background: callState === 'connecting' ? '#475569' : 'linear-gradient(135deg, #10b981, #047857)', 
                  color: '#ffffff', 
                  border: 'none', 
                  borderRadius: '16px', 
                  padding: '14px 32px', 
                  fontSize: '0.88rem', 
                  fontWeight: 700, 
                  cursor: callState === 'connecting' ? 'not-allowed' : 'pointer', 
                  boxShadow: callState === 'connecting' ? 'none' : '0 10px 20px rgba(16,185,129,0.35)', 
                  transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px' 
                }} 
                onMouseEnter={(e) => { if(callState !== 'connecting') e.currentTarget.style.transform = 'scale(1.06)'; }} 
                onMouseLeave={(e) => { if(callState !== 'connecting') e.currentTarget.style.transform = 'scale(1)'; }} 
              > 
                <Phone size={15} fill="currentColor" /> 
                <span>{callState === 'connecting' ? 'Connecting Link...' : 'Accept Call'}</span> 
              </button> 

              <button 
                onClick={() => onEndTrigger && onEndTrigger()} 
                style={{ 
                  background: 'linear-gradient(135deg, #ef4444, #dc2626)', 
                  color: '#ffffff', 
                  border: 'none', 
                  borderRadius: '16px', 
                  padding: '14px 32px', 
                  fontSize: '0.88rem', 
                  fontWeight: 700, 
                  cursor: 'pointer', 
                  boxShadow: '0 10px 20px rgba(239,68,68,0.35)', 
                  transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px' 
                }} 
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.06)'} 
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'} 
              > 
                <PhoneOff size={15} /> 
                <span>Decline</span>
              </button> 
            </div> 
          ) : ( 
            <button 
              onClick={() => onEndTrigger && onEndTrigger()} 
              title="End Call Session"
              style={{ 
                background: 'linear-gradient(135deg, #ef4444, #b91c1c)', 
                color: '#ffffff', 
                border: 'none', 
                width: '56px', 
                height: '56px', 
                borderRadius: '50%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                cursor: 'pointer', 
                boxShadow: '0 8px 24px rgba(239,68,68,0.45)', 
                transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)' 
              }} 
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.14)'} 
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'} 
            > 
              <PhoneOff size={22} /> 
            </button> 
          )} 

          {/* CONTROL 3: CAMERA TOGGLE */}
          {isConnected && callType === 'video' && ( 
            <button 
              onClick={toggleCamera} 
              title={isCamOff ? "Turn Cam On" : "Turn Cam Off"}
              style={{ 
                background: isCamOff ? 'linear-gradient(135deg, #ef4444, #b91c1c)' : 'rgba(30, 41, 59, 0.75)', 
                color: '#ffffff', 
                border: isCamOff ? 'none' : '1px solid rgba(255,255,255,0.1)', 
                width: '52px', 
                height: '52px', 
                borderRadius: '50%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                cursor: 'pointer', 
                boxShadow: isCamOff ? '0 4px 14px rgba(239,68,68,0.4)' : '0 4px 12px rgba(0,0,0,0.2)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)' 
              }} 
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.12)'; if(!isCamOff) e.currentTarget.style.background = 'rgba(47, 61, 85, 0.9)'; }} 
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; if(!isCamOff) e.currentTarget.style.background = 'rgba(30, 41, 59, 0.75)'; }} 
            > 
              {isCamOff ? <VideoOff size={20} strokeWidth={2.5} /> : <Video size={20} strokeWidth={2.5} />} 
            </button> 
          )} 
        </div> 
      </div> 
    </div> 
  ); 
};
