import React from 'react';
import { Phone, Video, X, ArrowLeft, ChevronLeft, Shield, MessageSquare, Users } from 'lucide-react';

export const ChatHeader = ({ chatProps, resolveDrawerImgUrl }) => {
  const { 
    setIsOpen, activeView, setActiveView, currentRoom, setCurrentRoom, 
    activeUsersList = [], callState = 'idle', initiateCallSession, currentUserId 
  } = chatProps || {};

  // Fallback to internal lookup tool if not supplied from parent context
  const resolveHeaderImgUrl = resolveDrawerImgUrl || ((imgField) => {
    if (!imgField) return null;
    if (imgField.startsWith('http://') || imgField.startsWith('https://') || imgField.startsWith('data:')) {
      return imgField;
    }
    const backendHost = "http://localhost:5000";
    let cleanPath = imgField.replace(/\\/g, '/');
    if (!cleanPath.startsWith('public/') && !cleanPath.startsWith('/public/')) {
      if (cleanPath.startsWith('uploads/profiles/')) {
        cleanPath = `public/${cleanPath}`;
      } else if (cleanPath.startsWith('/uploads/profiles/')) {
        cleanPath = `public${cleanPath}`;
      } else {
        cleanPath = `public/uploads/profiles/${cleanPath.startsWith('/') ? cleanPath.substring(1) : cleanPath}`;
      }
    }
    const finalSlug = cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`;
    return `${backendHost}${finalSlug}`;
  });

  const headerAvatar = currentRoom?.avatar || null;
  const finalHeaderAvatarUrl = resolveHeaderImgUrl(headerAvatar);
  const normalizedRoomId = currentRoom?.id || currentRoom?._id;
  const isPersonalNotes = currentRoom && (currentRoom.type === 'personal' || String(normalizedRoomId) === String(currentUserId));
  const showCallButtons = activeView !== 'hub' && currentRoom && !isPersonalNotes && callState === 'idle';

  // Check if the current direct message peer is online right now
  const isPeerOnline = currentRoom?.type === 'dm' && activeUsersList.some(u => String(u.userId) === String(currentRoom.peerId));

  const headerStyles = `
    @keyframes greenDotBreathe {
      0%, 100% { opacity: 0.6; transform: scale(0.9); }
      50% { opacity: 1; transform: scale(1.1); }
    }
  `;
  return (
    <div style={{ 
      padding: '0 14px', 
      background: 'var(--bg-header, var(--bg-card, #0f172a))', 
      color: 'var(--text-header, var(--text-primary, #ffffff))', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'space-between', 
      borderBottom: '1px solid var(--border-color, #1e293b)', 
      boxSizing: 'border-box', 
      height: '56px', 
      width: '100%', 
      fontFamily: 'system-ui, -apple-system, sans-serif', 
      boxShadow: chatProps?.isHeaderGlassRef ? '0 10px 30px rgba(15, 23, 42, 0.08), 0 1px 3px rgba(0, 0, 0, 0.02)' : 'none', 
      backdropFilter: chatProps?.isHeaderGlassRef ? 'blur(16px)' : 'none', 
      WebkitBackdropFilter: chatProps?.isHeaderGlassRef ? 'blur(16px)' : 'none', 
      transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)', 
      position: 'relative', 
      zIndex: 10 
    }}>
      <style>{headerStyles}</style>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
        {/* LEFT ACTION BUTTONS */}
        {activeView === 'hub' ? (
          <button onClick={() => { if (setActiveView) setActiveView('chat'); if (setCurrentRoom) setCurrentRoom(null); }} style={{ background: 'var(--bg-button-hover, rgba(120,120,120,0.1))', border: 'none', color: 'var(--text-muted, #94a3b8)', cursor: 'pointer', padding: '6px', display: 'flex', alignItems: 'center', borderRadius: '8px', flexShrink: 0, transition: 'all 0.2s' }} title="Back to Recent Chats">
            <ChevronLeft size={16} />
          </button>
        ) : currentRoom ? (
          <button onClick={() => { if (setActiveView) setActiveView('chat'); if (setCurrentRoom) setCurrentRoom(null); }} style={{ background: 'var(--bg-button-hover, rgba(120,120,120,0.1))', border: 'none', color: 'var(--text-header, var(--text-primary, #ffffff))', padding: '6px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', flexShrink: 0, transition: 'all 0.2s' }} title="Back to Recent Chats">
            <ArrowLeft size={16} />
          </button>
        ) : null}

        {/* PROFILE PICTURE AVATAR FRAME */}
        {currentRoom && (
          <div style={{ flexShrink: 0, marginRight: '-2px', display: 'flex', alignItems: 'center', position: 'relative' }}>
            {finalHeaderAvatarUrl ? (
              <img src={finalHeaderAvatarUrl} alt="" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)' }} onError={(e) => { e.currentTarget.style.display = 'none'; if (e.currentTarget.nextSibling) { e.currentTarget.nextSibling.style.display = 'flex'; } }} />
            ) : null}
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: currentRoom.type === 'group' ? '#e0f2fe' : 'var(--bg-button-hover, rgba(120,120,120,0.15))', display: finalHeaderAvatarUrl ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 'bold', color: currentRoom.type === 'group' ? '#0369a1' : '#ffffff', border: '1px solid rgba(255,255,255,0.1)' }}>
              {currentRoom.type === 'group' ? <Users size={14} /> : (currentRoom.name || '?').charAt(0).toUpperCase()}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-header, var(--text-primary, #ffffff))' }}>
            {activeView === 'hub' ? 'Directory Hub' : (!currentRoom ? 'Recent Chats' : currentRoom.name)}
          </div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted, #94a3b8)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '5px' }}>
            {activeView === 'hub' ? (
              <span>Select contact or join a group room</span>
            ) : !currentRoom ? (
              <span>Viewing latest inbox logs</span>
            ) : isPersonalNotes ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '3px', color: '#3b82f6', fontWeight: 600 }}><Shield size={10} /> Secure personal vault</span>
            ) : currentRoom.type === 'dm' ? (
              isPeerOnline ? (
                <>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', display: 'inline-block', animation: 'greenDotBreathe 1.5s infinite alternate' }} />
                  <span style={{ color: '#22c55e', fontWeight: '500' }}>Active Now</span>
                </>
              ) : (
                <span style={{ color: '#64748b' }}>Offline</span>
              )
            ) : (
              <>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
                <span>Channel Active</span>
              </>
            )}
          </div>
        </div>
      </div>
      {/* RIGHT SIDE CONTROLS CONTROLLER ENGINE */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0, marginLeft: '12px' }}>
        {activeView === 'hub' && (
          <button onClick={() => { if (setActiveView) setActiveView('chat'); if (setCurrentRoom) setCurrentRoom(null); }} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted, #94a3b8)', cursor: 'pointer', width: '30px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease' }} onMouseEnter={(e) => { e.currentTarget.style.color = '#3b82f6'; e.currentTarget.style.background = 'rgba(59, 130, 246, 0.12)'; }} onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted, #94a3b8)'; e.currentTarget.style.background = 'transparent'; }} title="Go to Recent Chats Menu">
            <MessageSquare size={15} />
          </button>
        )}

        {showCallButtons && (
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            <button onClick={() => initiateCallSession && initiateCallSession("voice", currentRoom.type === "dm" ? { roomId: currentRoom.id || currentRoom._id, targetPeerId: currentRoom.peerId } : { roomId: currentRoom.id || currentRoom._id })} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted, #94a3b8)', cursor: 'pointer', width: '30px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease' }} onMouseEnter={(e) => { e.currentTarget.style.color = '#22c55e'; e.currentTarget.style.background = 'rgba(34, 197, 94, 0.12)'; }} onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted, #94a3b8)'; e.currentTarget.style.background = 'transparent'; }} title="Voice Call Session">
              <Phone size={14} fill="currentColor" />
            </button>
            <button onClick={() => initiateCallSession && initiateCallSession("video", currentRoom.type === "dm" ? { roomId: currentRoom.id || currentRoom._id, targetPeerId: currentRoom.peerId } : { roomId: currentRoom.id || currentRoom._id })} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted, #94a3b8)', cursor: 'pointer', width: '30px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease' }} onMouseEnter={(e) => { e.currentTarget.style.color = '#06b6d4'; e.currentTarget.style.background = 'rgba(6,182,212,0.12)'; }} onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted, #94a3b8)'; e.currentTarget.style.background = 'transparent'; }} title="Video Call Session">
              <Video size={14} fill="currentColor" />
            </button>
          </div>
        )}

        <button onClick={() => setIsOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted, #94a3b8)', cursor: 'pointer', width: '30px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }} onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = 'rgba(239,68,68,0.12)'; }} onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted, #94a3b8)'; e.currentTarget.style.background = 'transparent'; }} title="Minimize Messenger">
          <X size={15} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
};
