import React, { useState } from "react";
import { PremiumVideoPlayer } from "./PremiumVideoPlayer";
import { ImagePreview } from "./ImagePreview";

export const MediaRenderer = ({ msg, isMe }) => {
  const [showPreview, setShowPreview] = useState(false);

  if (!msg?.attachment) return null;


  if (msg.type === "image") {
    return (
      <>
        <img
          src={msg.attachment}
          alt="Attachment"
          onClick={(e) => {
            e.stopPropagation();
            setShowPreview(true);
          }}
          style={{
            width: "265px",
            height: "265px",
            objectFit: "cover",
            display: "block",
            cursor: "zoom-in",
            borderRadius: isMe
              ? "16px 16px 4px 16px"
              : "16px 16px 16px 4px"
          }}
        />

        {showPreview && (
          <ImagePreview
            src={msg.attachment}
            onClose={() => setShowPreview(false)}
          />
        )}
      </>
    );
  }


  if (msg.type === "video") {
    return (
      <div
        style={{
          width: "265px",
          height: "265px",
          overflow: "hidden",
          borderRadius: isMe
            ? "16px 16px 4px 16px"
            : "16px 16px 16px 4px",
          background: "#000"
        }}
      >
        <PremiumVideoPlayer src={msg.attachment} />
      </div>
    );
  }


  return null;
};