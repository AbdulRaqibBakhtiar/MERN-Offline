const { Server } = require('socket.io');
const mongoose = require('mongoose');
const ChatMessage = require('../models/ChatMessage');
const Group = require('../models/Group');
const CallHistory = require('../models/CallHistory');
const { authenticateToken } = require('../middleware/auth');
const { getAllowedOrigins } = require('./origins');
const { buildIceServers } = require('../utils/turnCredentials');

let ioInstance = null;
const onlineUsers = new Map();
const activeCalls = new Map();

module.exports = {
  init: (httpServer) => {
    ioInstance = new Server(httpServer, {
      maxHttpBufferSize: 5e7,
      cors: {
        origin: getAllowedOrigins(),
        methods: ["GET", "POST"]
      }
    });

    ioInstance.ioInstance = ioInstance;

    ioInstance.use(async (socket, next) => {
      try {
        socket.authUser = await authenticateToken(socket.handshake.auth?.token);
        next();
      } catch (err) {
        next(new Error('Unauthorized socket connection'));
      }
    });

    ioInstance.on("connection", (socket) => {
      const eventWindows = new Map();
      const withinLimit = (eventName, max, windowMs) => {
        const now = Date.now();
        const window = eventWindows.get(eventName);
        if (!window || now >= window.resetAt) {
          eventWindows.set(eventName, { count: 1, resetAt: now + windowMs });
          return true;
        }
        window.count += 1;
        return window.count <= max;
      };
      socket.userId = String(socket.authUser.id);
      socket.username = socket.authUser.username;
      socket.join(`user:${socket.userId}`);
      socket.emit('rtc_ice_servers', buildIceServers(socket.userId));
      socket.on('request_rtc_ice_servers', () => socket.emit('rtc_ice_servers', buildIceServers(socket.userId)));
      console.log(`🔌 Client connected: ${socket.id}`);

      socket.on("join_room", async ({ room, profileImage } = {}) => {
        const targetRoom = room || "global_workspace";
        const directParticipants = targetRoom.split('_');
        const directRoom = targetRoom === socket.userId || (
          directParticipants.length === 2 &&
          directParticipants.every(mongoose.Types.ObjectId.isValid) &&
          directParticipants.includes(socket.userId)
        );
        const groupRoom = mongoose.Types.ObjectId.isValid(targetRoom)
          ? await Group.exists({ _id: targetRoom, members: socket.userId })
          : null;
        if (targetRoom !== 'global_workspace' && !directRoom && !groupRoom) {
          socket.emit('room_access_denied', { room: targetRoom });
          return;
        }

        for (const joinedRoom of socket.rooms) {
          if (joinedRoom !== socket.id && joinedRoom !== `user:${socket.userId}` && joinedRoom !== targetRoom) {
            socket.leave(joinedRoom);
          }
        }
        socket.join(targetRoom);

        onlineUsers.set(socket.id, {
          username: socket.username,
          userId: socket.userId,
          room: targetRoom,
          profileImage: profileImage || null
        });

        const activeList = Array.from(onlineUsers.values())
          .filter(u => u.room === targetRoom);

        ioInstance.to(targetRoom).emit("room_users_update", activeList);
      });
      socket.on("news_comment_updated", ({ newsId }) => {
        if (!newsId || socket.authUser.role !== 'admin') return;

        ioInstance.emit("news_comment_updated", {
          newsId
        });
      });
      // =========================
      // MESSAGES
      // =========================

      socket.on("send_message", async (messageData) => {
        try {
          if (!withinLimit('send_message', 30, 60_000)) return socket.emit('chat_action_error', { error: 'You are sending messages too quickly.' });
          if (messageData?.attachment && !withinLimit('send_media', 6, 60_000)) return socket.emit('chat_action_error', { error: 'You are sending attachments too quickly.' });
          if (!messageData || typeof messageData !== 'object' || typeof messageData.message !== 'string' || messageData.message.length > 10000 || (messageData.attachment && (typeof messageData.attachment !== 'string' || messageData.attachment.length > 45 * 1024 * 1024))) {
            return socket.emit('chat_action_error', { error: 'This message or attachment is too large.' });
          }
          const targetRoom = messageData.room || "global_workspace";
          if (!socket.rooms.has(targetRoom)) return;
          const finalSenderId = socket.userId;

          const activeConnectionDetails = onlineUsers.get(socket.id) || {};

          const avatarUrl =
            messageData.senderAvatar ||
            activeConnectionDetails.profileImage ||
            null;

          let consolidatedReplyPayload = null;

          if (messageData.replyTo?.messageId) {
            consolidatedReplyPayload = {
              messageId: mongoose.Types.ObjectId.isValid(
                messageData.replyTo.messageId
              )
                ? new mongoose.Types.ObjectId(
                  String(messageData.replyTo.messageId)
                )
                : null,
              message: messageData.replyTo.message || "",
              senderName: messageData.replyTo.senderName || "Anonymous"
            };
          }

          const newMessage = await ChatMessage.create({
            room: targetRoom,
            senderId: finalSenderId,
            senderName: socket.username,
            senderAvatar: avatarUrl,
            message: messageData.message || "",
            type: messageData.type || "text",
            attachment: messageData.attachment || null,
            attachmentType: messageData.attachmentType || null,
            replyTo: consolidatedReplyPayload,
            delivered: true,
            readBy: [{
              userId: finalSenderId,
              readAt: new Date()
            }]
          });

          const outgoingMessage = {
            ...newMessage.toObject(),
            senderName: socket.username,
            senderAvatar: avatarUrl
          };

          ioInstance
            .to(targetRoom)
            .emit("receive_message", outgoingMessage);

        } catch (err) {
          console.error("❌ Failed to save chat message:", err);
        }
      });

      socket.on("typing", ({ room, isTyping } = {}) => {
        const targetRoom = room || "global_workspace";
        if (!socket.rooms.has(targetRoom)) return;
        socket
          .to(targetRoom)
          .emit("user_typing", {
            username: socket.username,
            isTyping
          });
      });

      socket.on("mark_as_read", async ({ messageId, room } = {}) => {
        try {
          if (!mongoose.Types.ObjectId.isValid(messageId)) return;
          const targetRoom = room || 'global_workspace';
          if (!socket.rooms.has(targetRoom)) return;

          const updated = await ChatMessage.findOneAndUpdate(
            { _id: messageId, room: targetRoom },
            {
              $addToSet: {
                readBy: {
                  userId: socket.userId,
                  readAt: new Date()
                }
              }
            },
            { new: true }
          );

          if (updated) {
            ioInstance
              .to(targetRoom)
              .emit("message_read_update", {
                messageId: updated._id,
                readBy: updated.readBy
              });
          }
        } catch (err) {
          console.error(err);
        }
      });

      socket.on("edit_message", async ({ room, messageId, newMessage }) => {
        try {
          if (!mongoose.Types.ObjectId.isValid(messageId) || !socket.rooms.has(room)) return;

          const updated = await ChatMessage.findByIdAndUpdate(
            { _id: messageId, room, senderId: socket.userId },
            { message: newMessage },
            { new: true }
          );

          if (updated) {
            ioInstance
              .to(room || "global_workspace")
              .emit("message_edited", {
                messageId,
                newMessage
              });
          }
        } catch (err) {
          console.error(err);
        }
      });

      socket.on("delete_message", async ({ room, messageId }) => {
        try {
          if (!mongoose.Types.ObjectId.isValid(messageId) || !socket.rooms.has(room)) return;

          const deleted = await ChatMessage.findOneAndDelete({ _id: messageId, room, senderId: socket.userId });

          if (deleted) {
            ioInstance
              .to(room || "global_workspace")
              .emit("message_deleted", { messageId });
          }
        } catch (err) {
          console.error(err);
        }
      });

      socket.on("delete_multiple_messages", async ({ room, messageIds }) => {
        try {
          if (!room || !socket.rooms.has(room) || !Array.isArray(messageIds) || !messageIds.length) {
            return;
          }

          const validObjectIds = messageIds
            .filter(id => mongoose.Types.ObjectId.isValid(id))
            .map(id => new mongoose.Types.ObjectId(String(id)));

          if (!validObjectIds.length) return;

          await ChatMessage.deleteMany({
            _id: { $in: validObjectIds },
            room,
            senderId: socket.userId
          });

          ioInstance.to(room).emit("messages_bulk_deleted", {
            room,
            messageIds
          });
        } catch (err) {
          console.error("❌ Bulk delete failed:", err);
        }
      });

      socket.on("clear_conversation_history", async ({ room } = {}) => {
        try {
          if (!room || !socket.rooms.has(room)) return;
          const group = mongoose.Types.ObjectId.isValid(room) ? await Group.findById(room) : null;
          if (socket.authUser.role !== 'admin' && (!group || String(group.createdBy) !== socket.userId)) return;

          await ChatMessage.deleteMany({ room });

          ioInstance
            .to(room)
            .emit("conversation_history_cleared", { room });
        } catch (err) {
          console.error("❌ Failed to clear conversation:", err);
        }
      });

      // =========================
      // REACTIONS
      // =========================

      socket.on(
        "send_reaction",
        async ({ room, messageId, emoji }) => {
          try {
            if (!withinLimit('send_reaction', 60, 60_000)) return;
            if (
              !mongoose.Types.ObjectId.isValid(messageId) ||
              typeof emoji !== 'string' || !emoji || emoji.length > 16
            ) {
              return;
            }

            const targetRoom = room || "global_workspace";
            if (!socket.rooms.has(targetRoom)) return;
            const messageInRoom = await ChatMessage.exists({ _id: messageId, room: targetRoom });
            if (!messageInRoom) return;

            const existingMessage = await ChatMessage.findOne({
              _id: messageId,
              room: targetRoom,
              "reactions.username": socket.username
            });

            if (existingMessage) {
              const activeReaction =
                existingMessage.reactions.find(
                  r => r.username === socket.username
                );

              if (activeReaction?.emoji === emoji) {
                await ChatMessage.findOneAndUpdate(
                  { _id: messageId, room: targetRoom },
                  {
                    $pull: {
                      reactions: { username: socket.username }
                    }
                  }
                );
              } else {
                await ChatMessage.updateOne(
                  {
                    _id: messageId,
                    room: targetRoom,
                    "reactions.username": socket.username
                  },
                  {
                    $set: {
                      "reactions.$.emoji": emoji
                    }
                  }
                );
              }
            } else {
              await ChatMessage.findOneAndUpdate(
                { _id: messageId, room: targetRoom },
                {
                  $addToSet: {
                      reactions: { emoji, username: socket.username }
                  }
                }
              );
            }

            ioInstance
              .to(targetRoom)
              .emit("message_reaction_update", {
                messageId,
                emoji,
                username: socket.username
              });

          } catch (err) {
            console.error("❌ Reaction failed:", err);
          }
        }
      );

      // ============================================================
      // WEBRTC CALL SIGNALING
      // ============================================================

      const publishCallHistory = (call) => {
        const payload = JSON.parse(JSON.stringify(call?.toObject ? call.toObject() : call));
        const participantIds = [payload?.caller, payload?.recipient, ...(payload?.participants || []).map(participant => participant.user)]
          .filter(Boolean).map(id => String(id?._id || id));
        const rooms = [...new Set(participantIds)].map(id => `user:${id}`);
        if (rooms.length) ioInstance.to(rooms).emit('call_history_updated', payload);
      };

      const participantInfo = socketId => {
        const participant = onlineUsers.get(socketId) || {};
        return { socketId, userId: participant.userId, name: participant.username || 'Bazzar contact', profileImage: participant.profileImage || null };
      };

      socket.on("initiate_call", async ({ room, targetPeerId, targetPeerIds, conference, type } = {}) => {
        if (!withinLimit('initiate_call', 6, 60_000)) return socket.emit('call_unavailable', { reason: 'Please wait before starting another call.' });
        const targetRoom = room || "global_workspace";
        if (!socket.rooms.has(targetRoom) || activeCalls.has(socket.id) || !['voice', 'video'].includes(type)) return;
        const requestedIds = [...new Set((conference && Array.isArray(targetPeerIds) ? targetPeerIds : [targetPeerId]).filter(Boolean).map(String))]
          .filter(id => id !== String(socket.userId)).slice(0, conference ? 3 : 1);
        if (!requestedIds.length) return socket.emit('call_unavailable', { reason: 'Choose at least one other person for the call.' });

        const selectedTargets = [];
        requestedIds.forEach(userId => {
          const target = [...onlineUsers.entries()].find(([socketId, online]) => String(online.userId) === userId && online.room === targetRoom && !activeCalls.has(socketId));
          if (target) selectedTargets.push(target);
        });
        if (!selectedTargets.length) {
          try {
            const missed = await CallHistory.create({
              callId: `${socket.id}_${requestedIds[0]}_${Date.now()}`, room: targetRoom, caller: socket.userId,
              recipient: requestedIds[0], participants: [{ user: socket.userId }, ...requestedIds.map(user => ({ user }))], type, status: 'missed', endedAt: new Date()
            });
            publishCallHistory(missed);
          } catch (error) { console.error('[CALL] Could not save missed call:', error.message); }
          socket.emit('call_unavailable', { reason: 'No invited person is active in this conversation.' });
          return;
        }

        const callId = `${socket.id}_${Date.now()}`;
        let historyRecord = null;
        const participantRows = [{ user: socket.userId, joinedAt: new Date() }, ...selectedTargets.map(([, online]) => ({ user: online.userId }))];
        try {
          historyRecord = await CallHistory.create({ callId, room: targetRoom, caller: socket.userId, recipient: selectedTargets[0][1].userId, participants: participantRows, type, status: 'ringing' });
          publishCallHistory(historyRecord);
        } catch (error) { console.error('[CALL] Could not save call history:', error.message); }

        const session = {
          callId, room: targetRoom, type, hostSocketId: socket.id, callerUserId: String(socket.userId),
          historyId: historyRecord?._id || null, acceptedAt: null, conference: Boolean(conference), participants: new Map()
        };
        session.participants.set(socket.id, { ...participantInfo(socket.id), state: 'joined', joinedAt: new Date() });
        selectedTargets.forEach(([targetSocketId]) => {
          session.participants.set(targetSocketId, { ...participantInfo(targetSocketId), state: 'invited', joinedAt: null });
          activeCalls.set(targetSocketId, session);
        });
        activeCalls.set(socket.id, session);

        selectedTargets.forEach(([targetSocketId]) => ioInstance.to(targetSocketId).emit('incoming_call_signal', {
          callId, fromSocketId: socket.id, callerName: socket.username, type, room: targetRoom,
          callerUserId: String(socket.userId), profileImage: participantInfo(socket.id).profileImage,
          isConference: Boolean(conference), participantCount: selectedTargets.length + 1
        }));
      });

      socket.on("accept_incoming_call", async ({ toSocketId } = {}) => {
        const session = activeCalls.get(socket.id);
        const participant = session?.participants.get(socket.id);
        if (!session || !participant || participant.state !== 'invited' || !session.participants.has(toSocketId)) {
          socket.emit('call_terminated_by_peer');
          return;
        }
        participant.state = 'joined';
        participant.joinedAt = new Date();
        session.acceptedAt = session.acceptedAt || participant.joinedAt;
        const peers = [...session.participants.entries()].filter(([peerSocketId, peer]) => peerSocketId !== socket.id && peer.state === 'joined').map(([peerSocketId]) => participantInfo(peerSocketId));
        socket.emit('call_room_joined', { callId: session.callId, participants: peers, isConference: session.conference });
        peers.forEach(peer => ioInstance.to(peer.socketId).emit('call_participant_joined', { callId: session.callId, participant: participantInfo(socket.id) }));
        if (session.historyId) {
          try {
            const record = await CallHistory.findById(session.historyId);
            if (record) {
              record.status = 'in_progress';
              record.acceptedAt = session.acceptedAt;
              const historyParticipant = record.participants.find(row => String(row.user) === String(participant.userId));
              if (historyParticipant) historyParticipant.joinedAt = participant.joinedAt;
              await record.save();
              publishCallHistory(record);
            }
          } catch (error) { console.error('[CALL] Could not update accepted call:', error.message); }
        }
      });

      const getConnectedPeer = (session, peerSocketId) => {
        const source = session?.participants.get(socket.id);
        const target = session?.participants.get(peerSocketId);
        return source?.state === 'joined' && target?.state === 'joined';
      };

      socket.on("send_rtc_offer", ({ toSocketId, offer } = {}) => {
        const session = activeCalls.get(socket.id);
        if (!offer || !getConnectedPeer(session, toSocketId)) return;
        ioInstance.to(toSocketId).emit('receive_rtc_offer', { fromSocketId: socket.id, fromPeer: participantInfo(socket.id), offer, callId: session.callId });
      });

      socket.on("send_rtc_answer", ({ toSocketId, answer } = {}) => {
        const session = activeCalls.get(socket.id);
        if (!answer || !getConnectedPeer(session, toSocketId)) return;
        ioInstance.to(toSocketId).emit('receive_rtc_answer', { fromSocketId: socket.id, answer, callId: session.callId });
      });

      socket.on("send_ice_candidate", ({ toSocketId, candidate } = {}) => {
        const session = activeCalls.get(socket.id);
        if (!candidate || !getConnectedPeer(session, toSocketId)) return;
        ioInstance.to(toSocketId).emit('receive_ice_candidate', { fromSocketId: socket.id, candidate, callId: session.callId });
      });

      socket.on("end_call_session", async ({ reason } = {}) => {
        const session = activeCalls.get(socket.id);
        if (!session) return;
        const endedAt = new Date();
        const isHost = socket.id === session.hostSocketId;
        const current = session.participants.get(socket.id);
        if (!isHost && current) {
          current.state = reason === 'declined' ? 'declined' : 'left';
          current.leftAt = endedAt;
          activeCalls.delete(socket.id);
          session.participants.forEach((peer, peerSocketId) => {
            if (peerSocketId !== socket.id && peer.state === 'joined') ioInstance.to(peerSocketId).emit('call_participant_left', { callId: session.callId, socketId: socket.id });
          });
          if (reason === 'declined') ioInstance.to(session.hostSocketId).emit('call_invitation_declined', { participant: participantInfo(socket.id) });
          const hasInvites = [...session.participants.values()].some(peer => peer.state === 'invited');
          const joinedPeers = [...session.participants.values()].filter(peer => peer.state === 'joined');
          if (!hasInvites && joinedPeers.length <= 1) {
            activeCalls.delete(session.hostSocketId);
            ioInstance.to(session.hostSocketId).emit('call_terminated_by_peer');
          }
        } else {
          session.participants.forEach((peer, peerSocketId) => {
            if (peer.state === 'joined') peer.leftAt = endedAt;
            activeCalls.delete(peerSocketId);
            if (peerSocketId !== socket.id) ioInstance.to(peerSocketId).emit('call_terminated_by_peer');
          });
        }

        if (session.historyId) {
          try {
            const record = await CallHistory.findById(session.historyId);
            if (record) {
              const historyParticipant = record.participants.find(row => String(row.user) === String(socket.userId));
              if (historyParticipant && (isHost || current?.state === 'left' || current?.state === 'declined')) historyParticipant.leftAt = endedAt;
              const joinedCount = [...session.participants.values()].filter(peer => peer.state === 'joined').length;
              if (isHost || joinedCount <= 1) {
                record.status = session.acceptedAt ? (reason === 'failed' ? 'failed' : 'completed') : reason === 'no_answer' ? 'missed' : reason === 'failed' ? 'failed' : reason === 'declined' ? 'declined' : 'cancelled';
                record.endedAt = endedAt;
                record.endedBy = socket.userId;
                record.durationSeconds = session.acceptedAt ? Math.max(0, Math.round((endedAt - session.acceptedAt) / 1000)) : 0;
              }
              await record.save();
              publishCallHistory(record);
            }
          } catch (error) { console.error('[CALL] Could not update call history:', error.message); }
        }
        if (isHost) activeCalls.delete(session.hostSocketId);
        if (session.participants.size === 0 || (session.participants.size === 1 && !isHost)) activeCalls.delete(socket.id);
      });
      // =========================
      // DISCONNECT
      // =========================

      socket.on("disconnect", async () => {
        const details = onlineUsers.get(socket.id);
        const session = activeCalls.get(socket.id);
        if (session) {
          const endedAt = new Date();
          const isHost = session.hostSocketId === socket.id;
          const participant = session.participants.get(socket.id);
          if (participant) { participant.state = 'left'; participant.leftAt = endedAt; }
          activeCalls.delete(socket.id);
          if (isHost) {
            session.participants.forEach((peer, peerSocketId) => {
              activeCalls.delete(peerSocketId);
              if (peerSocketId !== socket.id) ioInstance.to(peerSocketId).emit('call_terminated_by_peer');
            });
          } else {
            session.participants.forEach((peer, peerSocketId) => {
              if (peerSocketId !== socket.id && peer.state === 'joined') ioInstance.to(peerSocketId).emit('call_participant_left', { callId: session.callId, socketId: socket.id });
            });
          }
          if (session.historyId) {
            try {
              const record = await CallHistory.findById(session.historyId);
              if (record) {
                const historyParticipant = record.participants.find(row => String(row.user) === String(socket.userId));
                if (historyParticipant) historyParticipant.leftAt = endedAt;
                if (isHost) {
                  record.status = session.acceptedAt ? 'completed' : 'missed';
                  record.endedAt = endedAt;
                  record.endedBy = socket.userId;
                  record.durationSeconds = session.acceptedAt ? Math.max(0, Math.round((endedAt - session.acceptedAt) / 1000)) : 0;
                }
                await record.save();
                publishCallHistory(record);
              }
            } catch (error) { console.error('[CALL] Could not save disconnected call:', error.message); }
          }
          console.log(`[CALL] Disconnected socket ${socket.id}; conference updated`);
        }

        if (details) {
          onlineUsers.delete(socket.id);

          const remainingList =
            Array.from(onlineUsers.values())
              .filter(u => u.room === details.room)
              .map(u => u.username);

          ioInstance
            .to(details.room)
            .emit("room_users_update", remainingList);

          socket
            .to(details.room)
            .emit(
              "user_disconnected_from_workspace",
              { socketId: socket.id }
            );
        }
      });
    });

    return ioInstance;
  },

  getIO: () => {
    if (!ioInstance) {
      throw new Error(
        "Socket.io tracker has not been initialized yet."
      );
    }

    return ioInstance;
  }
};
