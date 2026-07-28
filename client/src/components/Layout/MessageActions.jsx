import React from "react";
import { Check, Edit2, Copy, CornerUpLeft, Trash2 } from "lucide-react";

export const MessageActions = ({
  msg,
  isMe,
  REACTION_OPTIONS,
  triggerAddReaction,
  startReply,
  handleCopyMessageTextContent,
  setIsSelectionMode,
  toggleSelectMessage,
  setEditingMessageId,
  setEditInput,
  triggerDelete,
  setShowActionMenu
}) => {

  return (
    <>
      <div style={{
        display: 'flex',
        gap: '8px',
        padding: '6px 10px',
        borderBottom: '1px solid #f1f5e9',
        justifyContent: 'space-between'
      }}>
        {REACTION_OPTIONS.map(emoji => (
          <button
            key={emoji}
            onClick={() => {
              triggerAddReaction(msg._id, emoji);
              setShowActionMenu(false);
            }}
            style={{
              background:'none',
              border:'none',
              fontSize:'1.3rem',
              cursor:'pointer'
            }}
          >
            {emoji}
          </button>
        ))}
      </div>


      <button
        onClick={() => {
          startReply(msg);
          setShowActionMenu(false);
        }}
      >
        <CornerUpLeft size={14}/>
        Reply
      </button>


      {msg.type === 'text' && (
        <button
          onClick={(e)=>{
            handleCopyMessageTextContent(e);
            setShowActionMenu(false);
          }}
        >
          <Copy size={14}/>
          Copy Message Content
        </button>
      )}


      {isMe && (
        <button
          onClick={()=>{
            setIsSelectionMode(true);
            toggleSelectMessage(msg._id);
            setShowActionMenu(false);
          }}
        >
          <Check size={14}/>
          Select Multiple Messages
        </button>
      )}


      {isMe && msg.type === 'text' && (
        <button
          onClick={()=>{
            setEditingMessageId(msg._id);
            setEditInput(msg.message || '');
            setShowActionMenu(false);
          }}
        >
          <Edit2 size={14}/>
          Edit Message
        </button>
      )}


      {isMe && (
        <button
          onClick={()=>{
            triggerDelete(msg._id);
            setShowActionMenu(false);
          }}
        >
          <Trash2 size={14}/>
          Delete
        </button>
      )}

    </>
  );
};