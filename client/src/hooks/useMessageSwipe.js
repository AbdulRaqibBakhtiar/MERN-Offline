import { useState, useRef } from 'react';

export const useMessageSwipe = (isMe, isCurrentlyEditing, isSelectionMode, startReply, msg) => {
  const [swipeTranslation, setSwipeTranslation] = useState(0);
  const [isSwipingActive, setIsSwipingActive] = useState(false);
  const touchStartCoordinatesRef = useRef({ x: 0, y: 0 });
  const swipeDeltaRef = useRef(0);

  const handleTouchStart = (e) => {
    if (isCurrentlyEditing || isSelectionMode) return;
    const touch = e.touches[0];
    touchStartCoordinatesRef.current = { x: touch.clientX, y: touch.clientY };
    setIsSwipingActive(true);
    swipeDeltaRef.current = 0;
  };

  const handleTouchMove = (e) => {
    if (!isSwipingActive || isSelectionMode) return;
    const touch = e.touches[0];
    const diffX = touch.clientX - touchStartCoordinatesRef.current.x;
    const diffY = touch.clientY - touchStartCoordinatesRef.current.y;

    if (Math.abs(diffX) > Math.abs(diffY)) {
      if (!isMe && diffX > 0) {
        e.preventDefault();
        setSwipeTranslation(Math.min(diffX * 0.4, 65));
        swipeDeltaRef.current = diffX;
      } else if (isMe && diffX < 0) {
        e.preventDefault();
        setSwipeTranslation(Math.max(diffX * 0.4, -65));
        swipeDeltaRef.current = diffX;
      }
    }
  };

  const handleTouchEnd = () => {
    if (!isSwipingActive || isSelectionMode) return;
    setIsSwipingActive(false);
    if (Math.abs(swipeDeltaRef.current) > 55 && startReply) {
      startReply(msg);
      if (navigator.vibrate) navigator.vibrate(12);
    }
    setSwipeTranslation(0);
    swipeDeltaRef.current = 0;
  };

  return { swipeTranslation, isSwipingActive, handleTouchStart, handleTouchMove, handleTouchEnd };
};
