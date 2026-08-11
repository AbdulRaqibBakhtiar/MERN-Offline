const { Server } = require('socket.io');
const mongoose = require('mongoose');
const ChatMessage = require('../models/ChatMessage');

let ioInstance = null;
const onlineUsers = new Map();
const activeCalls = new Map();

module.exports = {
  init: (httpServer) => {
    ioInstance = new Server(httpServer, {
      maxHttpBufferSize: 5e7,
      cors: {
        origin: "*",
        methods: ["GET", "POST", "PUT", "DELETE"]
      }
    });

    ioInstance.ioInstance = ioInstance;

    ioInstance.on("connection", (socket) => {
      console.log(`🔌 Client connected: ${socket.id}`);

      socket.on("join_room", ({ room, username, userId, profileImage }) => {
        const targetRoom = room || "global_workspace";

        socket.join(targetRoom);
        socket.username = username || "Anonymous";
        socket.userId = mongoose.Types.ObjectId.isValid(userId)
          ? userId
          : new mongoose.Types.ObjectId().toString();

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

      // =========================
      // MESSAGES
      // =========================

      socket.on("send_message", async (messageData) => {
        try {
          const targetRoom = messageData.room || "global_workspace";

          let finalSenderId = messageData.senderId || socket.userId;

          if (!mongoose.Types.ObjectId.isValid(finalSenderId)) {
            finalSenderId = new mongoose.Types.ObjectId();
          }

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
            senderName:
              messageData.senderName ||
              socket.username ||
              "Anonymous",
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
            senderName:
              messageData.senderName ||
              socket.username ||
              "Anonymous",
            senderAvatar: avatarUrl
          };

          ioInstance
            .to(targetRoom)
            .emit("receive_message", outgoingMessage);

        } catch (err) {
          console.error("❌ Failed to save chat message:", err);
        }
      });

      socket.on("typing", ({ room, username, isTyping }) => {
        socket
          .to(room || "global_workspace")
          .emit("user_typing", {
            username: username || socket.username,
            isTyping
          });
      });

      socket.on("mark_as_read", async ({ messageId, userId, room }) => {
        try {
          if (!mongoose.Types.ObjectId.isValid(messageId)) return;

          const targetUserId = userId || socket.userId;

          const updated = await ChatMessage.findByIdAndUpdate(
            messageId,
            {
              $addToSet: {
                readBy: {
                  userId: targetUserId,
                  readAt: new Date()
                }
              }
            },
            { new: true }
          );

          if (updated) {
            ioInstance
              .to(room || "global_workspace")
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
          if (!mongoose.Types.ObjectId.isValid(messageId)) return;

          const updated = await ChatMessage.findByIdAndUpdate(
            messageId,
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
          if (!mongoose.Types.ObjectId.isValid(messageId)) return;

          const deleted = await ChatMessage.findByIdAndDelete(messageId);

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
          if (!room || !Array.isArray(messageIds) || !messageIds.length) {
            return;
          }

          const validObjectIds = messageIds
            .filter(id => mongoose.Types.ObjectId.isValid(id))
            .map(id => new mongoose.Types.ObjectId(String(id)));

          if (!validObjectIds.length) return;

          await ChatMessage.deleteMany({
            _id: { $in: validObjectIds },
            room
          });

          ioInstance.to(room).emit("messages_bulk_deleted", {
            room,
            messageIds
          });
        } catch (err) {
          console.error("❌ Bulk delete failed:", err);
        }
      });

      socket.on("clear_conversation_history", async ({ room, userId }) => {
        try {
          if (!room || !userId) return;

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
        async ({ room, messageId, emoji, username }) => {
          try {
            if (
              !mongoose.Types.ObjectId.isValid(messageId) ||
              !emoji ||
              !username
            ) {
              return;
            }

            const targetRoom = room || "global_workspace";

            const existingMessage = await ChatMessage.findOne({
              _id: messageId,
              "reactions.username": username
            });

            if (existingMessage) {
              const activeReaction =
                existingMessage.reactions.find(
                  r => r.username === username
                );

              if (activeReaction?.emoji === emoji) {
                await ChatMessage.findByIdAndUpdate(
                  messageId,
                  {
                    $pull: {
                      reactions: { username }
                    }
                  }
                );
              } else {
                await ChatMessage.updateOne(
                  {
                    _id: messageId,
                    "reactions.username": username
                  },
                  {
                    $set: {
                      "reactions.$.emoji": emoji
                    }
                  }
                );
              }
            } else {
              await ChatMessage.findByIdAndUpdate(
                messageId,
                {
                  $addToSet: {
                    reactions: { emoji, username }
                  }
                }
              );
            }

            ioInstance
              .to(targetRoom)
              .emit("message_reaction_update", {
                messageId,
                emoji,
                username
              });

          } catch (err) {
            console.error("❌ Reaction failed:", err);
          }
        }
      );

      // ============================================================
      // WEBRTC CALL SIGNALING
      // ============================================================

      socket.on("initiate_call", ({ room, targetPeerId, callerName, type }) => {
        const targetRoom = room || "global_workspace";
        const callerSocketId = socket.id;
        const callerDetails = onlineUsers.get(callerSocketId) || {};
        const profileImage = callerDetails.profileImage || null;

        if (!targetPeerId) return;

        const targetSockets = [...onlineUsers.entries()]
          .filter(([_, user]) =>
            String(user.userId) === String(targetPeerId)
          );

        targetSockets.forEach(([targetSocketId]) => {
          // Remove any previous call involving this target
          activeCalls.delete(targetSocketId);

          const callId = `${callerSocketId}_${targetSocketId}_${Date.now()}`;

          activeCalls.set(targetSocketId, {
            callId,
            callerSocketId,
            receiverSocketId: targetSocketId,
            room: targetRoom,
            type
          });

          activeCalls.set(callerSocketId, {
            callId,
            callerSocketId,
            receiverSocketId: targetSocketId,
            room: targetRoom,
            type
          });

          console.log(
            `[CALL] ${callerSocketId} -> ${targetSocketId} STARTED`,
            callId
          );

          ioInstance.to(targetSocketId).emit(
            "incoming_call_signal",
            {
              callId,
              fromSocketId: callerSocketId,
              callerName,
              type,
              room: targetRoom,
              profileImage
            }
          );
        });
      });

      socket.on("accept_incoming_call", ({ toSocketId }) => {
        if (!toSocketId) return;

        const call = activeCalls.get(socket.id);

        // Receiver has no active call anymore
        if (!call) {
          console.log(
            `[CALL] Ignored stale ACCEPT from ${socket.id}`
          );

          socket.emit("call_terminated_by_peer");
          return;
        }

        // Make absolutely sure this is the correct caller
        if (call.callerSocketId !== toSocketId) {
          console.log(
            `[CALL] Rejected invalid ACCEPT from ${socket.id}`
          );

          socket.emit("call_terminated_by_peer");
          return;
        }

        console.log(
          `[CALL] ${socket.id} ACCEPTED ${toSocketId}`
        );

        ioInstance.to(toSocketId).emit(
          "call_accepted_by_peer",
          {
            peerSocketId: socket.id,
            callId: call.callId
          }
        );
      });

      socket.on("send_rtc_offer", ({ toSocketId, offer }) => {
        if (!toSocketId || !offer) return;

        const call = activeCalls.get(socket.id);

        if (!call || call.callerSocketId !== socket.id) {
          console.log("[CALL] Ignored stale RTC OFFER");
          return;
        }

        ioInstance.to(toSocketId).emit(
          "receive_rtc_offer",
          {
            fromSocketId: socket.id,
            offer,
            callId: call.callId
          }
        );
      });

      socket.on("send_rtc_answer", ({ toSocketId, answer }) => {
        if (!toSocketId || !answer) return;

        const call = activeCalls.get(socket.id);

        if (!call) {
          console.log("[CALL] Ignored stale RTC ANSWER");
          return;
        }

        ioInstance.to(toSocketId).emit(
          "receive_rtc_answer",
          {
            fromSocketId: socket.id,
            answer,
            callId: call.callId
          }
        );
      });

      socket.on("send_ice_candidate", ({ toSocketId, candidate }) => {
        if (!toSocketId || !candidate) return;

        const call = activeCalls.get(socket.id);

        if (!call) {
          console.log("[CALL] Ignored stale ICE candidate");
          return;
        }

        ioInstance.to(toSocketId).emit(
          "receive_ice_candidate",
          {
            fromSocketId: socket.id,
            candidate,
            callId: call.callId
          }
        );
      });

      socket.on("end_call_session", ({ room, toSocketId }) => {
        const callerSocketId = socket.id;
        const call = activeCalls.get(callerSocketId);

        console.log(
          `[CALL] ${callerSocketId} END CALL`,
          call || { toSocketId, room }
        );

        // Determine the other peer
        const peerSocketId =
          call?.callerSocketId === callerSocketId
            ? call.receiverSocketId
            : call?.receiverSocketId === callerSocketId
              ? call.callerSocketId
              : toSocketId;

        // IMPORTANT:
        // Delete both sides BEFORE sending termination.
        // This prevents a stale Accept / OFFER / ANSWER / ICE
        // from reviving the call.
        if (call) {
          activeCalls.delete(call.callerSocketId);
          activeCalls.delete(call.receiverSocketId);
        } else {
          activeCalls.delete(callerSocketId);

          if (toSocketId) {
            activeCalls.delete(toSocketId);
          }
        }

        if (peerSocketId) {
          ioInstance.to(peerSocketId).emit(
            "call_terminated_by_peer"
          );
        }

        // Also notify the caller socket itself.
        ioInstance.to(callerSocketId).emit(
          "call_terminated_by_peer"
        );

        console.log(
          `[CALL] ${callerSocketId} <-> ${peerSocketId} TERMINATED`
        );
      });
      socket.on(
        "end_call_session",
        ({ room, toSocketId, callId }) => {
          console.log("\n📴 END CALL SIGNAL");
          console.log("Caller socket:", socket.id);
          console.log("Target socket:", toSocketId);
          console.log("Call ID:", callId);

          if (toSocketId) {
            const targetSocket = ioInstance.sockets.sockets.get(
              toSocketId
            );

            if (!targetSocket) {
              console.log(
                "⚠️ Target socket no longer connected:",
                toSocketId
              );
              return;
            }

            console.log(
              `📴 Sending call_terminated_by_peer -> ${toSocketId}`
            );

            targetSocket.emit("call_terminated_by_peer", {
              fromSocketId: socket.id,
              callId
            });

            return;
          }

          if (room) {
            console.log(
              `📴 Broadcasting call termination to room: ${room}`
            );

            socket.to(room).emit(
              "call_terminated_by_peer",
              {
                fromSocketId: socket.id,
                callId
              }
            );
          }
        }
      );

      // =========================
      // DISCONNECT
      // =========================

      socket.on("disconnect", () => {
        const details = onlineUsers.get(socket.id);

        // Kill any active call involving this socket
        const call = activeCalls.get(socket.id);

        if (call) {
          const peerSocketId =
            call.callerSocketId === socket.id
              ? call.receiverSocketId
              : call.callerSocketId;

          activeCalls.delete(call.callerSocketId);
          activeCalls.delete(call.receiverSocketId);

          if (peerSocketId) {
            ioInstance.to(peerSocketId).emit(
              "call_terminated_by_peer"
            );
          }

          console.log(
            `[CALL] Disconnected socket ${socket.id}; call terminated`
          );
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