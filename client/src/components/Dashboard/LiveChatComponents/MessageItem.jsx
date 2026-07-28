import React, { useState, useRef } from 'react';
import { Mic, Check } from 'lucide-react';
import { ReplyQuote } from './ReplyQuote'; 

// Layout Architecture references
import { AudioPlayer } from '../../Layout/AudioPlayer';
import { MessageMediaPreview } from '../../Layout/MessageMediaPreview';
import { MessageFileDownload } from '../../Layout/MessageFileDownload';
import { MessageTextRender } from '../../Layout/MessageTextRender';
import { MessageReactions } from '../../Layout/MessageReactions';
import { MessageActionMenu } from '../../Layout/MessageActionMenu';
import { MessageEditArea } from '../../Layout/MessageEditArea';
import { MessageItemFrame } from '../../Layout/MessageItemFrame';

export const MessageItem = ({ msg, idx, user, chatProps, resolveDrawerImgUrl }) => {
  const { 
    chatLog, reactionsMap, editingMessageId, setEditingMessageId, editInput, 
    setEditInput, triggerSaveEdit, startReply, triggerToast, 
    isSelectionMode, selectedMessageIds, toggleSelectMessage, setIsSelectionMode 
  } = chatProps;

  const [showActionMenu, setShowActionMenu] = useState(false);
  const [menuCoords, setMenuCoords] = useState({ top: 0, left: 0 });
  const [audioDuration, setAudioDuration] = useState(0);
  const bubbleRef = useRef(null);

  const currentUsername = user?.username || user?.name || "Anonymous";
  const isMe = (msg.senderId && user && String(msg.senderId) === String(user._id || user.id)) || 
               (msg.senderName && user && (msg.senderName === user.username || msg.senderName === user.name));
  const isSame = chatLog[idx - 1] && chatLog[idx - 1].senderName === msg.senderName;
  const isSelected = selectedMessageIds?.has(msg._id) || false;
  const isCurrentlyEditing = editingMessageId === msg._id;

  const isVoiceMemoFile = msg.type === 'audio' || 
    (msg.type === 'file' && (msg.attachmentType?.endsWith('.webm') || 
    (msg.attachment && msg.attachment.toLowerCase().match(/\.(mp3|wav|ogg|m4a|aac|flac)$/i))));

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
    if (msg.type !== 'text') return triggerToast?.("Media assets cannot be copied to the clipboard", "error");
    navigator.clipboard?.writeText(msg.message || "")
      .then(() => triggerToast?.("Copied to system clipboard", "success"))
      .catch(() => triggerToast?.("Clipboard permission restricted", "error"));
  };

  const triggerMenuOverlay = (targetElement) => {
    if (targetElement) {
      const rect = targetElement.getBoundingClientRect();
      const shouldFlip = (window.innerHeight - rect.bottom) < 160;
      setMenuCoords({ 
        top: shouldFlip ? rect.top + window.scrollY - 165 : rect.bottom + window.scrollY + 6, 
        left: isMe ? Math.max(16, rect.right + window.scrollX - 200) : rect.left + window.scrollX
      });
      setShowActionMenu(!showActionMenu);
    }
  };

  const handleBubbleClick = (e) => {
    e.stopPropagation();
    if (isSelectionMode && toggleSelectMessage) {
      if (!isMe) return triggerToast?.("You can only bulk delete your own messages", "error");
      return toggleSelectMessage(msg._id);
    }
    if (isCurrentlyEditing) return;
    if (msg.type === 'image' || msg.type === 'video') return; 
    triggerMenuOverlay(bubbleRef.current);
  };

  // Avatar Resolution Engine
  const livePeerContact = !isMe && chatProps?.personalContacts?.find(c => String(c.id) === String(msg.senderId));
  const rawAvatarField = msg.senderAvatar || msg.avatar || (livePeerContact && (livePeerContact.avatar || livePeerContact.profileImage)) || (isMe && user && (user.profileImage || user.avatar)) || (msg.sender && (msg.sender.profileImage || msg.sender.avatar)) || msg.profileImage;
  const finalAvatarUrl = resolveDrawerImgUrl ? resolveDrawerImgUrl(rawAvatarField) : null;
  return (
    <MessageItemFrame msgId={msg._id} isMe={isMe} isSame={isSame} isSelected={isSelected} isSelectionMode={isSelectionMode} toggleSelectMessage={toggleSelectMessage}>
      <div 
        ref={bubbleRef} 
        onClick={handleBubbleClick} 
        style={{ maxWidth: "100%", padding: isCurrentlyEditing ? '12px 14px' : (msg.type === 'image' || msg.type === 'video') ? '0px' : isVoiceMemoFile ? '10px 10px 4px 10px' : '8px 14px', borderRadius: isMe ? '12px 12px 2px 12px' : '12px 12px 12px 2px', background: isCurrentlyEditing ? '#ffffff' : (msg.type === 'image' || msg.type === 'video') ? 'transparent' : isMe ? 'linear-gradient(135deg, #2563eb, #1d4ed8)' : '#ffffff', color: isMe && !isCurrentlyEditing ? '#ffffff' : '#0f172a', fontSize: '0.88rem', boxShadow: (msg.type === 'image' || msg.type === 'video') ? 'none' : isMe ? '0 2px 8px rgba(37,99,235,0.15)' : '0 1px 4px rgba(15,23,42,0.04)', position: 'relative', cursor: 'pointer', width: isCurrentlyEditing ? '100%' : (isVoiceMemoFile || msg.type === 'video' || msg.type === 'image') ? '265px' : 'auto', transition: 'all 0.15s ease' }}
      >
        {/* Header Block Condition */}
        {!isCurrentlyEditing && msg.type !== 'image' && msg.type !== 'video' && (
          isVoiceMemoFile ? (
            /* 🎯 VOICE MESSAGES ONLY: Displays a big profile avatar paired with user metadata */
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', justifyContent: 'flex-start' }}>
              {finalAvatarUrl && (
                <img 
                  src={finalAvatarUrl} 
                  alt="" 
                  style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover', background: 'rgba(255,255,255,0.2)', display: 'block', flexShrink: 0, border: '1px solid rgba(255,255,255,0.1)' }} 
                />
              )}
              <div style={{ fontSize: '0.78rem', fontWeight: 800, color: isMe ? '#93c5fd' : '#2563eb', textAlign: 'left' }}>
                {isMe ? 'You' : msg.senderName || "Anonymous"}
              </div>
            </div>
          ) : (
            /* STANDARD TEXT MESSAGES: Minimal header text row without any user avatars */
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: isMe ? '#93c5fd' : '#2563eb', marginBottom: '4px', textAlign: 'left' }}>
              {isMe ? 'You' : msg.senderName || "Anonymous"}
            </div>
          )
        )}

        {msg.type !== 'image' && <ReplyQuote replyTo={msg.replyTo} isMe={isMe} currentUsername={currentUsername} />}

        {isCurrentlyEditing ? (
          <MessageEditArea msg={msg} editInput={editInput} setEditInput={setEditInput} setEditingMessageId={setEditingMessageId} triggerSaveEdit={triggerSaveEdit} />
        ) : (msg.type === 'image' || msg.type === 'video') && msg.attachment ? (
          <MessageMediaPreview msg={msg} isMe={isMe} onMenuTrigger={() => triggerMenuOverlay(bubbleRef.current)} />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 2, width: "100%" }}>
            {isVoiceMemoFile && msg.attachment ? (
              <AudioPlayer src={msg.attachment} msgId={msg._id} isMe={isMe} chatProps={chatProps} onDurationChange={setAudioDuration} />
            ) : msg.type === 'file' && msg.attachment ? (
              <MessageFileDownload attachmentUrl={msg.attachment} isMe={isMe} />
            ) : (
              <MessageTextRender textContent={msg.message} />
            )}

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "6px", fontSize: "0.64rem", color: isMe ? "rgba(255,255,255,0.7)" : "#94a3b8" }}>
              {isVoiceMemoFile ? (
                <div style={{ display: "flex", alignItems: "center", gap: '3px' }}><Mic size={11} strokeWidth={2.2} /><span>{(!audioDuration || isNaN(audioDuration)) ? "0:00" : `${Math.floor(audioDuration / 60)}:${Math.floor(audioDuration % 60) < 10 ? "0" : ""}${Math.floor(audioDuration % 60)}`}</span></div>
              ) : <div />}
              
              <div style={{ display: "flex", alignItems: "center", gap: '4px', marginLeft: "auto" }}>
                <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                {isMe && (
                  <span style={{ display: 'inline-flex' }}>
                    {msg.readBy?.length > 0 ? (
                      <><Check size={12} strokeWidth={3} color="#93c5fd" /><Check size={12} strokeWidth={3} color="#93c5fd" style={{ marginLeft: -6 }} /></>
                    ) : msg.deliveredTo?.length > 0 ? (
                      <><Check size={12} strokeWidth={3} /><Check size={12} strokeWidth={3} style={{ marginLeft: -6 }} /></>
                    ) : <Check size={12} strokeWidth={3} />}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <MessageReactions reactionGroups={reactionGroups} isMe={isMe} />
      <MessageActionMenu msg={msg} isMe={isMe} isVoiceMemoFile={isVoiceMemoFile} menuCoords={menuCoords} showActionMenu={showActionMenu} setShowActionMenu={setShowActionMenu} chatProps={chatProps} handleCopyMessageTextContent={handleCopyMessageTextContent} />
    </MessageItemFrame>
  );
};
