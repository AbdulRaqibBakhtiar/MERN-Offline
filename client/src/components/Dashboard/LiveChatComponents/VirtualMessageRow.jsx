import React from 'react';
import { MessageItem } from './MessageItem';

export const VirtualMessageRow = ({
  msg,
  idx,
  user,
  chatProps,
  resolveDrawerImgUrl
}) => {
  return (
    <div
      style={{
        width: '100%',
        display: 'block',
        margin: 0,
        padding: 0
      }}
    >
      <MessageItem
        msg={msg}
        idx={idx}
        user={user}
        chatProps={chatProps}
        resolveDrawerImgUrl={resolveDrawerImgUrl}
      />
    </div>
  );
};