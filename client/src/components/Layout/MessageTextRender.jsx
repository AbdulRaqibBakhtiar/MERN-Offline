import React from 'react';

export const MessageTextRender = ({ textContent }) => {
  return (
    <span style={{ display: "block", lineHeight: 1.45, whiteSpace: "pre-wrap", overflowWrap: "break-word", textAlign: 'left' }}>
      {textContent}
    </span>
  );
};
