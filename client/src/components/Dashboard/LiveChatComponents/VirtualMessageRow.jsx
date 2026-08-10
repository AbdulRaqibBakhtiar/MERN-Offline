import React, { useEffect, useRef, useState } from 'react';
import { MessageItem } from './MessageItem';

export const VirtualMessageRow = ({ msg, idx, user, chatProps, resolveDrawerImgUrl }) => {
  const [isRendered, setIsRendered] = useState(false);
  const cellRef = useRef(null);

  useEffect(() => {
    const activeObserver = new IntersectionObserver(
      ([entry]) => {
        // Keeps element mounted if it's within 400px of the viewport to ensure smooth scrolling profiles
        setIsRendered(entry.isIntersecting);
      },
      { rootMargin: '400px 0px 400px 0px' }
    );

    if (cellRef.current) activeObserver.observe(cellRef.current);
    return () => activeObserver.disconnect();
  }, []);

  return (
    <div 
      ref={cellRef} 
      style={{ 
        minHeight: msg.type === 'image' || msg.type === 'video' ? '240px' : '65px',
        width: '100%',
        display: 'block'
      }}
    >
      {isRendered ? (
        <MessageItem 
          msg={msg} 
          idx={idx} 
          user={user} 
          chatProps={chatProps} 
          resolveDrawerImgUrl={resolveDrawerImgUrl} 
        />
      ) : (
        /* Lightweight placeholder box when off-screen to keep the scrollbar accurate */
        <div style={{ width: '100%', height: '100%' }} />
      )}
    </div>
  );
};
