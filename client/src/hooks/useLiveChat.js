import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import axios from 'axios';
import { useChatMedia } from './useChatMedia';
import { Trash2, X } from 'lucide-react';
import React from 'react';
// 🚀 FIX: Import the hook so it is defined within the active file scope
import { useMessageReply } from './useMessageReply'; 


const REACTION_OPTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];
const activeHostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
const BASE_URL = (activeHostname === 'localhost' || activeHostname === '127.0.0.1') ? 'http://localhost:5000' : `http://${activeHostname}:5000`;

export const useLiveChat = (socket, user) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeView, setActiveView] = useState('chat');
  const [currentRoom, setCurrentRoom] = useState(null);
  const [message, setMessage] = useState('');
  const [chatLog, setChatLog] = useState([]);
  const [typingUser, setTypingUser] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [hoveredMessageId, setHoveredMessageId] = useState(null);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editInput, setEditInput] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' });
  const [activeUsersList, setActiveUsersList] = useState([]);
  const [reactionsMap, setReactionsMap] = useState({});
  const [chatChannels, setChatChannels] = useState([]);
  const [personalContacts, setPersonalContacts] = useState([]);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [activeAudioMemoId, setActivePlayingMemoId] = useState(null);
  const [lightboxState, setLightboxState] = useState({ open: false, url: '', type: 'image' });
  const [conversationsMetadata, setConversationsMetadata] = useState({});

  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedMessageIds, setSelectedMessageIds] = useState(new Set());
  const [isUploading, setIsUploading] = useState(false);

  const messageEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const iceQueueRef = useRef([]);

    // 🚀 THE FIX: Destructure the reply props explicitly so functions like handleSendMessage can read them!
  const replyProps = useMessageReply();
  const { replyingMessage, setReplyingMessage, startReply, cancelReply } = replyProps;

  const currentUsername = user?.username || user?.name || "Anonymous";
  const currentUserId = String(user?._id || user?.id || "guest_user");

  const triggerToast = useCallback((msg, type = 'info') => {
    setToast({ show: true, message: msg, type });
    if (type !== 'error') {
      setTimeout(() => setToast({ show: false, message: '', type: 'info' }), 3000);
    }
  }, []);

  const mediaProps = useChatMedia(socket, currentUsername, triggerToast);
  const { setCallState, setCallType, setRemotePeerDetails, createPeerConnection, getOrCreatePeerConnection, clearCallSessionState, peerConnectionRef, endCallSession } = mediaProps;

  // Request Native OS Desktop Notification Permissions on initial drawer expansion mount
  useEffect(() => {
    if (isOpen && typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        Notification.requestPermission();
      }
    }
  }, [isOpen]);
  // Fetch Directory Contacts & Channels list
  useEffect(() => {
    if (!isOpen) return;
    const fetchWorkspaceDirectory = async () => {
      const activeToken = localStorage.getItem("token");
      const configHeaders = { headers: { Authorization: activeToken ? `Bearer ${activeToken}` : "" } };
      try {
        const usersRes = await axios.get(`${BASE_URL}/chat/users`, configHeaders);
        const dbUsers = Array.isArray(usersRes.data) ? usersRes.data : [];
        setPersonalContacts(dbUsers.filter(u => String(u._id) !== currentUserId).map(u => ({ id: u._id, name: u.firstName && u.lastName ? `${u.firstName} ${u.lastName}` : u.username, desc: u.email, avatar: u.profileImage || u.avatar || null, type: 'peer' })));
      } catch (err) {
        console.error(err);
        setPersonalContacts([]);
      }
      try {
        const groupsRes = await axios.get(`${BASE_URL}/chat/groups`, configHeaders);
        setChatChannels(Array.isArray(groupsRes.data) ? groupsRes.data : []);
      } catch (err) {
        console.error(err);
        setChatChannels([]);
      }
    };
    fetchWorkspaceDirectory();
  }, [isOpen, currentUserId]);

  // Socket Workspace Joining Room Logic
  useEffect(() => {
    if (!socket || !user) return;
    const initialRoom = currentRoom?.id || currentRoom?._id || "global_workspace";
    const join = { room: initialRoom, username: currentUsername, userId: currentUserId, profileImage: user?.profileImage || null };
    if (socket.connected) socket.emit("join_room", join);
    socket.on("connect", () => socket.emit("join_room", join));
    return () => socket.off("connect");
  }, [socket, user, currentUsername, currentUserId, currentRoom]);

  // Conversation history metadata hydration layer
  useEffect(() => {
    if (!isOpen || currentUserId === "guest_user") return;
    const loadConversationsSummary = async () => {
      try {
        const activeToken = localStorage.getItem("token");
        const res = await axios.get(`${BASE_URL}/chat/conversations-summary?userId=${currentUserId}`, { headers: { Authorization: activeToken ? `Bearer ${activeToken}` : "" } });
        setConversationsMetadata(prev => ({ ...prev, ...res.data }));
      } catch (err) {
        console.error("❌ Could not hydrate messenger histories:", err);
      }
    };
    loadConversationsSummary();
  }, [isOpen, currentUserId]);

  // 🚀 FIXED DEDUPLICATOR HISTORY TIMELINE LOGS LOADER
  useEffect(() => {
    if (!isOpen || activeView !== 'chat' || !currentRoom) return;
    let isMounted = true;

    const loadChatHistory = async () => {
      try {
        const activeToken = localStorage.getItem("token");
        const roomId = currentRoom.id || currentRoom._id;
        const res = await axios.get(`${BASE_URL}/chat/history/${roomId}`, { headers: { Authorization: activeToken ? `Bearer ${activeToken}` : "" } });

        if (!isMounted) return;
        const raw = Array.isArray(res.data) ? res.data : [];
        const uniqueMessages = [];
        const seenIds = new Set();

        raw.forEach(m => {
          if (!seenIds.has(m._id)) {
            seenIds.add(m._id);
            uniqueMessages.push({ ...m, readBy: Array.isArray(m.readBy) ? m.readBy : [], deliveredTo: Array.isArray(m.deliveredTo) ? m.deliveredTo : [] });
          }
        });

        setChatLog(uniqueMessages);

        if (socket && currentUserId !== "guest_user") {
          uniqueMessages.forEach(m => {
            const isMine = String(m.senderId || m.senderName) === currentUserId || m.senderName === currentUsername;
            if (!isMine && !m.readBy.some(r => String(r?.userId || r) === currentUserId)) {
              socket.emit("mark_as_read", { messageId: m._id, userId: currentUserId, room: roomId });
            }
          });
        }
      } catch (err) {
        console.error(err);
        if (isMounted) setChatLog([]);
      }
    };

    loadChatHistory();
    return () => { isMounted = false; };
  }, [isOpen, activeView, currentRoom]);
  // Feed Auto-Scroll Trigger Monitoring
  useEffect(() => {
    if (isOpen) setTimeout(() => messageEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  }, [chatLog, isOpen, typingUser]);

  // Core Real-Time WebSocket Listener Layer Engine
  useEffect(() => {
    if (!socket) return;

    socket.off("receive_message");
    socket.off("messages_bulk_deleted");
    socket.off("conversation_history_cleared");

    socket.on("group_channel_added", (newChannel) => setChatChannels(prev => [...prev, newChannel]));

    socket.on("receive_message", (m) => {
      const roomId = currentRoom?.id || currentRoom?._id || "global_workspace";
      const messageRoomId = m.room || roomId;
      const isCurrentlyViewingThisRoom = currentRoom && (String(currentRoom.id) === String(messageRoomId) || String(currentRoom._id) === String(messageRoomId));
      const isMine = String(m.senderId || m.senderName) === currentUserId || m.senderName === currentUsername;
      const isBrowserTabBlurred = typeof document !== 'undefined' && document.hidden;

      // Realtime Audio Chime and Notification Overlay Triggers
      if (!isMine && (!isOpen || !isCurrentlyViewingThisRoom || isBrowserTabBlurred)) {
        try {
          const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
          const oscillator = audioCtx.createOscillator();
          const gainNode = audioCtx.createGain();
          oscillator.type = 'sine';
          oscillator.frequency.setValueAtTime(523.25, audioCtx.currentTime);
          oscillator.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.07);
          gainNode.gain.setValueAtTime(0.12, audioCtx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.25);
          oscillator.connect(gainNode);
          gainNode.connect(audioCtx.destination);
          oscillator.start();
          oscillator.stop(audioCtx.currentTime + 0.25);
        } catch (err) { console.warn(err); }

        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          const summaryText = m.type === 'text' ? m.message : m.type === 'image' ? '📷 Sent an image' : m.type === 'audio' ? '🎵 Sent a voice note' : '📎 Sent an attachment';
          const desktopNotification = new Notification(`New Message from ${m.senderName}`, { body: summaryText, icon: m.senderAvatar || '/favicon.ico', tag: messageRoomId, renotify: true });
          desktopNotification.onclick = function (e) {
            e.preventDefault(); window.focus();
            if (typeof setIsOpen === 'function') setIsOpen(true);
            navigateToRoom({ id: m.room, roomId: m.room, name: m.senderName, type: m.room.includes('_') ? 'peer' : 'group', avatar: m.senderAvatar });
            desktopNotification.close();
          };
        }
      }

      if (isCurrentlyViewingThisRoom) {
        setChatLog(prev => {
          if (prev.some(x => x._id === m._id)) return prev;
          return [...prev, { ...m, readBy: Array.isArray(m.readBy) ? m.readBy : [], deliveredTo: Array.isArray(m.deliveredTo) ? m.deliveredTo : [] }];
        });
        if (!isMine) socket.emit("mark_as_read", { messageId: m._id, userId: currentUserId, room: roomId });
      }

      setConversationsMetadata(prev => {
        const currentMeta = prev[messageRoomId] || { unreadCount: 0 };
        return { ...prev, [messageRoomId]: { lastMessage: m.message || (m.type === 'image' ? '📷 Image' : '📎 Attachment'), timestamp: m.createdAt || new Date(), unreadCount: (!isMine && !isCurrentlyViewingThisRoom) ? (currentMeta.unreadCount + 1) : currentMeta.unreadCount } };
      });
    });

    socket.on("user_typing", ({ username, isTyping }) => setTypingUser(isTyping ? username : ''));
    socket.on("message_read_update", ({ messageId, readBy }) => setChatLog(prev => prev.map(m => m._id === messageId ? { ...m, readBy } : m)));
    socket.on("message_delivered_update", ({ messageId, deliveredTo }) => setChatLog(prev => prev.map(m => m._id === messageId ? { ...m, deliveredTo } : m)));
    socket.on("message_edited", ({ messageId, newMessage }) => { setChatLog(prev => prev.map(m => m._id === messageId ? { ...m, message: newMessage } : m)); triggerToast("Message updated successfully", "success"); });

    socket.on("message_deleted", ({ messageId }) => { setChatLog(prev => prev.filter(m => m._id !== messageId)); triggerToast("Message deleted successfully", "success"); });
    socket.on("room_users_update", (users) => setActiveUsersList(users || []));

    // 🚀 FIXED CONCURRENT-SAFE REACTION SYNCHRONIZER BROADCAST HOOKS
    socket.on("message_reaction_update", ({ messageId, emoji, username }) => {
      setReactionsMap(prev => {
        const curr = prev[messageId] || [], idx = curr.findIndex(r => r.username === username);
        let updated = [...curr];
        if (idx > -1) { if (updated[idx].emoji === emoji) updated = updated.filter(r => r.username !== username); else updated[idx].emoji = emoji; }
        else { updated.push({ emoji, username }); }
        return { ...prev, [messageId]: updated };
      });
      setChatLog(prev => prev.map(m => {
        if (m._id !== messageId) return m;
        let arr = Array.isArray(m.reactions) ? [...m.reactions] : [];
        const i = arr.findIndex(r => r.username === username);
        if (i > -1) { if (arr[i].emoji === emoji) arr = arr.filter(r => r.username !== username); else arr[i] = { ...arr[i], emoji, createdAt: new Date() }; }
        else { arr.push({ emoji, username, createdAt: new Date() }); }
        return { ...m, reactions: arr };
      }));
    });

    // Realtime Multi-Select bulk entries purge response synchronization hooks
    socket.on("messages_bulk_deleted", ({ room, messageIds }) => {
      if (currentRoom && (currentRoom.id === room || currentRoom._id === room)) {
        setChatLog(prev => prev.filter(m => !messageIds.includes(m._id)));
      }
      setIsSelectionMode(false);
      setSelectedMessageIds(new Set());
      triggerToast(`${messageIds.length} messages removed permanently`, "success");
    });

    socket.on("conversation_history_cleared", ({ room }) => {
      if (currentRoom && (currentRoom.id === room || currentRoom._id === room)) setChatLog([]);
      setConversationsMetadata(prev => { const next = { ...prev }; delete next[room]; return next; });
      triggerToast("Conversation history cleared successfully", "success");
    });

    const handleIncomingCall = (payload) => { setIsOpen(true); setActiveView('chat'); setCallType(payload.type || 'video'); setCallState('incoming'); setRemotePeerDetails({ socketId: payload.fromSocketId, name: payload.callerName || "Support Colleague", room: payload.room }); };
    socket.on("incoming_call_signal", handleIncomingCall);
    socket.on("initiate_call_signal", handleIncomingCall);
    socket.on("call_accepted_by_peer", ({ peerSocketId }) => { setRemotePeerDetails(prev => ({ ...prev, socketId: peerSocketId })); createPeerConnection(peerSocketId); });

    // ... rtc signal routing event listeners remain identical ...
    socket.on("receive_rtc_offer", async ({ fromSocketId, offer }) => { try { const pc = getOrCreatePeerConnection(fromSocketId); await pc.setRemoteDescription(new RTCSessionDescription(offer)); const answer = await pc.createAnswer(); await pc.setLocalDescription(answer); socket.emit("send_rtc_answer", { toSocketId: fromSocketId, answer }); while (iceQueueRef.current.length > 0) { await pc.addIceCandidate(new RTCIceCandidate(iceQueueRef.current.shift())).catch(e => console.error(e)); } } catch (err) { endCallSession(); } });
    socket.on("receive_rtc_answer", async ({ answer }) => { try { if (peerConnectionRef.current) { await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer)); while (iceQueueRef.current.length > 0) { await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(iceQueueRef.current.shift())).catch(e => console.error(e)); } } } catch (err) { endCallSession(); } });
    socket.on("receive_ice_candidate", async ({ candidate }) => { if (candidate) { const pc = peerConnectionRef.current; if (pc && pc.remoteDescription && pc.remoteDescription.type) { try { await pc.addIceCandidate(new RTCIceCandidate(candidate)); } catch (e) { } } else { iceQueueRef.current.push(candidate); } } });
    const handleCallTermination = () => { iceQueueRef.current = []; clearCallSessionState(); };
    socket.on("call_terminated_by_peer", handleCallTermination);
    socket.on("end_call_session", handleCallTermination);

    return () => {
      socket.off("receive_message");
      socket.off("messages_bulk_deleted");
      socket.off("conversation_history_cleared");
      socket.off("incoming_call_signal");
      socket.off("initiate_call_signal");
      socket.off("call_accepted_by_peer");
      socket.off("receive_rtc_offer");
      socket.off("receive_rtc_answer");
      socket.off("receive_ice_candidate");
      socket.off("call_terminated_by_peer");
      socket.off("end_call_session");
    };
  }, [socket, isOpen, currentUserId, currentUsername, currentRoom]);
  const navigateToRoom = (roomItem) => {
    let targetRoom = { ...roomItem }, targetRoomId = roomItem.roomId || roomItem.id;
    if (roomItem.type === 'peer') {
      const jointRoomId = [String(currentUserId), String(roomItem.id)].sort().join('_');
      targetRoom = { id: jointRoomId, _id: jointRoomId, name: roomItem.name, type: 'dm', peerId: roomItem.id, avatar: roomItem.avatar || roomItem.profileImage || null };
      targetRoomId = jointRoomId;
    } else {
      targetRoom = { id: targetRoomId, _id: targetRoomId, name: roomItem.name, type: 'group', avatar: roomItem.avatar || roomItem.profileImage || null };
    }
    setConversationsMetadata(prev => ({ ...prev, [targetRoomId]: { ...(prev[targetRoomId] || {}), unreadCount: 0 } }));
    setActiveView('chat');
    setCurrentRoom(targetRoom);
    setChatLog([]);
    setIsSelectionMode(false); // Reset selections automatically on thread switching hooks
    setSelectedMessageIds(new Set());
    if (socket && targetRoomId) { socket.emit("join_room", { room: targetRoomId, username: currentUsername, userId: currentUserId }); }
  };

  const triggerCreateGroup = async (e) => {
    e.preventDefault(); if (!newGroupName.trim()) return;
    try {
      const activeToken = localStorage.getItem("token");
      const payload = { name: newGroupName.trim(), members: [...selectedMembers, currentUserId], createdBy: currentUserId };
      const res = await axios.post(`${BASE_URL}/chat/groups`, payload, { headers: { Authorization: activeToken ? `Bearer ${activeToken}` : "" } });
      setChatChannels(prev => [...prev, res.data]); setNewGroupName(''); setSelectedMembers([]); setShowCreateGroup(false); triggerToast("Group created successfully", "success");
      if (socket) socket.emit("new_group_created", res.data);
    } catch (err) { triggerToast("Error creating group channel", "error"); }
  };

  const toggleMemberSelection = (memberId) => { setSelectedMembers(prev => prev.includes(memberId) ? prev.filter(id => id !== memberId) : [...prev, memberId]); };

  const handleInputChange = (e) => {
    setMessage(e.target.value); if (!socket || !currentRoom) return;
    const roomId = currentRoom.id || currentRoom._id;
    socket.emit("typing", { room: roomId, username: currentUsername, isTyping: true });
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => { socket.emit("typing", { room: roomId, username: currentUsername, isTyping: false }); }, 2000);
  };

  const handleFileChange = (e) => {
    const file = e.target.files && e.target.files[0] ? e.target.files[0] : null; if (!file) return;
    // Standard file size validation paths remain fully unchanged
    if (file.type.startsWith('video/')) {
      if (file.size > 15 * 1024 * 1024) { triggerToast("Video too large! Max is 15MB.", "error"); return; }
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      if (file.type.startsWith('image/')) {
        const img = new Image(); img.src = reader.result;
        img.onload = () => {
          const canvas = document.createElement('canvas'), ctx = canvas.getContext('2d');
          canvas.width = Math.min(img.width, 1000); canvas.height = Math.min(img.height, 1000);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          setSelectedFile({ name: file.name, url: canvas.toDataURL('image/jpeg', 0.7), type: 'image' });
        };
      } else {
        setSelectedFile({ name: file.name, url: reader.result, type: file.type.startsWith('audio/') ? 'audio' : 'file' });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!message.trim() && !selectedFile) return;

    setIsUploading(true);
    const roomId = currentRoom?.id || currentRoom?._id || 'global_workspace';

    socket.emit('send_message', {
      room: roomId,
      senderId: currentUserId,
      senderName: currentUsername,
      senderAvatar: user?.profileImage || user?.avatar || null,
      message: message.trim(),
      type: selectedFile ? selectedFile.type : "text",
      attachment: selectedFile ? selectedFile.url : null,
      attachmentType: selectedFile ? selectedFile.name : null,
      createdAt: new Date(),
      // 🚀 FIX: Swapped out 'chatProps.replyingMessage' to read directly from internal 'replyingMessage' hook state variable references
      replyTo: replyingMessage ? {
        messageId: replyingMessage._id,
        message: replyingMessage.message,
        senderName: replyingMessage.senderName
      } : null
    });

    setMessage('');
    setSelectedFile(null);

    // 🚀 FIX: Swapped out 'chatProps.cancelReply' to run your direct state function trigger cleanly
    if (cancelReply) cancelReply();

    socket.emit("typing", { room: roomId, username: currentUsername, isTyping: false });
    setIsUploading(false);
  };


  const triggerSaveEdit = (messageId) => { const roomId = currentRoom?.id || currentRoom?._id || 'global_workspace'; if (!editInput.trim() || !socket) return; socket.emit("edit_message", { room: roomId, messageId, newMessage: editInput.trim() }); setChatLog(prev => prev.map(m => m._id === messageId ? { ...m, message: editInput.trim() } : m)); setEditingMessageId(null); triggerToast("Message updated successfully", "success"); };
  const triggerDelete = (messageId) => { if (!socket) return; const roomId = currentRoom?.id || currentRoom?._id || 'global_workspace'; triggerToast(<div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', padding: '2px 0' }}><span style={{ fontSize: '0.86rem', color: '#0f172a', fontWeight: 700 }}>Delete message permanently?</span><div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}><button onClick={() => { socket.emit("delete_message", { room: roomId, messageId }); setChatLog(prev => prev.filter(m => m._id !== messageId)); triggerToast("Message deleted successfully", "success"); }} style={{ background: 'linear-gradient(135deg, #f43f5e, #e11d48)', color: '#fff', border: 'none', borderRadius: '10px', width: '36px', height: '36px', cursor: 'pointer' }}><Trash2 size={16} /></button><button onClick={() => setToast({ show: false, message: '', type: 'info' })} style={{ background: '#ffffff', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '10px', width: '36px', height: '36px', cursor: 'pointer' }}><X size={16} /></button></div></div>, "error"); };
  const triggerAddReaction = (messageId, emoji) => { if (!socket) return; const roomId = currentRoom?.id || currentRoom?._id || 'global_workspace'; socket.emit("send_reaction", { room: roomId, messageId, emoji, username: currentUsername }); };
  const triggerDeleteConversation = (roomId) => { if (!socket) return; socket.emit("clear_conversation_history", { room: roomId, userId: currentUserId }); };

  // 🚀 ATOMIC BULK SELECTION ENGINE HANDLERS
  const toggleSelectMessage = useCallback((msgId) => { setSelectedMessageIds(prev => { const next = new Set(prev); if (next.has(msgId)) next.delete(msgId); else next.add(msgId); return next; }); }, []);
  const triggerBulkDelete = useCallback(() => {
    if (!socket || !currentRoom || selectedMessageIds.size === 0) return;
    const roomId = currentRoom.id || currentRoom._id;
    triggerToast(<div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', padding: '2px 0' }}><span style={{ fontSize: '0.86rem', color: '#0f172a', fontWeight: 700 }}>Purge all {selectedMessageIds.size} records permanently?</span><div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}><button onClick={() => { socket.emit("delete_multiple_messages", { room: roomId, messageIds: Array.from(selectedMessageIds) }); setToast({ show: false, message: '', type: 'info' }); }} style={{ background: 'linear-gradient(135deg, #f43f5e, #e11d48)', color: '#fff', border: 'none', borderRadius: '10px', padding: '0 14px', height: '36px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}>Confirm Bulk Clear</button><button onClick={() => setToast({ show: false, message: '', type: 'info' })} style={{ background: '#ffffff', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '10px', width: '56px', height: '36px', cursor: 'pointer', fontSize: '0.75rem' }}>Cancel</button></div></div>, "error");
  }, [socket, currentRoom, selectedMessageIds, triggerToast]);

  const recentChatsList = useMemo(() => { const list = []; personalContacts.forEach(contact => { const jointRoomId = [String(currentUserId), String(contact.id)].sort().join('_'), meta = conversationsMetadata[jointRoomId]; if (meta && (meta.lastMessage || meta.timestamp)) { list.push({ id: contact.id, roomId: jointRoomId, name: contact.name, avatar: contact.avatar || contact.profileImage || null, type: 'peer', isOnline: activeUsersList.some(u => String(u.userId) === String(contact.id)), lastMessage: meta.lastMessage, unreadCount: meta.unreadCount || 0, timestamp: meta.timestamp ? new Date(meta.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '', rawTime: meta.timestamp ? new Date(meta.timestamp).getTime() : 0 }); } }); chatChannels.forEach(channel => { const roomId = channel._id || channel.id, meta = conversationsMetadata[roomId]; if (meta && (meta.lastMessage || meta.timestamp)) { list.push({ id: roomId, roomId: roomId, name: channel.name, avatar: channel.avatar || channel.profileImage || null, type: 'group', isOnline: false, lastMessage: meta.lastMessage, unreadCount: meta.unreadCount || 0, timestamp: meta.timestamp ? new Date(meta.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '', rawTime: meta.timestamp ? new Date(meta.timestamp).getTime() : 0 }); } }); return list.sort((a, b) => b.rawTime - a.rawTime); }, [personalContacts, chatChannels, conversationsMetadata, activeUsersList, currentUserId]);

  return {
    socket,
    isOpen,
    setIsOpen,
    activeView,
    setActiveView,
    currentRoom,
    setCurrentRoom,
    chatChannels,
    personalContacts,
    message,
    setMessage,
    chatLog,
    typingUser,
    showEmojiPicker,
    setShowEmojiPicker,
    selectedFile,
    setSelectedFile,
    hoveredMessageId,
    setHoveredMessageId,
    editingMessageId,
    setEditingMessageId,
    editInput,
    setEditInput,
    toast,
    setToast,
    activeUsersList,
    reactionsMap,
    REACTION_OPTIONS,
    messageEndRef,
    showCreateGroup,
    setShowCreateGroup,
    newGroupName,
    setNewGroupName,
    selectedMembers,
    navigateToRoom,
    handleInputChange,
    handleFileChange,
    handleSendMessage,
    triggerSaveEdit,
    triggerDelete,
    triggerAddReaction,
    triggerCreateGroup,
    lightboxState,
    setLightboxState,
    activeAudioMemoId,
    setActivePlayingMemoId,
    toggleMemberSelection,
    recentChatsList,
    conversationsMetadata,
    setConversationsMetadata,
    isSelectionMode,
    setIsSelectionMode,
    selectedMessageIds,
    setSelectedMessageIds,
    toggleSelectMessage,
    triggerBulkDelete,
    triggerDeleteConversation,
    isUploading,
    ...mediaProps
  };
};
