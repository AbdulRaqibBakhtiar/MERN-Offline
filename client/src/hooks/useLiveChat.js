import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import axios from 'axios';
import React from 'react';
import { useChatMedia } from './useChatMedia';
import { useMessageReply } from './useMessageReply';
import { API_BASE_URL } from '../api/config';

const REACTION_OPTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

const BASE_URL = API_BASE_URL;

export const useLiveChat = (socket, user) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeView, setActiveView] = useState('chat');
  const [currentRoom, setCurrentRoom] = useState(null);
  const [message, setMessage] = useState('');
  const [chatLog, setChatLog] = useState([]);
  const [typingUser, setTypingUser] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [hoveredMessageId, setHoveredMessageId] = useState(null);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editInput, setEditInput] = useState('');
  const [toast, setToast] = useState({
    show: false,
    message: '',
    type: 'info'
  });
  const [activeUsersList, setActiveUsersList] = useState([]);
  const [reactionsMap, setReactionsMap] = useState({});
  const [chatChannels, setChatChannels] = useState([]);
  const [personalContacts, setPersonalContacts] = useState([]);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [activeAudioMemoId, setActivePlayingMemoId] = useState(null);
  const [lightboxState, setLightboxState] = useState({
    open: false,
    url: '',
    type: 'image'
  });
  const [conversationsMetadata, setConversationsMetadata] = useState({});
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedMessageIds, setSelectedMessageIds] = useState(new Set());
  const [isUploading, setIsUploading] = useState(false);

  const messageEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const iceQueueRef = useRef([]);

  const replyProps = useMessageReply();

  const {
    replyingMessage,
    setReplyingMessage,
    startReply,
    cancelReply
  } = replyProps;

  const currentUsername =
    user?.username ||
    user?.name ||
    'Anonymous';

  const currentUserId = String(
    user?._id ||
    user?.id ||
    'guest_user'
  );

  const triggerToast = useCallback((msg, type = 'info') => {
    setToast({
      show: true,
      message: msg,
      type
    });

    if (type !== 'error') {
      setTimeout(() => {
        setToast({
          show: false,
          message: '',
          type: 'info'
        });
      }, 3000);
    }
  }, []);

  const mediaProps = useChatMedia(
    socket,
    currentUsername,
    triggerToast
  );

  /*
   * IMPORTANT:
   * callType was missing from this destructuring.
   * receive_rtc_offer uses it to determine whether
   * the peer connection should receive video.
   */
  const {
    setCallState,
    setCallType,
    callType,
    setRemotePeerDetails,
    createPeerConnection,
    getOrCreatePeerConnection,
    clearCallSessionState,
    peerConnectionRef,
    peerConnectionsRef,
    setCallParticipants,
    setRemoteStreams,
    setIsConferenceCall,
    endCallSession
  } = mediaProps;

  useEffect(() => {
    if (
      isOpen &&
      typeof window !== 'undefined' &&
      'Notification' in window
    ) {
      if (
        Notification.permission !== 'granted' &&
        Notification.permission !== 'denied'
      ) {
        Notification.requestPermission();
      }
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const fetchWorkspaceDirectory = async () => {
      const activeToken = localStorage.getItem('token');

      const configHeaders = {
        headers: {
          Authorization: activeToken
            ? `Bearer ${activeToken}`
            : ''
        }
      };

      try {
        const usersRes = await axios.get(
          `${BASE_URL}/chat/users`,
          configHeaders
        );

        const dbUsers = Array.isArray(usersRes.data)
          ? usersRes.data
          : [];

        setPersonalContacts(
          dbUsers
            .filter(
              u => String(u._id) !== currentUserId
            )
            .map(u => ({
              id: u._id,
              name:
                u.firstName && u.lastName
                  ? `${u.firstName} ${u.lastName}`
                  : u.username,
              desc: u.email,
              avatar:
                u.profileImage ||
                u.avatar ||
                null,
              type: 'peer'
            }))
        );
      } catch (err) {
        console.error(err);
        setPersonalContacts([]);
      }

      try {
        const groupsRes = await axios.get(
          `${BASE_URL}/chat/groups`,
          configHeaders
        );

        setChatChannels(
          Array.isArray(groupsRes.data)
            ? groupsRes.data
            : []
        );
      } catch (err) {
        console.error(err);
        setChatChannels([]);
      }
    };

    fetchWorkspaceDirectory();
  }, [isOpen, currentUserId]);

  useEffect(() => {
    if (!socket || !user) return;

    const initialRoom =
      currentRoom?.id ||
      currentRoom?._id ||
      'global_workspace';

    const join = {
      room: initialRoom,
      username: currentUsername,
      userId: currentUserId,
      profileImage: user?.profileImage || null
    };

    const joinRoom = () => {
      socket.emit('join_room', join);
    };

    if (socket.connected) {
      joinRoom();
    }

    socket.on('connect', joinRoom);

    return () => {
      socket.off('connect', joinRoom);
    };
  }, [
    socket,
    user,
    currentUsername,
    currentUserId,
    currentRoom
  ]);

  useEffect(() => {
    if (
      !isOpen ||
      currentUserId === 'guest_user'
    ) {
      return;
    }

    const loadConversationsSummary = async () => {
      try {
        const activeToken =
          localStorage.getItem('token');

        const res = await axios.get(
          `${BASE_URL}/chat/conversations-summary?userId=${currentUserId}`,
          {
            headers: {
              Authorization: activeToken
                ? `Bearer ${activeToken}`
                : ''
            }
          }
        );

        setConversationsMetadata(prev => ({
          ...prev,
          ...res.data
        }));
      } catch (err) {
        console.error(
          '❌ messenger histories fail:',
          err
        );
      }
    };

    loadConversationsSummary();
  }, [isOpen, currentUserId]);

  useEffect(() => {
    if (
      !isOpen ||
      activeView !== 'chat' ||
      !currentRoom
    ) {
      return;
    }

    let isMounted = true;

    const loadChatHistory = async () => {
      try {
        const activeToken =
          localStorage.getItem('token');

        const roomId =
          currentRoom.id ||
          currentRoom._id;

        const res = await axios.get(
          `${BASE_URL}/chat/history/${roomId}`,
          {
            headers: {
              Authorization: activeToken
                ? `Bearer ${activeToken}`
                : ''
            }
          }
        );

        if (!isMounted) return;

        const raw = Array.isArray(res.data)
          ? res.data
          : [];

        const uniqueMessages = [];
        const seenIds = new Set();

        raw.forEach(m => {
          if (!seenIds.has(m._id)) {
            seenIds.add(m._id);

            uniqueMessages.push({
              ...m,
              readBy: Array.isArray(m.readBy)
                ? m.readBy
                : [],
              deliveredTo: Array.isArray(
                m.deliveredTo
              )
                ? m.deliveredTo
                : []
            });
          }
        });

        setChatLog(uniqueMessages);

        if (
          socket &&
          currentUserId !== 'guest_user'
        ) {
          uniqueMessages.forEach(m => {
            const isMine =
              String(
                m.senderId ||
                m.senderName
              ) === currentUserId ||
              m.senderName ===
              currentUsername;

            if (
              !isMine &&
              !m.readBy.some(
                r =>
                  String(
                    r?.userId || r
                  ) === currentUserId
              )
            ) {
              socket.emit(
                'mark_as_read',
                {
                  messageId: m._id,
                  userId: currentUserId,
                  room: roomId
                }
              );
            }
          });
        }
      } catch (err) {
        console.error(err);

        if (isMounted) {
          setChatLog([]);
        }
      }
    };

    loadChatHistory();

    return () => {
      isMounted = false;
    };
  }, [
    isOpen,
    activeView,
    currentRoom,
    socket,
    currentUserId,
    currentUsername
  ]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        messageEndRef.current?.scrollIntoView({
          behavior: 'smooth'
        });
      }, 100);
    }
  }, [chatLog, isOpen, typingUser]);

  useEffect(() => {
    if (!socket) return;

    const handleGroupChannelAdded = newChannel => {
      setChatChannels(prev => [
        ...prev,
        newChannel
      ]);
    };

    const handleReceiveMessage = m => {
      const roomId =
        currentRoom?.id ||
        currentRoom?._id ||
        'global_workspace';

      const messageRoomId =
        m.room || roomId;

      const isCurrentlyViewingThisRoom =
        currentRoom &&
        (
          String(currentRoom.id) ===
          String(messageRoomId) ||
          String(currentRoom._id) ===
          String(messageRoomId)
        );

      const isMine =
        String(
          m.senderId ||
          m.senderName
        ) === currentUserId ||
        m.senderName ===
        currentUsername;

      const isBrowserTabBlurred =
        typeof document !== 'undefined' &&
        document.hidden;

      if (
        !isMine &&
        (
          !isOpen ||
          !isCurrentlyViewingThisRoom ||
          isBrowserTabBlurred
        )
      ) {
        try {
          const AudioContext =
            window.AudioContext ||
            window.webkitAudioContext;

          const audioCtx =
            new AudioContext();

          const oscillator =
            audioCtx.createOscillator();

          const gainNode =
            audioCtx.createGain();

          oscillator.type = 'sine';

          oscillator.frequency.setValueAtTime(
            523.25,
            audioCtx.currentTime
          );

          oscillator.frequency.setValueAtTime(
            783.99,
            audioCtx.currentTime + 0.07
          );

          gainNode.gain.setValueAtTime(
            0.12,
            audioCtx.currentTime
          );

          gainNode.gain.exponentialRampToValueAtTime(
            0.0001,
            audioCtx.currentTime + 0.25
          );

          oscillator.connect(gainNode);
          gainNode.connect(audioCtx.destination);

          oscillator.start();
          oscillator.stop(
            audioCtx.currentTime + 0.25
          );
        } catch (err) {
          console.warn(err);
        }

        if (
          typeof window !== 'undefined' &&
          'Notification' in window &&
          Notification.permission === 'granted'
        ) {
          const summaryText =
            m.type === 'text'
              ? m.message
              : m.type === 'image'
                ? '📷 Sent an image'
                : m.type === 'audio'
                  ? '🎵 Sent a voice note'
                  : '📎 Sent an attachment';

          const desktopNotification =
            new Notification(
              `New Message from ${m.senderName}`,
              {
                body: summaryText,
                icon:
                  m.senderAvatar ||
                  '/favicon.ico',
                tag: messageRoomId,
                renotify: true
              }
            );

          desktopNotification.onclick =
            e => {
              e.preventDefault();

              window.focus();
              setIsOpen(true);

              navigateToRoomRef.current({
                id: m.room,
                roomId: m.room,
                name: m.senderName,
                type:
                  m.room &&
                    m.room.includes('_')
                    ? 'peer'
                    : 'group',
                avatar:
                  m.senderAvatar
              });

              desktopNotification.close();
            };
        }
      }

      if (isCurrentlyViewingThisRoom) {
        setChatLog(prev => {
          if (
            prev.some(
              x => x._id === m._id
            )
          ) {
            return prev;
          }

          return [
            ...prev,
            {
              ...m,
              readBy: Array.isArray(
                m.readBy
              )
                ? m.readBy
                : [],
              deliveredTo:
                Array.isArray(
                  m.deliveredTo
                )
                  ? m.deliveredTo
                  : []
            }
          ];
        });

        if (!isMine) {
          socket.emit(
            'mark_as_read',
            {
              messageId: m._id,
              userId: currentUserId,
              room: roomId
            }
          );
        }
      }

      setConversationsMetadata(
        prev => {
          const currentMeta =
            prev[messageRoomId] || {
              unreadCount: 0
            };

          return {
            ...prev,
            [messageRoomId]: {
              lastMessage:
                m.message ||
                (
                  m.type === 'image'
                    ? '📷 Image'
                    : '📎 Attachment'
                ),
              timestamp:
                m.createdAt ||
                new Date(),
              unreadCount:
                !isMine &&
                  !isCurrentlyViewingThisRoom
                  ? currentMeta.unreadCount + 1
                  : currentMeta.unreadCount
            }
          };
        }
      );
    };

    const handleUserTyping = ({
      username,
      isTyping
    }) => {
      setTypingUser(
        isTyping ? username : ''
      );
    };

    const handleMessageReadUpdate = ({
      messageId,
      readBy
    }) => {
      setChatLog(prev =>
        prev.map(m =>
          m._id === messageId
            ? { ...m, readBy }
            : m
        )
      );
    };

    const handleMessageDeliveredUpdate = ({
      messageId,
      deliveredTo
    }) => {
      setChatLog(prev =>
        prev.map(m =>
          m._id === messageId
            ? { ...m, deliveredTo }
            : m
        )
      );
    };

    const handleMessageEdited = ({
      messageId,
      newMessage
    }) => {
      setChatLog(prev =>
        prev.map(m =>
          m._id === messageId
            ? {
              ...m,
              message: newMessage
            }
            : m
        )
      );

      triggerToast(
        'Message updated successfully',
        'success'
      );
    };

    const handleMessageDeleted = ({
      messageId
    }) => {
      setChatLog(prev =>
        prev.filter(
          m => m._id !== messageId
        )
      );

      triggerToast(
        'Message deleted successfully',
        'success'
      );
    };

    const handleRoomUsersUpdate = users => {
      setActiveUsersList(users || []);
    };

    const handleReactionUpdate = ({
      messageId,
      emoji,
      username
    }) => {
      setReactionsMap(prev => {
        const curr =
          prev[messageId] || [];

        const idx = curr.findIndex(
          r => r.username === username
        );

        let updated = [...curr];

        if (idx > -1) {
          if (
            updated[idx].emoji === emoji
          ) {
            updated =
              updated.filter(
                r =>
                  r.username !==
                  username
              );
          } else {
            updated[idx] = {
              ...updated[idx],
              emoji
            };
          }
        } else {
          updated.push({
            emoji,
            username
          });
        }

        return {
          ...prev,
          [messageId]: updated
        };
      });

      setChatLog(prev =>
        prev.map(m => {
          if (m._id !== messageId) {
            return m;
          }

          let arr =
            Array.isArray(m.reactions)
              ? [...m.reactions]
              : [];

          const i = arr.findIndex(
            r =>
              r.username ===
              username
          );

          if (i > -1) {
            if (
              arr[i].emoji === emoji
            ) {
              arr = arr.filter(
                r =>
                  r.username !==
                  username
              );
            } else {
              arr[i] = {
                ...arr[i],
                emoji,
                createdAt: new Date()
              };
            }
          } else {
            arr.push({
              emoji,
              username,
              createdAt: new Date()
            });
          }

          return {
            ...m,
            reactions: arr
          };
        })
      );
    };

    const handleBulkDeleted = ({
      room,
      messageIds
    }) => {
      if (
        currentRoom &&
        (
          currentRoom.id === room ||
          currentRoom._id === room
        )
      ) {
        setChatLog(prev =>
          prev.filter(
            m =>
              !messageIds.includes(
                m._id
              )
          )
        );
      }

      setIsSelectionMode(false);
      setSelectedMessageIds(
        new Set()
      );

      triggerToast(
        `${messageIds.length} messages removed permanently`,
        'success'
      );
    };

    const handleConversationHistoryCleared = ({
      room
    }) => {
      if (
        currentRoom &&
        (
          currentRoom.id === room ||
          currentRoom._id === room
        )
      ) {
        setChatLog([]);
      }

      setConversationsMetadata(
        prev => {
          const next = {
            ...prev
          };

          delete next[room];

          return next;
        }
      );

      triggerToast(
        'Conversation history cleared successfully',
        'success'
      );
    };

    /*
     * CALL SIGNALING
     */
    const handleIncomingCall = payload => {
      setIsOpen(true);
      setActiveView('chat');

      setCallType(
        payload.type || 'video'
      );

      setIsConferenceCall(Boolean(payload.isConference));
      setCallParticipants([{
        socketId: payload.fromSocketId,
        userId: payload.callerUserId,
        name: payload.callerName || 'Bazzar contact',
        profileImage: payload.profileImage || null,
        state: 'joined'
      }]);
      setRemoteStreams([]);

      setCallState('incoming');

      setRemotePeerDetails({
        socketId:
          payload.fromSocketId,
        name:
          payload.callerName ||
          'Support Colleague',
        profileImage: payload.profileImage || null,
        room: payload.room
      });
    };

    const handleCallAccepted = ({
      peerSocketId
    }) => {
      setRemotePeerDetails(prev => ({
        ...prev,
        socketId: peerSocketId
      }));

      createPeerConnection(
        peerSocketId
      );
    };

    const handleCallRoomJoined = ({ participants = [], isConference = false } = {}) => {
      setCallState('connecting');
      setIsConferenceCall(isConference);
      setCallParticipants(participants.map(peer => ({ ...peer, state: 'joined' })));
    };

    const handleCallParticipantJoined = ({ participant } = {}) => {
      if (!participant?.socketId) return;
      setCallParticipants(previous => previous.some(peer => peer.socketId === participant.socketId)
        ? previous.map(peer => peer.socketId === participant.socketId ? { ...participant, state: 'joined' } : peer)
        : [...previous.filter(peer => peer.userId !== participant.userId), { ...participant, state: 'joined' }]);
      createPeerConnection(participant.socketId);
    };

    const handleCallParticipantLeft = ({ socketId } = {}) => {
      setCallParticipants(previous => previous.filter(peer => peer.socketId !== socketId));
      setRemoteStreams(previous => previous.filter(peer => peer.socketId !== socketId));
    };

    const handleCallInvitationDeclined = ({ participant } = {}) => {
      setCallParticipants(previous => previous.map(peer => peer.userId === participant?.userId ? { ...peer, state: 'declined' } : peer));
      triggerToast(`${participant?.name || 'A participant'} declined the call.`, 'info');
    };

    const handleCallUnavailable = ({ reason } = {}) => {
      clearCallSessionState();
      triggerToast(reason || 'The other person is unavailable for a call right now.', 'error');
    };

    /*
     * WEBRTC OFFER
     *
     * FIX:
     * callType now comes directly from mediaProps.
     */
    const handleReceiveRtcOffer = async ({
      fromSocketId,
      fromPeer,
      offer
    }) => {
      try {
        console.log(
          '[WebRTC] RECEIVED OFFER',
          offer
        );

        const pc =
          getOrCreatePeerConnection(
            fromSocketId
          );

        if (fromPeer) {
          setCallParticipants(previous => previous.some(peer => peer.socketId === fromSocketId)
            ? previous.map(peer => peer.socketId === fromSocketId ? { ...fromPeer, state: 'joined' } : peer)
            : [...previous, { ...fromPeer, state: 'joined' }]);
        }

        await pc.setRemoteDescription(
          new RTCSessionDescription(
            offer
          )
        );

        console.log(
          '[WebRTC] Remote description set'
        );

        const answer =
          await pc.createAnswer({
            offerToReceiveAudio: true,
            offerToReceiveVideo:
              callType === 'video'
          });

        await pc.setLocalDescription(
          answer
        );

        socket.emit(
          'send_rtc_answer',
          {
            toSocketId:
              fromSocketId,
            answer:
              pc.localDescription.toJSON()
          }
        );

        console.log(
          '[WebRTC] ANSWER SENT'
        );

        const queuedCandidates = iceQueueRef.current.filter(item => item.fromSocketId === fromSocketId);
        iceQueueRef.current = iceQueueRef.current.filter(item => item.fromSocketId !== fromSocketId);
        for (const queued of queuedCandidates) {
          const candidate = queued.candidate;

          try {
            await pc.addIceCandidate(
              new RTCIceCandidate(
                candidate
              )
            );
          } catch (err) {
            console.warn(
              '[WebRTC] Queued ICE failed:',
              err
            );
          }
        }
      } catch (err) {
        console.error(
          '[WebRTC] Offer handling failed:',
          err
        );

        endCallSession('failed');
      }
    };

    /*
     * WEBRTC ANSWER
     */
    const handleReceiveRtcAnswer =
      async ({ answer, fromSocketId }) => {
        try {
          const pc = peerConnectionsRef?.current?.get?.(fromSocketId) || peerConnectionRef?.current;

          if (!pc) {
            console.warn(
              '[WebRTC] Answer received but no peer connection exists'
            );

            return;
          }

          console.log(
            '[WebRTC] RECEIVED ANSWER'
          );

          await pc.setRemoteDescription(
            new RTCSessionDescription(
              answer
            )
          );

          console.log(
            '[WebRTC] Caller remote description set'
          );

          const queuedCandidates = iceQueueRef.current.filter(item => item.fromSocketId === fromSocketId);
          iceQueueRef.current = iceQueueRef.current.filter(item => item.fromSocketId !== fromSocketId);
          for (const queued of queuedCandidates) {
            const candidate = queued.candidate;

            try {
              await pc.addIceCandidate(
                new RTCIceCandidate(
                  candidate
                )
              );
            } catch (err) {
              console.warn(
                '[WebRTC] Queued ICE failed:',
                err
              );
            }
          }
        } catch (err) {
          console.error(
            '[WebRTC] Answer handling failed:',
            err
          );

          endCallSession('failed');
        }
      };

    /*
     * ICE CANDIDATES
     */
    const handleReceiveIceCandidate =
      async ({ candidate, fromSocketId }) => {
        if (!candidate) return;

        const pc = peerConnectionsRef?.current?.get?.(fromSocketId) || peerConnectionRef?.current;

        if (
          pc &&
          pc.remoteDescription &&
          pc.remoteDescription.type
        ) {
          try {
            await pc.addIceCandidate(
              new RTCIceCandidate(
                candidate
              )
            );
          } catch (err) {
            console.warn(
              '[WebRTC] ICE candidate failed:',
              err
            );
          }
        } else {
          iceQueueRef.current.push({ fromSocketId, candidate });
        }
      };

    const handleCallTermination = () => {
      iceQueueRef.current = [];
      clearCallSessionState();
    };

    socket.on(
      'group_channel_added',
      handleGroupChannelAdded
    );

    socket.on(
      'receive_message',
      handleReceiveMessage
    );

    socket.on(
      'user_typing',
      handleUserTyping
    );

    socket.on(
      'message_read_update',
      handleMessageReadUpdate
    );

    socket.on(
      'message_delivered_update',
      handleMessageDeliveredUpdate
    );

    socket.on(
      'message_edited',
      handleMessageEdited
    );

    socket.on(
      'message_deleted',
      handleMessageDeleted
    );

    socket.on(
      'room_users_update',
      handleRoomUsersUpdate
    );

    socket.on(
      'message_reaction_update',
      handleReactionUpdate
    );

    socket.on(
      'messages_bulk_deleted',
      handleBulkDeleted
    );

    socket.on(
      'conversation_history_cleared',
      handleConversationHistoryCleared
    );

    socket.on(
      'incoming_call_signal',
      handleIncomingCall
    );

    socket.on(
      'initiate_call_signal',
      handleIncomingCall
    );

    socket.on(
      'call_accepted_by_peer',
      handleCallAccepted
    );

    socket.on('call_room_joined', handleCallRoomJoined);
    socket.on('call_participant_joined', handleCallParticipantJoined);
    socket.on('call_participant_left', handleCallParticipantLeft);
    socket.on('call_invitation_declined', handleCallInvitationDeclined);

    socket.on(
      'call_unavailable',
      handleCallUnavailable
    );

    socket.on(
      'receive_rtc_offer',
      handleReceiveRtcOffer
    );

    socket.on(
      'receive_rtc_answer',
      handleReceiveRtcAnswer
    );

    socket.on(
      'receive_ice_candidate',
      handleReceiveIceCandidate
    );

    socket.on(
      'call_terminated_by_peer',
      handleCallTermination
    );

    socket.on(
      'end_call_session',
      handleCallTermination
    );

    return () => {
      socket.off(
        'group_channel_added',
        handleGroupChannelAdded
      );

      socket.off(
        'receive_message',
        handleReceiveMessage
      );

      socket.off(
        'user_typing',
        handleUserTyping
      );

      socket.off(
        'message_read_update',
        handleMessageReadUpdate
      );

      socket.off(
        'message_delivered_update',
        handleMessageDeliveredUpdate
      );

      socket.off(
        'message_edited',
        handleMessageEdited
      );

      socket.off(
        'message_deleted',
        handleMessageDeleted
      );

      socket.off(
        'room_users_update',
        handleRoomUsersUpdate
      );

      socket.off(
        'message_reaction_update',
        handleReactionUpdate
      );

      socket.off(
        'messages_bulk_deleted',
        handleBulkDeleted
      );

      socket.off(
        'conversation_history_cleared',
        handleConversationHistoryCleared
      );

      socket.off(
        'incoming_call_signal',
        handleIncomingCall
      );

      socket.off(
        'initiate_call_signal',
        handleIncomingCall
      );

      socket.off(
        'call_accepted_by_peer',
        handleCallAccepted
      );

      socket.off('call_room_joined', handleCallRoomJoined);
      socket.off('call_participant_joined', handleCallParticipantJoined);
      socket.off('call_participant_left', handleCallParticipantLeft);
      socket.off('call_invitation_declined', handleCallInvitationDeclined);

      socket.off(
        'call_unavailable',
        handleCallUnavailable
      );

      socket.off(
        'receive_rtc_offer',
        handleReceiveRtcOffer
      );

      socket.off(
        'receive_rtc_answer',
        handleReceiveRtcAnswer
      );

      socket.off(
        'receive_ice_candidate',
        handleReceiveIceCandidate
      );

      socket.off(
        'call_terminated_by_peer',
        handleCallTermination
      );

      socket.off(
        'end_call_session',
        handleCallTermination
      );
    };
  }, [
    socket,
    isOpen,
    currentUserId,
    currentUsername,
    currentRoom,
    callType,
    setCallState,
    setCallType,
    setRemotePeerDetails,
    createPeerConnection,
    getOrCreatePeerConnection,
    clearCallSessionState,
    peerConnectionRef,
    peerConnectionsRef,
    setCallParticipants,
    setRemoteStreams,
    setIsConferenceCall,
    endCallSession,
    triggerToast
  ]);

  const navigateToRoom = useCallback(
    roomItem => {
      let targetRoom = {
        ...roomItem
      };

      let targetRoomId =
        roomItem.roomId ||
        roomItem.id;

      if (roomItem.type === 'peer') {
        const jointRoomId = [
          String(currentUserId),
          String(roomItem.id)
        ]
          .sort()
          .join('_');

        targetRoom = {
          id: jointRoomId,
          _id: jointRoomId,
          name: roomItem.name,
          type: 'dm',
          peerId: roomItem.id,
          avatar:
            roomItem.avatar ||
            roomItem.profileImage ||
            null
        };

        targetRoomId =
          jointRoomId;
      } else {
        targetRoom = {
          id: targetRoomId,
          _id: targetRoomId,
          name: roomItem.name,
          type: 'group',
          avatar:
            roomItem.avatar ||
            roomItem.profileImage ||
            null
        };
      }

      setConversationsMetadata(
        prev => ({
          ...prev,
          [targetRoomId]: {
            ...(prev[targetRoomId] ||
              {}),
            unreadCount: 0
          }
        })
      );

      setActiveView('chat');
      setCurrentRoom(targetRoom);
      setChatLog([]);
      setIsSelectionMode(false);
      setSelectedMessageIds(
        new Set()
      );

      if (
        socket &&
        targetRoomId
      ) {
        socket.emit(
          'join_room',
          {
            room: targetRoomId,
            username:
              currentUsername,
            userId:
              currentUserId
          }
        );
      }
    },
    [
      socket,
      currentUserId,
      currentUsername
    ]
  );

  const navigateToRoomRef = useRef(navigateToRoom);
  navigateToRoomRef.current = navigateToRoom;

  const triggerCreateGroup = async e => {
    e.preventDefault();

    if (!newGroupName.trim()) {
      return;
    }

    try {
      const activeToken =
        localStorage.getItem('token');

      const payload = {
        name:
          newGroupName.trim(),
        members: [
          ...selectedMembers,
          currentUserId
        ],
        createdBy:
          currentUserId
      };

      const res =
        await axios.post(
          `${BASE_URL}/chat/groups`,
          payload,
          {
            headers: {
              Authorization:
                activeToken
                  ? `Bearer ${activeToken}`
                  : ''
            }
          }
        );

      setChatChannels(prev => [
        ...prev,
        res.data
      ]);

      setNewGroupName('');
      setSelectedMembers([]);
      setShowCreateGroup(false);

      triggerToast(
        'Group created successfully',
        'success'
      );

      if (socket) {
        socket.emit(
          'new_group_created',
          res.data
        );
      }
    } catch (err) {
      console.error(err);

      triggerToast(
        'Error creating group channel',
        'error'
      );
    }
  };

  const toggleMemberSelection =
    memberId => {
      setSelectedMembers(prev =>
        prev.includes(memberId)
          ? prev.filter(
            id => id !== memberId
          )
          : [
            ...prev,
            memberId
          ]
      );
    };

  const handleInputChange = e => {
    setMessage(e.target.value);

    if (!socket || !currentRoom) {
      return;
    }

    const roomId =
      currentRoom.id ||
      currentRoom._id;

    socket.emit('typing', {
      room: roomId,
      username: currentUsername,
      isTyping: true
    });

    clearTimeout(
      typingTimeoutRef.current
    );

    typingTimeoutRef.current =
      setTimeout(() => {
        socket.emit(
          'typing',
          {
            room: roomId,
            username:
              currentUsername,
            isTyping: false
          }
        );
      }, 2000);
  };

  const handleFileChange = e => {
    const files = Array.from(
      e.target.files || []
    );

    if (!files.length) {
      return;
    }

    const processFiles = async () => {
      const processed = [];

      for (const file of files) {
        if (
          file.type.startsWith(
            'video/'
          ) &&
          file.size >
          15 * 1024 * 1024
        ) {
          triggerToast(
            `${file.name} is too large. Maximum video size is 15MB.`,
            'error'
          );

          continue;
        }

        try {
          const dataUrl =
            await new Promise(
              (
                resolve,
                reject
              ) => {
                const reader =
                  new FileReader();

                reader.onloadend =
                  () => {
                    if (
                      typeof reader.result ===
                      'string'
                    ) {
                      resolve(
                        reader.result
                      );
                    } else {
                      reject(
                        new Error(
                          'Failed to read file'
                        )
                      );
                    }
                  };

                reader.onerror =
                  () =>
                    reject(
                      reader.error
                    );

                reader.readAsDataURL(
                  file
                );
              }
            );

          let type = 'file';

          if (
            file.type.startsWith(
              'image/'
            )
          ) {
            type = 'image';
          } else if (
            file.type.startsWith(
              'video/'
            )
          ) {
            type = 'video';
          } else if (
            file.type.startsWith(
              'audio/'
            )
          ) {
            type = 'audio';
          }

          processed.push({
            name: file.name,
            type,
            mimeType:
              file.type,
            size: file.size,
            url: dataUrl,
            rawFile: file
          });
        } catch (err) {
          console.error(
            'Failed to process:',
            file.name,
            err
          );

          triggerToast(
            `Failed to load ${file.name}`,
            'error'
          );
        }
      }

      if (processed.length) {
        setSelectedFiles(
          prev => [
            ...prev,
            ...processed
          ]
        );
      }
    };

    processFiles();

    e.target.value = '';
  };

  const handleSendMessage =
    async e => {
      e.preventDefault();

      if (
        !message.trim() &&
        selectedFiles.length === 0
      ) {
        return;
      }

      if (!socket) {
        return;
      }

      setIsUploading(true);

      const roomId =
        currentRoom?.id ||
        currentRoom?._id ||
        'global_workspace';

      try {
        if (
          selectedFiles.length === 0
        ) {
          socket.emit(
            'send_message',
            {
              room: roomId,

              senderId:
                currentUserId,

              senderName:
                currentUsername,

              senderAvatar:
                user?.profileImage ||
                user?.avatar ||
                null,

              message:
                message.trim(),

              type: 'text',

              attachment: null,

              attachmentType:
                null,

              createdAt:
                new Date(),

              replyTo:
                replyingMessage
                  ? {
                    messageId:
                      replyingMessage._id,
                    message:
                      replyingMessage.message,
                    senderName:
                      replyingMessage.senderName,
                    type:
                      replyingMessage.type,
                    attachmentType:
                      replyingMessage.attachmentType
                  }
                  : null
            }
          );
        } else {
          const mediaGroupId =
            selectedFiles.length >
              1
              ? `${currentUserId}-${Date.now()}-${Math.random()
                .toString(36)
                .slice(2, 8)}`
              : null;

          for (
            let i = 0;
            i < selectedFiles.length;
            i++
          ) {
            const file =
              selectedFiles[i];

            let attachmentUrl =
              file.url;

            if (
              file.rawFile instanceof
              Blob
            ) {
              attachmentUrl =
                await new Promise(
                  (
                    resolve,
                    reject
                  ) => {
                    const reader =
                      new FileReader();

                    reader.onloadend =
                      () => {
                        if (
                          typeof reader.result ===
                          'string'
                        ) {
                          resolve(
                            reader.result
                          );
                        } else {
                          reject(
                            new Error(
                              'Failed to convert attachment.'
                            )
                          );
                        }
                      };

                    reader.onerror =
                      () =>
                        reject(
                          reader.error ||
                          new Error(
                            'Failed to read attachment.'
                          )
                        );

                    reader.readAsDataURL(
                      file.rawFile
                    );
                  }
                );
            }

            socket.emit(
              'send_message',
              {
                room: roomId,

                senderId:
                  currentUserId,

                senderName:
                  currentUsername,

                senderAvatar:
                  user?.profileImage ||
                  user?.avatar ||
                  null,

                message:
                  i === 0
                    ? message.trim()
                    : '',

                type: file.type,

                attachment:
                  attachmentUrl,

                attachmentType:
                  file.name,

                mediaGroupId,

                createdAt:
                  new Date(),

                replyTo:
                  i === 0 &&
                    replyingMessage
                    ? {
                      messageId:
                        replyingMessage._id,
                      message:
                        replyingMessage.message,
                      senderName:
                        replyingMessage.senderName,
                      type:
                        replyingMessage.type,
                      attachmentType:
                        replyingMessage.attachmentType
                    }
                    : null
              }
            );
          }
        }

        setMessage('');
        setSelectedFiles([]);

        if (cancelReply) {
          cancelReply();
        }

        socket.emit('typing', {
          room: roomId,
          username:
            currentUsername,
          isTyping: false
        });
      } catch (err) {
        console.error(
          '❌ Failed to prepare/send attachments:',
          err
        );

        triggerToast(
          'Failed to send attachment(s).',
          'error'
        );
      } finally {
        setIsUploading(false);
      }
    };

  const triggerSaveEdit =
    messageId => {
      const roomId =
        currentRoom?.id ||
        currentRoom?._id ||
        'global_workspace';

      if (
        !editInput.trim() ||
        !socket
      ) {
        return;
      }

      socket.emit(
        'edit_message',
        {
          room: roomId,
          messageId,
          newMessage:
            editInput.trim()
        }
      );

      setChatLog(prev =>
        prev.map(m =>
          m._id === messageId
            ? {
              ...m,
              message:
                editInput.trim()
            }
            : m
        )
      );

      setEditingMessageId(null);

      triggerToast(
        'Message updated successfully',
        'success'
      );
    };

  const triggerDelete =
    messageId => {
      if (!socket) return;

      const roomId =
        currentRoom?.id ||
        currentRoom?._id ||
        'global_workspace';

      const confirmation = (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            width: '100%',
            padding: '2px 0'
          }}
        >
          <span
            style={{
              fontSize: '0.86rem',
              color: '#0f172a',
              fontWeight: 700
            }}
          >
            Delete message
            permanently?
          </span>

          <div
            style={{
              display: 'flex',
              gap: '10px',
              justifyContent:
                'flex-end'
            }}
          >
            <button
              onClick={() => {
                socket.emit(
                  'delete_message',
                  {
                    room: roomId,
                    messageId
                  }
                );

                setChatLog(prev =>
                  prev.filter(
                    m =>
                      m._id !==
                      messageId
                  )
                );

                setToast({
                  show: false,
                  message: '',
                  type: 'info'
                });

                triggerToast(
                  'Message deleted successfully',
                  'success'
                );
              }}
              style={{
                background:
                  'linear-gradient(135deg, #f43f5e, #e11d48)',
                color: '#fff',
                border: 'none',
                borderRadius: '10px',
                padding: '0 14px',
                height: '36px',
                cursor: 'pointer',
                fontSize: '0.75rem',
                fontWeight: 600
              }}
            >
              Delete
            </button>

            <button
              onClick={() =>
                setToast({
                  show: false,
                  message: '',
                  type: 'info'
                })
              }
              style={{
                background: '#ffffff',
                color: '#475569',
                border:
                  '1px solid #cbd5e1',
                borderRadius: '10px',
                padding: '0 14px',
                height: '36px',
                cursor: 'pointer',
                fontSize: '0.75rem',
                fontWeight: 600
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      );

      triggerToast(
        confirmation,
        'error'
      );
    };

  const triggerAddReaction = (
    messageId,
    emoji
  ) => {
    if (!socket) return;

    const roomId =
      currentRoom?.id ||
      currentRoom?._id ||
      'global_workspace';

    socket.emit(
      'send_reaction',
      {
        room: roomId,
        messageId,
        emoji,
        username:
          currentUsername
      }
    );
  };

  const triggerDeleteConversation =
    roomId => {
      if (!socket) return;

      socket.emit(
        'clear_conversation_history',
        {
          room: roomId,
          userId: currentUserId
        }
      );
    };

  const toggleSelectMessage =
    useCallback(msgId => {
      setSelectedMessageIds(
        prev => {
          const next =
            new Set(prev);

          if (
            next.has(msgId)
          ) {
            next.delete(msgId);
          } else {
            next.add(msgId);
          }

          return next;
        }
      );
    }, []);

  const triggerBulkDelete =
    useCallback(() => {
      if (
        !socket ||
        !currentRoom ||
        selectedMessageIds.size ===
        0
      ) {
        return;
      }

      const roomId =
        currentRoom.id ||
        currentRoom._id;

      const confirmation = (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            width: '100%',
            padding: '2px 0'
          }}
        >
          <span
            style={{
              fontSize: '0.86rem',
              color: '#0f172a',
              fontWeight: 700
            }}
          >
            Purge all{' '}
            {selectedMessageIds.size}{' '}
            records permanently?
          </span>

          <div
            style={{
              display: 'flex',
              gap: '10px',
              justifyContent:
                'flex-end'
            }}
          >
            <button
              onClick={() => {
                socket.emit(
                  'delete_multiple_messages',
                  {
                    room: roomId,
                    messageIds:
                      Array.from(
                        selectedMessageIds
                      )
                  }
                );

                setToast({
                  show: false,
                  message: '',
                  type: 'info'
                });
              }}
              style={{
                background:
                  'linear-gradient(135deg, #f43f5e, #e11d48)',
                color: '#fff',
                border: 'none',
                borderRadius: '10px',
                padding: '0 14px',
                height: '36px',
                cursor: 'pointer',
                fontSize: '0.75rem',
                fontWeight: 600
              }}
            >
              Confirm Bulk Clear
            </button>

            <button
              onClick={() =>
                setToast({
                  show: false,
                  message: '',
                  type: 'info'
                })
              }
              style={{
                background: '#ffffff',
                color: '#475569',
                border:
                  '1px solid #cbd5e1',
                borderRadius: '10px',
                padding: '0 14px',
                height: '36px',
                cursor: 'pointer',
                fontSize: '0.75rem'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      );

      triggerToast(
        confirmation,
        'error'
      );
    }, [
      socket,
      currentRoom,
      selectedMessageIds,
      triggerToast
    ]);

  const recentChatsList =
    useMemo(() => {
      const list = [];

      personalContacts.forEach(
        contact => {
          const jointRoomId = [
            String(currentUserId),
            String(contact.id)
          ]
            .sort()
            .join('_');

          const meta =
            conversationsMetadata[
            jointRoomId
            ];

          if (
            meta &&
            (
              meta.lastMessage ||
              meta.timestamp
            )
          ) {
            list.push({
              id: contact.id,
              roomId:
                jointRoomId,
              name:
                contact.name,
              avatar:
                contact.avatar ||
                contact.profileImage ||
                null,
              type: 'peer',
              isOnline:
                activeUsersList.some(
                  u =>
                    String(
                      u.userId
                    ) ===
                    String(
                      contact.id
                    )
                ),
              lastMessage:
                meta.lastMessage,
              unreadCount:
                meta.unreadCount ||
                0,
              timestamp:
                meta.timestamp
                  ? new Date(
                    meta.timestamp
                  ).toLocaleTimeString(
                    [],
                    {
                      hour: '2-digit',
                      minute: '2-digit'
                    }
                  )
                  : '',
              rawTime:
                meta.timestamp
                  ? new Date(
                    meta.timestamp
                  ).getTime()
                  : 0
            });
          }
        }
      );

      chatChannels.forEach(
        channel => {
          const roomId =
            channel._id ||
            channel.id;

          const meta =
            conversationsMetadata[
            roomId
            ];

          if (
            meta &&
            (
              meta.lastMessage ||
              meta.timestamp
            )
          ) {
            list.push({
              id: roomId,
              roomId,
              name:
                channel.name,
              avatar:
                channel.avatar ||
                channel.profileImage ||
                null,
              type: 'group',
              isOnline: false,
              lastMessage:
                meta.lastMessage,
              unreadCount:
                meta.unreadCount ||
                0,
              timestamp:
                meta.timestamp
                  ? new Date(
                    meta.timestamp
                  ).toLocaleTimeString(
                    [],
                    {
                      hour: '2-digit',
                      minute: '2-digit'
                    }
                  )
                  : '',
              rawTime:
                meta.timestamp
                  ? new Date(
                    meta.timestamp
                  ).getTime()
                  : 0
            });
          }
        }
      );

      return list.sort(
        (a, b) =>
          b.rawTime -
          a.rawTime
      );
    }, [
      personalContacts,
      chatChannels,
      conversationsMetadata,
      activeUsersList,
      currentUserId
    ]);

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

    selectedFiles,
    setSelectedFiles,

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

    replyingMessage,
    setReplyingMessage,
    startReply,
    cancelReply,

    ...mediaProps
  };
};
