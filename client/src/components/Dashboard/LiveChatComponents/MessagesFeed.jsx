import React from 'react';
import { VirtualMessageRow } from './VirtualMessageRow';
import { MultiImageMessage } from './MultiImageMessage';

export const MessagesFeed = ({
  chatProps,
  user,
  resolveDrawerImgUrl
}) => {
  const {
    chatLog = [],
    typingUser,
    messageEndRef,
    isSelectionMode
  } = chatProps || {};

  const renderMessages = [];

  for (let i = 0; i < chatLog.length; i++) {
    const msg = chatLog[i];

    const isImage =
      msg?.type === 'image' &&
      !!msg?.attachment;

    if (!isImage) {
      renderMessages.push({
        type: 'single',
        msg,
        idx: i
      });

      continue;
    }

    // Find all immediately-following images
    // belonging to the same sender.
    const imageGroup = [msg];

    let nextIndex = i + 1;

    while (nextIndex < chatLog.length) {
      const nextMsg = chatLog[nextIndex];

      const nextIsImage =
        nextMsg?.type === 'image' &&
        !!nextMsg?.attachment;

      const sameSender =
        String(nextMsg?.senderId || '') ===
        String(msg?.senderId || '');

      const previousMessage =
        imageGroup[imageGroup.length - 1];

      const previousTime =
        new Date(previousMessage?.createdAt).getTime();

      const nextTime =
        new Date(nextMsg?.createdAt).getTime();

      const timeDifference =
        Math.abs(nextTime - previousTime);

      const withinTenSeconds =
        Number.isFinite(previousTime) &&
        Number.isFinite(nextTime) &&
        timeDifference <= 10 * 1000;

      if (
        !nextIsImage ||
        !sameSender ||
        !withinTenSeconds
      ) {
        break;
      }

      imageGroup.push(nextMsg);
      nextIndex++;
    }

    if (imageGroup.length > 1) {
      renderMessages.push({
        type: 'image-group',
        messages: imageGroup,
        idx: i
      });

      i = nextIndex - 1;
    } else {
      renderMessages.push({
        type: 'single',
        msg,
        idx: i
      });
    }
  }

  return (
    <div
      style={{
        flex: 1,
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg-main, #f8fafc)',
        paddingBottom: isSelectionMode ? '74px' : '16px',
        userSelect: isSelectionMode ? 'none' : 'text',
        WebkitUserSelect: isSelectionMode ? 'none' : 'text',
        position: 'relative'
      }}
    >

      {renderMessages.map((item, renderIndex) => {
        if (item.type === 'image-group') {
          const firstMessage = item.messages[0];

          const isMe =
            (
              firstMessage.senderId &&
              user &&
              String(firstMessage.senderId) ===
              String(user._id || user.id)
            ) ||
            (
              firstMessage.senderName &&
              user &&
              (
                firstMessage.senderName === user.username ||
                firstMessage.senderName === user.name
              )
            );

          return (
            <div
              key={
                `image-group-${firstMessage._id || renderIndex
                }`
              }
              style={{
                width: '100%',
                display: 'flex',
                justifyContent: isMe
                  ? 'flex-end'
                  : 'flex-start',
                marginBottom: '6px',
                padding: 0,
                pointerEvents: 'auto'
              }}
            >
              <MultiImageMessage
                messages={item.messages}
                isMe={isMe}
                chatProps={chatProps}
              />
            </div>
          );
        }

        /*
         * NORMAL SINGLE MESSAGE
         */
        return (
          <div
            key={
              item.msg?._id ||
              `log-${item.idx}-${item.msg?.createdAt || renderIndex}`
            }
            style={{
              width: '100%',
              pointerEvents: 'auto'
            }}
          >
            <VirtualMessageRow
              msg={item.msg}
              idx={item.idx}
              user={user}
              chatProps={chatProps}
              resolveDrawerImgUrl={resolveDrawerImgUrl}
            />
          </div>
        );
      })}

      {/* Beautiful Typing Indicator */}
      {typingUser && !isSelectionMode && (() => {
        // Find the latest message from the person who is typing.
        // This lets us reuse whatever avatar field your messages already contain.
        const typingName =
          typeof typingUser === 'string'
            ? typingUser
            : typingUser?.username ||
            typingUser?.name ||
            typingUser?.senderName ||
            'Someone';

        const typingId =
          typeof typingUser === 'object'
            ? typingUser?._id ||
            typingUser?.id ||
            typingUser?.senderId
            : null;

        const typingMessage = [...chatLog]
          .reverse()
          .find((m) => {
            const sameName =
              m?.senderName === typingName ||
              m?.sender?.username === typingName ||
              m?.sender?.name === typingName;

            const sameId =
              typingId &&
              String(m?.senderId || m?.sender?._id || m?.sender?.id) ===
              String(typingId);

            return sameName || sameId;
          });

        // Try the common avatar fields used by the message objects.
        const avatar =
          (typeof typingUser === 'object' &&
            (
              typingUser?.avatar ||
              typingUser?.profileImage ||
              typingUser?.profilePicture ||
              typingUser?.photo ||
              typingUser?.image
            )) ||
          typingMessage?.senderAvatar ||
          typingMessage?.avatar ||
          typingMessage?.sender?.avatar ||
          typingMessage?.sender?.profileImage ||
          typingMessage?.sender?.profilePicture ||
          typingMessage?.sender?.photo ||
          typingMessage?.sender?.image ||
          null;

        const resolvedAvatar = avatar
          ? (
            typeof resolveDrawerImgUrl === 'function'
              ? resolveDrawerImgUrl(avatar)
              : avatar
          )
          : null;

        const initials = typingName
          .trim()
          .split(/\s+/)
          .map((part) => part[0])
          .join('')
          .slice(0, 2)
          .toUpperCase();

        return (
          <>
            <style>
              {`
          @keyframes typingAvatarPulse {
            0%, 100% {
              transform: scale(1);
              box-shadow: 0 0 0 0 rgba(37, 99, 235, 0);
            }
            50% {
              transform: scale(1.04);
              box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.08);
            }
          }

          @keyframes typingDotBounce {
            0%, 60%, 100% {
              transform: translateY(0);
              opacity: 0.45;
            }
            30% {
              transform: translateY(-3px);
              opacity: 1;
            }
          }

          @keyframes typingIndicatorAppear {
            from {
              opacity: 0;
              transform: translateY(5px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
            </style>

            <div
              style={{
                display: 'flex',
                alignItems: 'flex-end',
                gap: '8px',
                marginTop: '10px',
                paddingLeft: '2px',
                animation: 'typingIndicatorAppear 0.2s ease-out',
                pointerEvents: 'none'
              }}
            >
              {/* Avatar */}
              <div
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background:
                    'linear-gradient(135deg, #dbeafe, #bfdbfe)',
                  color: '#2563eb',
                  fontSize: '0.62rem',
                  fontWeight: 700,
                  border: '1px solid rgba(37, 99, 235, 0.12)',
                  animation: 'typingAvatarPulse 2s infinite ease-in-out'
                }}
              >
                {resolvedAvatar ? (
                  <img
                    src={resolvedAvatar}
                    alt=""
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block'
                    }}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  initials
                )}
              </div>

              {/* Name + typing bubble */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  gap: '3px'
                }}
              >
                <span
                  style={{
                    fontSize: '0.62rem',
                    color: '#64748b',
                    fontWeight: 600,
                    lineHeight: 1
                  }}
                >
                  {typingName}
                </span>

                <div
                  style={{
                    height: '28px',
                    minWidth: '48px',
                    padding: '0 11px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    background: '#e2e8f0',
                    border: '1px solid rgba(148, 163, 184, 0.15)',
                    borderRadius: '14px 14px 14px 4px',
                    boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)'
                  }}
                >
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      style={{
                        width: '5px',
                        height: '5px',
                        borderRadius: '50%',
                        background: '#64748b',
                        animation:
                          'typingDotBounce 1.15s infinite ease-in-out',
                        animationDelay: `${i * 0.16}s`
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </>
        );
      })()}

      <div ref={messageEndRef} />
    </div>
  );
};