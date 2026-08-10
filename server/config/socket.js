const { Server } = require('socket.io');
const mongoose = require('mongoose');
const ChatMessage = require('../models/ChatMessage'); // Imports your model seamlessly

let ioInstance = null;
const onlineUsers = new Map();

module.exports = {
  init: (httpServer) => {
    // UPGRADED BUFFER CAPS: maxHttpBufferSize changed to 5e7 (50 Megabytes) to support large media uploads
    ioInstance = new Server(httpServer, {
      maxHttpBufferSize: 5e7,
      cors: {
        origin: "*",
        methods: ["GET", "POST", "PUT", "DELETE"]
      }
    });
    ioInstance.ioInstance = ioInstance; // Keep variable reference bounds solid

    ioInstance.on("connection", (socket) => {
      console.log(`🔌 Client connected: ${socket.id}`);

      socket.on("join_room", ({ room, username, userId, profileImage }) => {
        const targetRoom = room || "global_workspace";
        socket.join(targetRoom);
        socket.username = username || "Anonymous";
        socket.userId = mongoose.Types.ObjectId.isValid(userId) ? userId : new mongoose.Types.ObjectId().toString();

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

      // =========================================================================
      // RESTORED MAIN MESSAGE TRANSPOSER PIPELINE (FIXED NO TEXTS GOING THROUGH)
      // =========================================================================
      socket.on("send_message", async (messageData) => {
        try {
          const targetRoom = messageData.room || "global_workspace";
          let finalSenderId = messageData.senderId || socket.userId;
          if (!mongoose.Types.ObjectId.isValid(finalSenderId)) {
            finalSenderId = new mongoose.Types.ObjectId();
          }

          // 🚀 READ IMAGE PARAMS FROM USER SOCKET OR PAYLOAD PIPELINE
          const activeConnectionDetails = onlineUsers.get(socket.id) || {};
          const avatarUrl = messageData.senderAvatar || activeConnectionDetails.profileImage || null;

          // 🚀 NEW: RECONCILE AND VALIDATE INBOUND REPLY OBJECT REFERENCES
          let consolidatedReplyPayload = null;
          if (messageData.replyTo && messageData.replyTo.messageId) {
            consolidatedReplyPayload = {
              messageId: mongoose.Types.ObjectId.isValid(messageData.replyTo.messageId)
                ? new mongoose.Types.ObjectId(String(messageData.replyTo.messageId))
                : null,
              message: messageData.replyTo.message || "",
              senderName: messageData.replyTo.senderName || "Anonymous"
            };
          }

          const newMessage = await ChatMessage.create({
            room: targetRoom,
            senderId: finalSenderId,
            senderName: messageData.senderName || socket.username || "Anonymous",
            senderAvatar: avatarUrl, // 🚀 CHRONICLE IMAGE SOURCE URL
            message: messageData.message || "",
            type: messageData.type || "text",
            attachment: messageData.attachment || null,
            attachmentType: messageData.attachmentType || null,
            replyTo: consolidatedReplyPayload, // 🚀 NEW: RECORD THE REPLY TO PARENT REFERENCE
            delivered: true,
            readBy: [{ userId: finalSenderId, readAt: new Date() }]
          });

          // 🚀 BROADCAST AVATAR VALUE AND REPLY OBJECT DOWN STREAM TO CLIENT COMPONENT FEEDS
          ioInstance.to(targetRoom).emit("receive_message", {
            ...newMessage.toObject(),
            senderName: messageData.senderName || socket.username || "Anonymous",
            senderAvatar: avatarUrl
          });
        } catch (err) {
          console.error("❌ Failed to save chat message in DB:", err);
        }
      });

      socket.on("typing", ({ room, username, isTyping }) => {
        socket.to(room || "global_workspace").emit("user_typing", { username: username || socket.username, isTyping });
      });

      socket.on("mark_as_read", async ({ messageId, userId, room }) => {
        try {
          if (!mongoose.Types.ObjectId.isValid(messageId)) return;
          let targetUserId = userId || socket.userId;
          const updated = await ChatMessage.findByIdAndUpdate(
            messageId,
            { $addToSet: { readBy: { userId: targetUserId, readAt: new Date() } } },
            { new: true }
          );
          if (updated) ioInstance.to(room || "global_workspace").emit("message_read_update", { messageId: updated._id, readBy: updated.readBy });
        } catch (err) {
          console.error(err);
        }
      });

      socket.on("edit_message", async ({ room, messageId, newMessage }) => {
        try {
          if (!mongoose.Types.ObjectId.isValid(messageId)) return;
          const updated = await ChatMessage.findByIdAndUpdate(messageId, { message: newMessage }, { new: true });
          if (updated) ioInstance.to(room || "global_workspace").emit("message_edited", { messageId, newMessage });
        } catch (err) {
          console.error(err);
        }
      });

      socket.on("delete_message", async ({ room, messageId }) => {
        try {
          if (!mongoose.Types.ObjectId.isValid(messageId)) return;
          const deleted = await ChatMessage.findByIdAndDelete(messageId);
          if (deleted) ioInstance.to(room || "global_workspace").emit("message_deleted", { messageId });
        } catch (err) {
          console.error(err);
        }
      });
      socket.on("delete_multiple_messages", async ({ room, messageIds }) => {
        try {
          if (!room || !Array.isArray(messageIds) || messageIds.length === 0) return;

          // Convert values safely to native Mongoose ObjectIDs for execution
          const validObjectIds = messageIds
            .filter(id => mongoose.Types.ObjectId.isValid(id))
            .map(id => new mongoose.Types.ObjectId(String(id)));

          if (validObjectIds.length === 0) return;

          // Atomic bulk delete transaction execution path
          await ChatMessage.deleteMany({ _id: { $in: validObjectIds }, room: room });

          // Broadcast update across the room data pipes
          ioInstance.to(room).emit("messages_bulk_deleted", { room, messageIds });
        } catch (err) {
          console.error("❌ Bulk operations drop transaction failure:", err);
        }
      });

      socket.on("clear_conversation_history", async ({ room, userId }) => {
        try {
          if (!room || !userId) return;

          // For absolute deletion from the entire DB:
          await ChatMessage.deleteMany({ room: room });

          // Broadcast update so the active client feeds clear out immediately
          ioInstance.to(room).emit("conversation_history_cleared", { room });
        } catch (err) {
          console.error("❌ Failed to clear conversation logs:", err);
        }
      });


      // =========================================================================
      // SINGLE OPTIMIZED CONCURRENT-SAFE MONGO REACTION ENGINE (NO CONFLICTS)
      // =========================================================================
      socket.on("send_reaction", async ({ room, messageId, emoji, username }) => {
        try {
          if (!mongoose.Types.ObjectId.isValid(messageId) || !emoji || !username) return;
          const targetRoom = room || "global_workspace";
          const existingMessage = await ChatMessage.findOne({ _id: messageId, "reactions.username": username });

          if (existingMessage) {
            const activeReaction = existingMessage.reactions.find(r => r.username === username);
            if (activeReaction && activeReaction.emoji === emoji) {
              await ChatMessage.findByIdAndUpdate(messageId, { $pull: { reactions: { username: username } } });
            } else {
              await ChatMessage.updateOne(
                { _id: messageId, "reactions.username": username },
                { $set: { "reactions.$.emoji": emoji } }
              );
            }
          } else {
            await ChatMessage.findByIdAndUpdate(messageId, { $addToSet: { reactions: { emoji, username } } });
          }
          ioInstance.to(targetRoom).emit("message_reaction_update", { messageId, emoji, username });
        } catch (err) {
          console.error("❌ Reaction pipeline transaction failure:", err);
        }
      });

      socket.on("initiate_call", ({ room, targetPeerId, callerName, type }) => {
        const targetRoom = room || "global_workspace";
        const callerDetails = onlineUsers.get(socket.id) || {};
        const activeProfileImage = callerDetails.profileImage || null;

        if (targetPeerId) {
          const targetSockets = [...onlineUsers.entries()].filter(([_, user]) => String(user.userId) === String(targetPeerId));
          targetSockets.forEach(([socketId]) => {
            ioInstance.to(socketId).emit("incoming_call_signal", { fromSocketId: socket.id, callerName, type, room: targetRoom, profileImage: activeProfileImage });
          });
          return;
        }
        socket.to(targetRoom).emit("incoming_call_signal", { fromSocketId: socket.id, callerName, type, room: targetRoom, profileImage: activeProfileImage });
      });

      socket.on("accept_incoming_call", ({ toSocketId }) => {
        if (!toSocketId) return;
        socket.to(toSocketId).emit("call_accepted_by_peer", { peerSocketId: socket.id });
      });

      socket.on("send_rtc_offer", ({ toSocketId, offer }) => {
        if (!toSocketId) return;
        socket.to(toSocketId).emit("receive_rtc_offer", { fromSocketId: socket.id, offer });
      });

      socket.on("send_rtc_answer", ({ toSocketId, answer }) => {
        if (!toSocketId) return;
        socket.to(toSocketId).emit("receive_rtc_answer", { fromSocketId: socket.id, answer });
      });

      socket.on("send_ice_candidate", ({ toSocketId, candidate }) => {
        if (!toSocketId) return;
        socket.to(toSocketId).emit("receive_ice_candidate", { fromSocketId: socket.id, candidate });
      });

      socket.on("end_call_session", ({ room, toSocketId }) => {
        if (toSocketId) {
          ioInstance.to(toSocketId).emit("call_terminated_by_peer");
          return;
        }
        if (room) {
          socket.to(room).emit("call_terminated_by_peer");
        }
      });

      socket.on("disconnect", () => {
        const details = onlineUsers.get(socket.id);
        if (details) {
          onlineUsers.delete(socket.id);
          const remainingList = Array.from(onlineUsers.values()).filter(u => u.room === details.room).map(u => u.username);
          ioInstance.to(details.room).emit("room_users_update", remainingList);
          socket.to(details.room).emit("user_disconnected_from_workspace", { socketId: socket.id });
        }
      });
    });

    return ioInstance;
  },
  getIO: () => {
    if (!ioInstance) throw new Error("Socket.io tracker has not been initialized yet.");
    return ioInstance;
  }
};
