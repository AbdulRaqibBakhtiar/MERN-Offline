import React from "react";

export const ReactionBadge = ({
  reactionGroups,
  hoveredBadgeEmoji,
  setHoveredBadgeEmoji,
  isMe
}) => {

  if (!reactionGroups || Object.keys(reactionGroups).length === 0) {
    return null;
  }

  return (
    <div
      style={{
        display: 'flex',
        gap: '3px',
        marginTop: '-7px',
        marginBottom: '2px',
        alignSelf: isMe ? 'flex-end' : 'flex-start',
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '20px',
        padding: '2px 7px',
        boxShadow: '0 2px 6px rgba(15,23,42,0.08)',
        zIndex: 10,
        cursor: 'pointer'
      }}
    >

      {Object.entries(reactionGroups).map(([emo, data]) => (
        <span
          key={emo}
          onMouseEnter={() => setHoveredBadgeEmoji(emo)}
          onMouseLeave={() => setHoveredBadgeEmoji(null)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '2px',
            position: 'relative',
            fontSize: '0.78rem'
          }}
        >

          <span>{emo}</span>

          {data.count > 1 && (
            <span
              style={{
                fontSize: '0.66rem',
                color: '#64748b',
                fontWeight: 700
              }}
            >
              {data.count}
            </span>
          )}

          {hoveredBadgeEmoji === emo && (
            <div
              style={{
                position: 'absolute',
                bottom: '135%',
                [isMe ? 'right' : 'left']: '0px',
                background: '#0f172a',
                color: '#ffffff',
                padding: '6px 10px',
                borderRadius: '8px',
                fontSize: '0.7rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
                boxShadow: '0 4px 12px rgba(15,23,42,0.15)',
                zIndex: 99999,
                minWidth: '110px',
                pointerEvents: 'none'
              }}
            >

              <span
                style={{
                  fontWeight: 700,
                  borderBottom: '1px solid rgba(255,255,255,0.15)',
                  paddingBottom: '2px',
                  marginBottom: '2px',
                  textTransform: 'uppercase',
                  color: '#94a3b8',
                  fontSize: '0.58rem'
                }}
              >
                Reactions
              </span>

              {data.users.map((name, i) => (
                <span
                  key={i}
                  style={{
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    fontWeight: 500,
                    display: 'block'
                  }}
                >
                  👤 {name}
                </span>
              ))}

            </div>
          )}

        </span>
      ))}

    </div>
  );
};