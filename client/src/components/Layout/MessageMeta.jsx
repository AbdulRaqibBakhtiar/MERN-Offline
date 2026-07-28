import React from "react";

export const MessageMeta = ({ msg, isMe, audioDuration, formatTime }) => {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "4px",
        marginLeft: "auto",
        fontSize: "0.64rem",
        color: isMe ? "rgba(255,255,255,0.7)" : "#94a3b8"
      }}
    >

      {audioDuration > 0 && (
        <span>
          🎤 {formatTime(audioDuration)}
        </span>
      )}

      <span>
        {new Date(msg.createdAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit"
        })}
      </span>

      {isMe && (
        <span style={{ display: "inline-flex" }}>
          {msg.readBy?.length > 0 ? (
            <>
              <span style={{color:"#93c5fd"}}>✓</span>
              <span style={{color:"#93c5fd", marginLeft:"-4px"}}>✓</span>
            </>
          ) : msg.deliveredTo?.length > 0 || msg.delivered ? (
            <>
              <span>✓</span>
              <span style={{marginLeft:"-4px"}}>✓</span>
            </>
          ) : (
            <span>✓</span>
          )}
        </span>
      )}

    </div>
  );
};