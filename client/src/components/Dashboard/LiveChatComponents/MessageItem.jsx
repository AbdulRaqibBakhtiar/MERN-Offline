import React, { useState, useRef } from 'react';
import { ReplyQuote } from './ReplyQuote';
import { AudioPlayer } from '../../Layout/AudioPlayer';
import { MessageFileDownload } from '../../Layout/MessageFileDownload';
import { MessageTextRender } from '../../Layout/MessageTextRender';
import { MessageReactions } from '../../Layout/MessageReactions';
import { MessageActionMenu } from '../../Layout/MessageActionMenu';
import { MessageEditArea } from '../../Layout/MessageEditArea';
import { MessageItemFrame } from '../../Layout/MessageItemFrame';

// Layout level structural elements
import { MessageMediaPreview } from '../../Layout/MessageMediaPreview';
import { MessageMeta } from '../../Layout/MessageMeta';

export const MessageItem = ({ msg, idx, user, chatProps, resolveDrawerImgUrl }) => {
  const { chatLog, reactionsMap, editingMessageId, setEditingMessageId, editInput, setEditInput, triggerSaveEdit, triggerToast, isSelectionMode, selectedMessageIds, toggleSelectMessage } = chatProps;
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [menuCoords, setMenuCoords] = useState({ top: 0, left: 0 });
  const [audioDuration, setAudioDuration] = useState(0);
  const bubbleRef = useRef(null);

  const currentUsername = chatProps?.currentUsername || user?.username || user?.name || "Anonymous";
  const isMe = (msg.senderId && user && String(msg.senderId) === String(user._id || user.id)) || (msg.senderName && user && (msg.senderName === user.username || msg.senderName === user.name));
  const isSame = chatLog[idx - 1] && chatLog[idx - 1].senderName === msg.senderName;
  const isSelected = selectedMessageIds?.has(msg._id) || false;
  const isCurrentlyEditing = editingMessageId === msg._id;

  // 🎯 FIXED LOCATION: Avatar Resolution Engine moved here so 'finalAvatarUrl' is defined before use
  const livePeerContact = !isMe && chatProps?.personalContacts?.find(c => String(c.id) === String(msg.senderId));
  const rawAvatarField = msg.senderAvatar || msg.avatar || (livePeerContact && (livePeerContact.avatar || livePeerContact.profileImage)) || (isMe && user && (user.profileImage || user.avatar)) || (msg.sender && (msg.sender.profileImage || msg.sender.avatar)) || msg.profileImage;
  const finalAvatarUrl = resolveDrawerImgUrl ? resolveDrawerImgUrl(rawAvatarField) : null;
  const isMediaMsg = msg.type === 'image' || msg.type === 'video';
  const isVoiceMemoFile = msg.type === 'audio' || (msg.type === 'file' && (msg.attachmentType?.endsWith('.webm') || (msg.attachment && msg.attachment.toLowerCase().match(/\.(mp3|wav|ogg|m4a|aac|flac)$/i))));
  const isDocMsg = msg.type === 'file' && !isVoiceMemoFile;

  const activeReactions = (msg.reactions && msg.reactions.length > 0) ? msg.reactions : (reactionsMap[msg._id] || []);
  const reactionGroups = activeReactions.reduce((acc, curr) => {
    if (!curr || !curr.emoji) return acc;
    const emojiKey = curr.emoji;
    if (!acc[emojiKey]) acc[emojiKey] = { count: 0, users: [] };
    acc[emojiKey].count += 1;
    acc[emojiKey].users.push(curr.username || "Anonymous");
    return acc;
  }, {});

  const handleCopyMessageTextContent = (e) => {
    e?.stopPropagation();
    if (msg.type !== 'text') return triggerToast?.("Media assets cannot be copied", "error");
    navigator.clipboard?.writeText(msg.message || "").then(() => triggerToast?.("Copied message text", "success"));
  };

  const handleLeftClick = (e) => {
    if (isSelectionMode && toggleSelectMessage) {
      e.stopPropagation();
      if (!isMe) return triggerToast?.("You can only bulk delete your own messages", "error");
      return toggleSelectMessage(msg._id);
    }
    if (isMediaMsg || isCurrentlyEditing) return;

    e.stopPropagation();
    openActionMenuAtMouse(e);
  };

  const handleRightClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isCurrentlyEditing) return;
    openActionMenuAtMouse(e);
  };

  const openActionMenuAtMouse = (e) => {
    setMenuCoords({ top: e.clientY, left: e.clientX });
    setShowActionMenu(true);
  };

  const formatTime = (time) => {
    if (time === undefined || time === null || isNaN(time) || !isFinite(time) || time <= 0) {
      return "0:00";
    }
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };
  return (
    <MessageItemFrame msgId={msg._id} isMe={isMe} isSame={isSame} isSelected={isSelected} isSelectionMode={isSelectionMode} toggleSelectMessage={toggleSelectMessage}>
      <div
        id={`msg-anchor-${msg._id}`}
        ref={bubbleRef}
        onClick={handleLeftClick}
        onContextMenu={handleRightClick}
        style={{
          maxWidth: "100%",
          padding: isCurrentlyEditing ? '12px 14px' : isMediaMsg ? '0px' : isVoiceMemoFile ? '10px 10px 4px 10px' : '8px 14px',
          borderRadius: isMediaMsg
            ? '8px'
            : isMe
              ? '12px 12px 2px 12px'
              : '12px 12px 12px 2px',
          background: isCurrentlyEditing ? '#ffffff' : isMe ? 'linear-gradient(135deg, #2563eb, #1d4ed8)' : '#ffffff',
          color: isMe && !isCurrentlyEditing ? '#ffffff' : '#0f172a',
          fontSize: '0.88rem',
          boxShadow: isMediaMsg ? 'none' : isMe ? '0 2px 8px rgba(37,99,235,0.15)' : '0 1px 4px rgba(15,23,42,0.04)',
          position: 'relative',
          cursor: 'pointer',
          width: isCurrentlyEditing
            ? '100%'
            : isMediaMsg
              ? '220px'
              : (isVoiceMemoFile || isDocMsg)
                ? '265px'
                : 'auto',
          transition: 'all 0.15s ease',
          boxSizing: 'border-box'
        }}
      >
        {!isCurrentlyEditing && !isMediaMsg && (
          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: isMe ? '#93c5fd' : '#2563eb', marginBottom: '4px', textAlign: 'left' }}>
            {isMe ? 'You' : msg.senderName || "Anonymous"}
          </div>
        )}

        {msg.replyTo && <ReplyQuote replyTo={msg.replyTo} isMe={isMe} currentUsername={currentUsername} />}

        {isCurrentlyEditing ? (
          <MessageEditArea msg={msg} editInput={editInput} setEditInput={setEditInput} setEditingMessageId={setEditingMessageId} triggerSaveEdit={triggerSaveEdit} />
        ) : isMediaMsg && msg.attachment ? (
          <MessageMediaPreview msg={msg} isMe={isMe} onOpenActionMenu={(eventArgs) => openActionMenuAtMouse(eventArgs)} />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 2, width: "100%" }}>
            {isVoiceMemoFile && msg.attachment ? (
              /* 🎯 FIXED: Injected a robust default baseline token fallback string so WaveSurfer never fails initialization for receivers */
              <AudioPlayer
                src={msg.attachment}
                msgId={msg._id}
                isMe={isMe}
                chatProps={chatProps}
                onDurationChange={setAudioDuration}
                avatarUrl={finalAvatarUrl}
              />

            ) : msg.type === 'file' && msg.attachment ? (
              <MessageFileDownload attachmentUrl={msg.attachment} isMe={isMe} msg={msg} />
            ) : (
              <MessageTextRender textContent={msg.message} />
            )}
          </div>

        )}
        {!isCurrentlyEditing && !isMediaMsg && (
          <div style={{ display: 'flex', marginTop: '4px' }}>
            <MessageMeta
              msg={msg}
              isMe={isMe}
              audioDuration={isVoiceMemoFile ? audioDuration : 0}
              formatTime={formatTime}
            />
          </div>
        )}
      </div>

      <MessageReactions reactionGroups={reactionGroups} isMe={isMe} />

      <MessageActionMenu
        msg={msg}
        isMe={isMe}
        isVoiceMemoFile={isVoiceMemoFile}
        menuCoords={menuCoords}
        showActionMenu={showActionMenu}
        setShowActionMenu={setShowActionMenu}
        chatProps={chatProps}
        handleCopyMessageTextContent={handleCopyMessageTextContent}
      />
    </MessageItemFrame>
  );
};
