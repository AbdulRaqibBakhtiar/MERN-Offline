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
    if (navigateToRoom) { 
      navigateToRoom(roomItem); 
    } 
    if (setActiveView) { 
      setActiveView('chat'); 
    } 
  }; 

  const filteredChannels = chatChannels.filter(chan => 
    chan.name?.toLowerCase().includes(hubSearchQuery.toLowerCase())
  );

  const filteredContacts = personalContacts.filter(contact => 
    contact.name?.toLowerCase().includes(hubSearchQuery.toLowerCase()) ||
    contact.desc?.toLowerCase().includes(hubSearchQuery.toLowerCase())
  );

  return ( 
    <div style={{ flex: 1, overflowY: 'auto', background: 'var(--bg-main, #0f172a)', padding: '16px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: '16px' }}> 
      
      {!showCreateGroup && (
        <div style={{ position: 'relative', width: '100%', display: 'flex', alignItems: 'center' }}>
          <div style={{ position: 'absolute', left: '12px', display: 'flex', alignItems: 'center', pointerEvents: 'none', zIndex: 2 }}>
            <Search size={14} style={{ color: '#94a3b8' }} />
          </div>
          <input 
            type="text" 
            placeholder="Search users or groups..." 
            value={hubSearchQuery}
            onChange={(e) => setHubSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '8px 12px 8px 34px', fontSize: '0.78rem', border: '1px solid var(--border-color, #334155)', borderRadius: '18px', outline: 'none', background: 'var(--bg-card, #1e293b)', color: 'var(--text-primary, #f8fafc)', boxSizing: 'border-box', height: '34px' }}
          />
          {hubSearchQuery && (
            <button 
              onClick={() => setHubSearchQuery('')} 
              style={{ position: 'absolute', right: '12px', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }}
            >
              <X size={12} />
            </button>
          )}
        </div>
      )}

      {showCreateGroup ? ( 
        <form 
          onSubmit={(e) => {
            triggerCreateGroup(e);
            if (setActiveView) {
              setActiveView('chat');
            }
          }} 
          style={{ background: 'var(--bg-card, #1e293b)', border: '1px solid var(--border-color, #334155)', borderRadius: '12px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}
        > 
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}> 
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary, #f8fafc)' }}>New Collaboration Group</span> 
            <button type="button" onClick={() => setShowCreateGroup(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted, #94a3b8)', cursor: 'pointer', display: 'flex' }}><X size={14} /></button> 
          </div> 
          
          <input type="text" placeholder="Group title..." value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} style={{ width: '100%', padding: '8px 10px', fontSize: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color, #334155)', outline: 'none', background: 'var(--bg-main, #0f172a)', color: 'var(--text-primary, #f8fafc)', boxSizing: 'border-box' }} required /> 
          
          <div> 
            <label style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-muted, #94a3b8)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Select Members</label> 
            <div style={{ maxHeight: '100px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px', background: 'var(--bg-main, #0f172a)', padding: '6px', borderRadius: '8px', border: '1px solid var(--border-color, #334155)' }}> 
              {personalContacts.map(peer => ( 
                <button key={peer.id} type="button" onClick={() => toggleMemberSelection(peer.id)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 8px', borderRadius: '6px', background: selectedMembers.includes(peer.id) ? 'rgba(37, 99, 235, 0.2)' : 'transparent', border: 'none', cursor: 'pointer' }} > 
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-primary, #f8fafc)' }}>{peer.name}</span> 
                  <div style={{ width: '12px', height: '12px', borderRadius: '3px', border: '1px solid #2563eb', background: selectedMembers.includes(peer.id) ? '#2563eb' : 'transparent' }} /> 
                </button> 
              ))} 
            </div> 
          </div> 
          
          <button type="submit" style={{ width: '100%', padding: '8px 0', borderRadius: '8px', background: '#2563eb', color: '#ffffff', border: 'none', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}> 
            Provision Group 
          </button> 
        </form> 
      ) : ( 
        <button onClick={() => setShowCreateGroup(true)} style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-card, #1e293b)', border: '1px dashed var(--border-color, #334155)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary, #f8fafc)', transition: 'all 0.2s', flexShrink: 0 }} onMouseEnter={(e) => e.currentTarget.style.borderColor = '#2563eb'} onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-color, #334155)'}> 
          <Plus size={14} /> 
          <span>Create Workspace Group</span> 
        </button> 
      )} 
      {/* Active Channels Listing Buttons */} 
      <div> 
        <h4 style={{ margin: '0 0 8px 4px', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted, #94a3b8)', fontWeight: 600 }}>Active Channels</h4> 
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}> 
          {filteredChannels.length === 0 ? ( 
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted, #94a3b8)', fontStyle: 'italic', paddingLeft: '4px' }}>
              {hubSearchQuery ? "No matching channels" : "No workspace channels setup"}
            </div> 
          ) : ( 
            filteredChannels.map(chan => {
              const channelAvatar = resolveDrawerImgUrl(chan.avatar || chan.profileImage);
              return (
                <button key={chan.id || chan._id} onClick={() => handleSelectRoom(chan)} style={{ width: '100%', display: 'flex', alignItems: 'center', padding: '10px 12px', background: 'var(--bg-card, #1e293b)', border: '1px solid var(--border-color, #334155)', borderRadius: '10px', cursor: 'pointer', textAlign: 'left' }} onMouseEnter={(e) => e.currentTarget.style.borderColor = '#2563eb'} onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-color, #334155)'}> 
                  <div style={{ position: 'relative', width: '28px', height: '28px', marginRight: '10px', flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                    {channelAvatar ? (
                      <img 
                        src={channelAvatar} 
                        alt="" 
                        style={{ width: '28px', height: '28px', borderRadius: '8px', objectFit: 'cover' }} 
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          if (e.currentTarget.nextSibling) {
                            e.currentTarget.nextSibling.style.display = 'flex';
                          }
                        }}
                      />
                    ) : null}
                    <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(37, 99, 235, 0.1)', color: '#2563eb', display: channelAvatar ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Users size={13} />
                    </div>
                  </div>
                  <div> 
                    <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary, #f8fafc)' }}>{chan.name}</div> 
                    <div style={{ fontSize: '0.62rem', color: 'var(--text-muted, #94a3b8)', marginTop: '1px' }}>{chan.members?.length || 0} members</div> 
                  </div> 
                </button>
              );
            }) 
          )} 
        </div> 
      </div>

      {/* Personnel Directory Selection Buttons */} 
      <div> 
        <h4 style={{ margin: '0 0 8px 4px', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted, #94a3b8)', fontWeight: 600 }}>Personnel Directory</h4> 
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}> 
          {filteredContacts.length === 0 ? (
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted, #94a3b8)', fontStyle: 'italic', paddingLeft: '4px' }}>No matching personnel found</div>
          ) : (
            filteredContacts.map(contact => {
              const contactAvatar = resolveDrawerImgUrl(contact.avatar || contact.profileImage);
              return (
                <button key={contact.id} onClick={() => handleSelectRoom(contact)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: 'var(--bg-card, #1e293b)', border: '1px solid var(--border-color, #334155)', borderRadius: '10px', cursor: 'pointer', textAlign: 'left' }} onMouseEnter={(e) => e.currentTarget.style.borderColor = '#2563eb'} onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-color, #334155)'}> 
                  <div style={{ position: 'relative', width: '28px', height: '28px', flexShrink: 0, display: 'flex', alignItems: 'center' }}> 
                    {contactAvatar ? (
                      <img 
                        src={contactAvatar} 
                        alt="" 
                        style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} 
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          if (e.currentTarget.nextSibling) {
                            e.currentTarget.nextSibling.style.display = 'flex';
                          }
                        }}
                      />
                    ) : null}
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--bg-main, #0f172a)', color: 'var(--text-muted, #94a3b8)', display: contactAvatar ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 'bold' }}>
                      {(contact.name || '?').charAt(0).toUpperCase()}
                    </div> 
                  </div> 
                  <div> 
                    <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary, #f8fafc)' }}>{contact.name}</div> 
                    <div style={{ fontSize: '0.62rem', color: 'var(--text-muted, #94a3b8)', marginTop: '1px' }}>{contact.desc}</div> 
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
