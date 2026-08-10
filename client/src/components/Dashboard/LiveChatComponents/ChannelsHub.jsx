import React, { useState } from 'react';
import { User, Plus, X, Users, Search } from 'lucide-react';

export const ChannelsHub = ({ chatProps, resolveDrawerImgUrl }) => {
  const { 
    chatChannels = [], 
    personalContacts = [], 
    navigateToRoom, 
    showCreateGroup, 
    setShowCreateGroup, 
    newGroupName, 
    setNewGroupName, 
    selectedMembers, 
    triggerCreateGroup, 
    toggleMemberSelection, 
    setActiveView 
  } = chatProps;

  const [hubSearchQuery, setHubSearchQuery] = useState('');

  const handleSelectRoom = (roomItem) => {
    if (navigateToRoom) navigateToRoom(roomItem);
    if (setActiveView) setActiveView('chat');
  };

  const filteredChannels = chatChannels.filter(chan => 
    chan.name?.toLowerCase().includes(hubSearchQuery.toLowerCase())
  );

  const filteredContacts = personalContacts.filter(contact => 
    contact.name?.toLowerCase().includes(hubSearchQuery.toLowerCase()) || 
    contact.desc?.toLowerCase().includes(hubSearchQuery.toLowerCase())
  );

  return (
    <div style={{ 
      flex: 1, 
      overflowY: 'auto', 
      background: 'var(--bg-main, #0f172a)', 
      padding: '16px', 
      boxSizing: 'border-box', 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '16px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      
      {/* 🔍 SEARCH COMPONENT TRAY */}
      {!showCreateGroup && (
        <div style={{ position: 'relative', width: '100%', display: 'flex', alignItems: 'center' }}>
          <div style={{ position: 'absolute', left: '12px', display: 'flex', alignItems: 'center', pointerEvents: 'none', zIndex: 2 }}>
            <Search size={14} style={{ color: '#64748b' }} />
          </div>
          <input 
            type="text" 
            placeholder="Search users or channels..." 
            value={hubSearchQuery} 
            onChange={(e) => setHubSearchQuery(e.target.value)} 
            style={{ 
              width: '100%', 
              padding: '8px 12px 8px 36px', 
              fontSize: '0.8rem', 
              border: '1px solid var(--border-color, #1e293b)', 
              borderRadius: '20px', 
              outline: 'none', 
              background: 'var(--bg-card, #1e293b)', 
              color: 'var(--text-primary, #f8fafc)', 
              boxSizing: 'border-box', 
              height: '36px',
              transition: 'all 0.2s ease'
            }} 
            onFocus={(e) => e.target.style.borderColor = '#2563eb'}
            onBlur={(e) => e.target.style.borderColor = 'var(--border-color, #1e293b)'}
          />
          {hubSearchQuery && (
            <button 
              onClick={() => setHubSearchQuery('')} 
              style={{ position: 'absolute', right: '12px', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }}
            >
              <X size={14} />
            </button>
          )}
        </div>
      )}
      {/* 🛠️ GROUP PROVISIONING CONTAINER FORM */}
      {showCreateGroup ? (
        <form 
          onSubmit={(e) => { 
            triggerCreateGroup(e); 
            if (setActiveView) setActiveView('chat'); 
          }} 
          style={{ 
            background: 'var(--bg-card, #1e293b)', 
            border: '1px solid #2563eb', 
            borderRadius: '16px', 
            padding: '16px', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '12px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary, #f8fafc)', letterSpacing: '-0.01em' }}>
              Create Collaboration Channel
            </span>
            <button 
              type="button" 
              onClick={() => setShowCreateGroup(false)} 
              style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'var(--text-muted, #94a3b8)', cursor: 'pointer', display: 'flex', padding: '4px', borderRadius: '50%' }}
            >
              <X size={14} />
            </button>
          </div>
          
          <input 
            type="text" 
            placeholder="Channel name..." 
            value={newGroupName} 
            onChange={(e) => setNewGroupName(e.target.value)} 
            style={{ width: '100%', padding: '10px 12px', fontSize: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-color, #334155)', outline: 'none', background: 'var(--bg-main, #0f172a)', color: 'var(--text-primary, #f8fafc)', boxSizing: 'border-box' }} 
            required 
          />
          
          <div>
            <label style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-muted, #94a3b8)', fontWeight: 700, display: 'block', marginBottom: '6px', letterSpacing: '0.04em' }}>
              Select Workspace Personnel
            </label>
            <div className="custom-input-scroll" style={{ maxHeight: '110px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px', background: 'var(--bg-main, #0f172a)', padding: '6px', borderRadius: '10px', border: '1px solid var(--border-color, #334155)' }}>
              {personalContacts.map(peer => {
                const isSelected = selectedMembers.includes(peer.id);
                return (
                  <button 
                    key={peer.id} 
                    type="button" 
                    onClick={() => toggleMemberSelection(peer.id)} 
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', borderRadius: '6px', background: isSelected ? 'rgba(37, 99, 235, 0.15)' : 'transparent', border: 'none', cursor: 'pointer', transition: 'background 0.2s' }}
                  >
                    <span style={{ fontSize: '0.76rem', color: isSelected ? '#60a5fa' : 'var(--text-primary, #f8fafc)', fontWeight: isSelected ? 600 : 400 }}>{peer.name}</span>
                    <div style={{ width: '14px', height: '14px', borderRadius: '4px', border: '1px solid #2563eb', background: isSelected ? '#2563eb' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}>
                      {isSelected && <div style={{ width: '6px', height: '6px', background: '#fff', borderRadius: '50%' }} />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
          
          <button type="submit" style={{ width: '100%', padding: '10px 0', borderRadius: '8px', background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: '#ffffff', border: 'none', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 12px rgba(37,99,235,0.2)' }}>
            Provision New Channel
          </button>
        </form>
      ) : (
        <button 
          onClick={() => setShowCreateGroup(true)} 
          style={{ width: '100%', padding: '12px', background: 'var(--bg-card, #1e293b)', border: '1px dashed #334155', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary, #f8fafc)', transition: 'all 0.2s ease', flexShrink: 0 }} 
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#2563eb'; e.currentTarget.style.background = 'rgba(37,99,235,0.04)'; }} 
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#334155'; e.currentTarget.style.background = 'var(--bg-card, #1e293b)'; }}
        >
          <Plus size={15} color="#2563eb" strokeWidth={2.5} />
          <span>Create Workspace Group</span>
        </button>
      )}
      {/* 👥 ACTIVE CHANNELS VECTOR ROW MAP */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <h4 style={{ margin: '0 0 4px 4px', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted, #64748b)', fontWeight: 700 }}>
          Active Channels ({filteredChannels.length})
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {filteredChannels.length === 0 ? (
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748b)', fontStyle: 'italic', padding: '12px 6px', background: 'rgba(255,255,255,0.01)', borderRadius: '10px', textAlign: 'center', border: '1px dashed rgba(255,255,255,0.03)' }}>
              {hubSearchQuery ? "No matching workspace channels" : "No active collaboration channels"}
            </div>
          ) : (
            filteredChannels.map(chan => {
              const channelAvatar = resolveDrawerImgUrl(chan.avatar || chan.profileImage);
              return (
                <button 
                  key={chan.id || chan._id} 
                  onClick={() => handleSelectRoom(chan)} 
                  style={{ width: '100%', display: 'flex', alignItems: 'center', padding: '12px', background: 'var(--bg-card, #1e293b)', border: '1px solid transparent', borderRadius: '12px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s ease', gap: '12px' }} 
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(37,99,235,0.3)'; e.currentTarget.style.transform = 'translateY(-1px)'; }} 
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.transform = 'none'; }}
                >
                  <div style={{ position: 'relative', width: '32px', height: '32px', flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                    {channelAvatar ? (
                      <img src={channelAvatar} alt="" style={{ width: '32px', height: '32px', borderRadius: '10px', objectFit: 'cover' }} onError={(e) => { e.currentTarget.style.display = 'none'; if (e.currentTarget.nextSibling) e.currentTarget.nextSibling.style.display = 'flex'; }} />
                    ) : null}
                    <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(37, 99, 235, 0.12)', color: '#60a5fa', display: channelAvatar ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Users size={14} />
                    </div>
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary, #f8fafc)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{chan.name}</div>
                    <div style={{ fontSize: '0.66rem', color: 'var(--text-muted, #94a3b8)', marginTop: '2px' }}>{chan.members?.length || 0} participants</div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* 👤 PERSONNEL DIRECTORY SELECTION ROWS */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <h4 style={{ margin: '0 0 4px 4px', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted, #64748b)', fontWeight: 700 }}>
          Personnel Directory ({filteredContacts.length})
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {filteredContacts.length === 0 ? (
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748b)', fontStyle: 'italic', padding: '12px 6px', background: 'rgba(255,255,255,0.01)', borderRadius: '10px', textAlign: 'center', border: '1px dashed rgba(255,255,255,0.03)' }}>
              No matching workspace members found
            </div>
          ) : (
            filteredContacts.map(contact => {
              const contactAvatar = resolveDrawerImgUrl(contact.avatar || contact.profileImage);
              return (
                <button 
                  key={contact.id} 
                  onClick={() => handleSelectRoom(contact)} 
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'var(--bg-card, #1e293b)', border: '1px solid transparent', borderRadius: '12px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s ease' }} 
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(37,99,235,0.3)'; e.currentTarget.style.transform = 'translateY(-1px)'; }} 
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.transform = 'none'; }}
                >
                  <div style={{ position: 'relative', width: '32px', height: '32px', flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                    {contactAvatar ? (
                      <img src={contactAvatar} alt="" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} onError={(e) => { e.currentTarget.style.display = 'none'; if (e.currentTarget.nextSibling) e.currentTarget.nextSibling.style.display = 'flex'; }} />
                    ) : null}
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--bg-main, #0f172a)', color: '#94a3b8', display: contactAvatar ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.76rem', fontWeight: 700, border: '1px solid #334155' }}>
                      {(contact.name || '?').charAt(0).toUpperCase()}
                    </div>
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary, #f8fafc)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{contact.name}</div>
                    <div style={{ fontSize: '0.66rem', color: 'var(--text-muted, #94a3b8)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{contact.desc}</div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
