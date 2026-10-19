import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { MessageSquare, Circle, Users, X, Trash2, PhoneCall } from 'lucide-react';
import { API_BASE_URL } from '../../api/config';
import { useLiveChat } from '../../hooks/useLiveChat';
import { ChatHeader } from './LiveChatComponents/ChatHeader';
import { CallOverlay } from './LiveChatComponents/CallOverlay';
import { MessagesFeed } from './LiveChatComponents/MessagesFeed';
import { ChatInputForm } from './LiveChatComponents/ChatInputForm';
import { ChannelsHub } from './LiveChatComponents/ChannelsHub';
import { BuiltInNotification } from '../Layout/BuiltInNotification';
import { MediaLightbox } from '../Layout/MediaLightbox';
import MarketplaceChatPanel from './MarketplaceChatPanel';
import CallHistoryPanel from './CallHistoryPanel';

export const LiveChatDrawer = ({ socket, user, chatRequest, onChatRequestHandled }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [recentChatMenuCoords, setRecentChatMenuCoords] = useState(null);
  const [targetActiveConversationId, setTargetActiveConversationId] = useState(null);
  const [messagingSection, setMessagingSection] = useState('workspace');
  const handledChatRequestRef = useRef(null);

  const chatProps = useLiveChat(socket, user);
  const toast = chatProps?.toast || { show: false };
  const globalUnreadCounter = chatProps.recentChatsList?.reduce((sum, item) => sum + (item.unreadCount || 0), 0) || 0;
  const priorUnreadRef = useRef(globalUnreadCounter);

  useEffect(() => {
    const vendor = chatRequest?.vendor;
    const vendorId = typeof vendor === 'string' ? vendor : vendor?._id || vendor?.id;
    if (!vendorId || !chatProps?.navigateToRoom || handledChatRequestRef.current === chatRequest.requestId) return;
    handledChatRequestRef.current = chatRequest.requestId;
    const targetId = String(vendorId);
    if (targetId === String(user?._id || user?.id)) {
      onChatRequestHandled?.();
      return;
    }
    setMessagingSection('workspace');
    chatProps.setIsOpen(true);
    chatProps.navigateToRoom({
      type: 'peer',
      id: targetId,
      name: typeof vendor === 'object' ? vendor.username || 'Seller' : 'Seller',
      avatar: typeof vendor === 'object' ? vendor.profileImage || null : null
    });
    chatProps.setMessage(`Hi, I'm interested in ${chatRequest.product?.name || 'your product'}. Is it still available?`);
    onChatRequestHandled?.();
  }, [chatRequest, chatProps, user?._id, user?.id, onChatRequestHandled]);

  // 🚀 BACKGROUND MONITOR: Notification tab updater and chime synchronization engine
  useEffect(() => {
    const baseTitle = "Workspace Dashboard";
    const targetTitle = globalUnreadCounter > 0 ? `(${globalUnreadCounter}) New Messages | ${baseTitle}` : baseTitle;
    if (document.title !== targetTitle) {
      document.title = targetTitle;
    }

    if (globalUnreadCounter > priorUnreadRef.current) {
      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(587.33, audioCtx.currentTime);
        oscillator.frequency.setValueAtTime(880.00, audioCtx.currentTime + 0.08);
        gainNode.gain.setValueAtTime(0.12, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.35);
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.35);
      } catch (audioErr) {
        console.warn("Audio chime block bypass:", audioErr);
      }
    }
    priorUnreadRef.current = globalUnreadCounter;
  }, [globalUnreadCounter]);

  // Dismiss context menu listeners safely on outside user clicks
  useEffect(() => {
    const closeRecentMenu = () => setRecentChatMenuCoords(null);
    if (recentChatMenuCoords) document.addEventListener('click', closeRecentMenu);
    return () => document.removeEventListener('click', closeRecentMenu);
  }, [recentChatMenuCoords]);

  const handleFeedScrollCheck = (e) => {
    if (e.target.scrollTop > 4) {
      setIsScrolled(true);
    } else {
      setIsScrolled(false);
    }
  };
  const handleRecentChatContextMenu = (e, item) => {
    e.preventDefault();
    setTargetActiveConversationId(item.roomId || item.id);
    setRecentChatMenuCoords({
      x: e.clientX,
      y: e.clientY
    });
  };

  const resolveDrawerImgUrl = (imgField) => {
    if (!imgField) return null;
    if (imgField.startsWith('http://') || imgField.startsWith('https://') || imgField.startsWith('data:')) {
      return imgField;
    }
    const backendHost = API_BASE_URL;
    let cleanPath = imgField.replace(/\\/g, '/');
    while (cleanPath.startsWith('/')) {
      cleanPath = cleanPath.substring(1);
    }
    if (cleanPath.startsWith('public/')) {
      cleanPath = cleanPath.replace('public/', '');
    }
    return `${backendHost}/${cleanPath}`;
  };

  return (
    <div style={{ position: 'fixed', bottom: 0, right: '24px', zIndex: 9999, fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif' }}>
      {!chatProps.isOpen ? (
        <button onClick={() => chatProps.setIsOpen && chatProps.setIsOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 22px', background: '#0f172a', color: '#ffffff', border: 'none', borderRadius: '14px 14px 0 0', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem', letterSpacing: '-0.01em', boxShadow: '0 -4px 16px rgba(15,23,42,0.15)' }}>
          <MessageSquare size={16} />
          <span>Workspace Messenger</span>
          {globalUnreadCounter > 0 && (<span style={{ background: '#ef4444', color: '#fff', borderRadius: '10px', padding: '2px 7px', fontSize: '0.65rem', fontWeight: 'bold' }}>{globalUnreadCounter}</span>)}
        </button>
      ) : (
        <div style={{ width: '360px', height: '540px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px 14px 0 0', boxShadow: '0 -10px 40px rgba(15,23,42,0.12)', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
          <BuiltInNotification visible={toast.show} message={toast.message} type={toast.type} onClose={() => chatProps.setToast && chatProps.setToast({ show: false, message: '', type: 'info' })} />
          <MediaLightbox isOpen={chatProps.lightboxState?.open} mediaUrl={chatProps.lightboxState?.url} mediaType={chatProps.lightboxState?.type} onClose={() => chatProps.setLightboxState && chatProps.setLightboxState({ open: false, url: '', type: 'image' })} />

          <nav className="chat-mode-switcher" aria-label="Chat area">
            <button type="button" className={messagingSection === 'workspace' ? 'is-active' : ''} onClick={() => setMessagingSection('workspace')}>Workspace chat</button>
            <button type="button" className={messagingSection === 'marketplace' ? 'is-active' : ''} onClick={() => setMessagingSection('marketplace')}>Marketplace sellers</button>
            <button type="button" className={messagingSection === 'calls' ? 'is-active' : ''} onClick={() => setMessagingSection('calls')}><PhoneCall size={13} /> Calls</button>
          </nav>

          {chatProps.callState && chatProps.callState !== 'idle' && <CallOverlay chatProps={{ ...chatProps, user }} />}

          {messagingSection === 'marketplace' ? (
            <MarketplaceChatPanel
              socket={socket}
              user={user}
              chatProps={chatProps}
              onSelectVendor={(vendor, product) => {
                setMessagingSection('workspace');
                chatProps.navigateToRoom({ type: 'peer', id: String(vendor._id), name: vendor.username || 'Seller', avatar: vendor.profileImage || null });
                chatProps.setMessage(product ? `Hi, I'm interested in ${product.name}. Is it still available?` : 'Hi, I would like to ask about your listings.');
              }}
              onOpenWorkspaceChat={item => { setMessagingSection('workspace'); chatProps.navigateToRoom(item); }}
            />
          ) : messagingSection === 'calls' ? (
            <CallHistoryPanel socket={socket} user={user} onOpenConversation={item => { setMessagingSection('workspace'); chatProps.navigateToRoom(item); }} />
          ) : chatProps.currentRoom ? (
            <>
              <ChatHeader chatProps={{ ...chatProps, isHeaderGlassRef: isScrolled }} resolveDrawerImgUrl={resolveDrawerImgUrl} />
              <div onScroll={handleFeedScrollCheck} style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                <MessagesFeed chatProps={chatProps} user={user} resolveDrawerImgUrl={resolveDrawerImgUrl} />
              </div>
              <ChatInputForm chatProps={chatProps} />

              {/* 🚀 NEW: SLIDING bottom WORKSPACE SELECTION ACTION TOOLBAR */}
              {chatProps.isSelectionMode && (
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  width: '100%',
                  height: '62px',
                  background: '#0f172a',
                  borderTop: '1px solid #334155',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0 16px',
                  boxSizing: 'border-box',
                  zIndex: 99999,
                  animation: 'smoothSlideUpPanel 0.22s cubic-bezier(0.34, 1.56, 0.64, 1) forwards'
                }}>
                  <style>{`
      @keyframes smoothSlideUpPanel {
        0% { transform: translateY(100%); }
        100% { transform: translateY(0); }
      }
    `}</style>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      onClick={() => {
                        chatProps.setIsSelectionMode(false);
                        chatProps.setSelectedMessageIds(new Set());
                      }}
                      style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
                    >
                      <X size={16} />
                    </button>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#f8fafc' }}>
                      {chatProps.selectedMessageIds.size} Selected
                    </span>
                  </div>

                  <button
                    disabled={chatProps.selectedMessageIds.size === 0}
                    onClick={chatProps.triggerBulkDelete}
                    style={{
                      background: chatProps.selectedMessageIds.size === 0 ? '#1e293b' : 'linear-gradient(135deg, #f43f5e, #e11d48)',
                      color: chatProps.selectedMessageIds.size === 0 ? '#475569' : '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '6px 14px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: chatProps.selectedMessageIds.size === 0 ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.2s'
                    }}
                  >
                    <Trash2 size={13} /> Clear Records
                  </button>
                </div>
              )}

            </>
          ) : chatProps.activeView === 'hub' ? (
            <>
              <ChatHeader chatProps={{ ...chatProps, isHeaderGlassRef: false }} resolveDrawerImgUrl={resolveDrawerImgUrl} />
              <ChannelsHub chatProps={chatProps} resolveDrawerImgUrl={resolveDrawerImgUrl} />
            </>
          ) : (
            <>
              <div style={{ padding: '16px', borderBottom: '1px solid #e2e8f0', background: '#0f172a', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '600' }}>Recent Chats</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button onClick={() => chatProps.setActiveView('hub')} style={{ background: '#1e293b', border: 'none', color: '#fff', width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = '#334155'} onMouseLeave={(e) => e.currentTarget.style.background = '#1e293b'} title="Open Directory Hub"><Users size={16} /></button>
                  <button onClick={() => chatProps.setIsOpen && chatProps.setIsOpen(false)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }} onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = 'rgba(239,68,68,0.12)'; }} onMouseLeave={(e) => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.background = 'transparent'; }} title="Minimize Messenger"><X size={16} strokeWidth={2.5} /></button>
                </div>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', background: '#ffffff' }}>
                {chatProps.recentChatsList?.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b', fontSize: '0.85rem' }}>No active conversations. Click the directory icon to start a chat.</div>
                ) : (
                  chatProps.recentChatsList?.map((item) => {
                    const resolvedAvatar = resolveDrawerImgUrl(item.avatar);
                    return (
                      <div key={item.id} onClick={() => chatProps.navigateToRoom(item)} onContextMenu={(e) => handleRecentChatContextMenu(e, item)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', transition: 'background 0.2s', position: 'relative' }} onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                          {resolvedAvatar ? (
                            <img src={resolvedAvatar} alt={item.name} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #e2e8f0' }} onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextSibling.style.display = 'flex'; }} />
                          ) : null}
                          {(!resolvedAvatar) && (
                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: item.type === 'group' ? '#e0f2fe' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: item.type === 'group' ? '#0369a1' : '#475569', fontWeight: 600, border: '1px solid #e2e8f0' }}>
                              {item.type === 'group' ? <Users size={18} /> : (item.name || '?').charAt(0).toUpperCase()}
                            </div>
                          )}
                          {item.isOnline && (<Circle size={10} fill="#22c55e" color="#22c55e" style={{ position: 'absolute', bottom: 0, right: 0, border: '2px solid #fff', borderRadius: '50%' }} />)}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}><span style={{ fontWeight: '600', fontSize: '0.85rem', color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</span><span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{item.timestamp}</span></div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><p style={{ margin: 0, fontSize: '0.8rem', color: item.unreadCount > 0 ? '#0f172a' : '#64748b', fontWeight: item.unreadCount > 0 ? '600' : '400', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: '4px' }}>{item.lastMessage}</p>{item.unreadCount > 0 && (<span style={{ background: '#22c55e', color: '#ffffff', borderRadius: '10px', minWidth: '18px', height: '18px', padding: '0 5px', fontSize: '0.65rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{item.unreadCount}</span>)}</div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}
        </div>
      )}
      {/* 🚀 UPGRADED: RIGHT-CLICK CONTEXT MENU RE-LINKED TO USE YOUR CUSTOM TOAST ALERTS */}
      {recentChatMenuCoords && createPortal(
        <div onClick={(e) => e.stopPropagation()} style={{ position: 'fixed', top: `${recentChatMenuCoords.y}px`, left: `${recentChatMenuCoords.x}px`, background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.12)', zIndex: 99999999, padding: '4px', minWidth: '160px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
          <button
            onClick={() => {
              // Dismiss right-click options panel overlay immediately
              setRecentChatMenuCoords(null);

              // Spawns your custom toast markup engine instantly without browser confirmation modals
              if (chatProps.setToast) {
                chatProps.setToast({
                  show: true,
                  type: 'error',
                  message: (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', padding: '2px 0' }}>
                      <span style={{ fontSize: '0.86rem', color: '#0f172a', fontWeight: 700 }}>Delete chat history permanently?</span>
                      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => {
                            if (chatProps.triggerDeleteConversation) {
                              chatProps.triggerDeleteConversation(targetActiveConversationId);
                            }
                            chatProps.setToast({ show: false, message: '', type: 'info' });
                          }}
                          style={{ background: 'linear-gradient(135deg, #f43f5e, #e11d48)', color: '#fff', border: 'none', borderRadius: '10px', width: '36px', height: '36px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          <Trash2 size={16} />
                        </button>
                        <button
                          onClick={() => chatProps.setToast({ show: false, message: '', type: 'info' })}
                          style={{ background: '#ffffff', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '10px', width: '36px', height: '36px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  )
                });
              }
            }}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '10px 12px', border: 'none', background: 'transparent', color: '#ef4444', fontSize: '0.82rem', fontWeight: 500, cursor: 'pointer', borderRadius: '8px', textAlign: 'left', transition: 'background 0.2s' }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#fef2f2'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <Trash2 size={14} /> Clear Chat Log
          </button>
        </div>,
        document.body
      )}
    </div>
  );
};
