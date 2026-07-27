import { useState, useCallback } from 'react';

export const useMessageReply = () => {
  const [replyingMessage, setReplyingMessage] = useState(null);

  const startReply = useCallback((msg) => {
    if (!msg) return;
    setReplyingMessage({
      _id: msg._id,
      message: msg.type === 'text' ? msg.message : `[${msg.type || 'Attachment'}]`,
      senderName: msg.senderName,
      type: msg.type
    });
  }, []);

  const cancelReply = useCallback(() => {
    setReplyingMessage(null);
  }, []);

  return {
    replyingMessage,
    setReplyingMessage,
    startReply,
    cancelReply
  };
};
