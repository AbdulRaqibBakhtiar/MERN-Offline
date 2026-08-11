import React, { useState } from 'react';
import { ImagePreview } from '../../Layout/ImagePreview';
import { MessageMeta } from '../../Layout/MessageMeta';
import { MessageReactions } from '../../Layout/MessageReactions';
import { MessageActionMenu } from '../../Layout/MessageActionMenu';

export const MultiImageMessage = ({
    messages = [],
    isMe,
    chatProps
}) => {
    const [showActionMenu, setShowActionMenu] =
        useState(false);

    const [menuCoords, setMenuCoords] = useState({
        top: 0,
        left: 0
    });

    const [actionMessage, setActionMessage] =
        useState(null);

    /*
     * =========================================================
     * CHAT PROPS
     * =========================================================
     */

    const {
        isSelectionMode,
        selectedMessageIds,
        toggleSelectMessage,
        triggerToast
    } = chatProps || {};

    if (!messages.length) return null;

    /*
     * =========================================================
     * IMAGE MESSAGES
     * =========================================================
     */

    const imageMessages = messages.filter(
        msg =>
            msg?.attachment &&
            msg?.type === 'image'
    );

    if (!imageMessages.length) return null;

    const visibleMessages =
        imageMessages.slice(0, 4);

    const extraCount =
        Math.max(
            0,
            imageMessages.length - 4
        );

    /*
     * =========================================================
     * COLLAGE SELECTION
     *
     * The entire collage is treated as ONE selectable unit.
     *
     * Internally we select all underlying message IDs so the
     * existing bulk-delete logic continues to work.
     * =========================================================
     */

    const areAllGroupMessagesSelected =
        imageMessages.length > 0 &&
        imageMessages.every(
            msg =>
                msg?._id &&
                selectedMessageIds?.has(
                    msg._id
                )
        );

    const isAnyGroupMessageSelected =
        imageMessages.some(
            msg =>
                msg?._id &&
                selectedMessageIds?.has(
                    msg._id
                )
        );

    const isCollageSelected =
        areAllGroupMessagesSelected ||
        isAnyGroupMessageSelected;

    const handleCollageClick = (e) => {
        /*
         * Selection mode gets first priority.
         */
        if (isSelectionMode) {
            e.preventDefault();
            e.stopPropagation();

            if (!toggleSelectMessage) {
                return;
            }

            /*
             * Same restriction as MessageItem.
             */
            if (!isMe) {
                triggerToast?.(
                    "You can only bulk delete your own messages",
                    "error"
                );

                return;
            }

            /*
             * If the entire collage is selected,
             * deselect every underlying message.
             */
            if (areAllGroupMessagesSelected) {
                imageMessages.forEach(msg => {
                    if (msg?._id) {
                        toggleSelectMessage(
                            msg._id
                        );
                    }
                });

                return;
            }

            /*
             * Otherwise select the entire collage.
             *
             * This also handles the case where some,
             * but not all, images were already selected.
             */
            imageMessages.forEach(msg => {
                if (
                    msg?._id &&
                    !selectedMessageIds?.has(
                        msg._id
                    )
                ) {
                    toggleSelectMessage(
                        msg._id
                    );
                }
            });

            return;
        }

        /*
         * Normal mode:
         *
         * Do nothing here.
         *
         * ImagePreview receives the click from its own
         * thumbnail and opens the viewer.
         */
    };

    /*
     * =========================================================
     * ACTION MENU
     * =========================================================
     */

    const openActionMenu = (e, msg) => {
        e.preventDefault();
        e.stopPropagation();

        if (isSelectionMode) {
            return;
        }

        setActionMessage(msg);

        setMenuCoords({
            top: e.clientY,
            left: e.clientX
        });

        setShowActionMenu(true);
    };

    /*
     * =========================================================
     * REACTION GROUPS
     * =========================================================
     */

    const getReactionGroups = (msg) => {
        const reactions =
            (
                msg?.reactions &&
                msg.reactions.length > 0
            )
                ? msg.reactions
                : (
                    chatProps?.reactionsMap?.[
                        msg?._id
                    ] || []
                );

        return reactions.reduce(
            (acc, curr) => {
                if (
                    !curr ||
                    !curr.emoji
                ) {
                    return acc;
                }

                const emoji =
                    curr.emoji;

                if (!acc[emoji]) {
                    acc[emoji] = {
                        count: 0,
                        users: []
                    };
                }

                acc[emoji].count += 1;

                acc[emoji].users.push(
                    curr.username ||
                    'Anonymous'
                );

                return acc;
            },
            {}
        );
    };

    /*
     * =========================================================
     * GRID STYLE
     * =========================================================
     */

    const getGridStyle = () => {
        const count =
            visibleMessages.length;

        if (count === 1) {
            return {
                display: 'grid',
                gridTemplateColumns:
                    '1fr',
                gridTemplateRows:
                    'auto',
                gap: '2px'
            };
        }

        if (count === 2) {
            return {
                display: 'grid',
                gridTemplateColumns:
                    '1fr 1fr',
                gridTemplateRows:
                    '1fr',
                gap: '2px',
                aspectRatio: '2 / 1'
            };
        }

        if (count === 3) {
            return {
                display: 'grid',
                gridTemplateColumns:
                    '1fr 1fr',
                gridTemplateRows:
                    '1fr 1fr',
                gap: '2px',
                aspectRatio: '1 / 1'
            };
        }

        return {
            display: 'grid',
            gridTemplateColumns:
                '1fr 1fr',
            gridTemplateRows:
                '1fr 1fr',
            gap: '2px',
            aspectRatio: '1 / 1'
        };
    };

    /*
     * =========================================================
     * IMAGE GALLERY DATA
     * =========================================================
     */

    const galleryImages =
        imageMessages.map(image => ({
            url: image.attachment,

            name:
                image.message ||
                'Image',

            message: image,

            reactions:
                getReactionGroups(image)
        }));

    /*
     * =========================================================
     * RENDER
     * =========================================================
     */

    return (
        <>
            {/* =================================================
                COLLAGE
            ================================================= */}

            <div
                onClick={handleCollageClick}
                onContextMenu={(e) => {
                    /*
                     * Right click anywhere in the collage
                     * uses the first message for the action menu.
                     */
                    openActionMenu(
                        e,
                        imageMessages[0]
                    );
                }}
                style={{
                    position: 'relative',
                    width: '220px',
                    maxWidth: '100%',
                    borderRadius: '8px',
                    overflow: 'visible',
                    background: '#e5e7eb',

                    /*
                     * ONE selection state for the entire
                     * collage.
                     */
                    outline:
                        isCollageSelected
                            ? '3px solid #2563eb'
                            : 'none',

                    outlineOffset:
                        '2px',

                    cursor:
                        isSelectionMode
                            ? 'pointer'
                            : 'default',

                    transition:
                        'outline 0.15s ease'
                }}
            >
                {/* =============================================
                    COLLAGE GRID
                ============================================== */}

                <div
                    style={{
                        ...getGridStyle(),

                        /*
                         * When selection mode is active,
                         * the grid itself must not swallow the
                         * click before the collage receives it.
                         */
                        pointerEvents:
                            isSelectionMode
                                ? 'none'
                                : 'auto'
                    }}
                >
                    {visibleMessages.map(
                        (msg, index) => {
                            const isLastVisible =
                                index ===
                                visibleMessages.length -
                                1;

                            const showMoreOverlay =
                                isLastVisible &&
                                extraCount > 0;

                            const reactionGroups =
                                getReactionGroups(
                                    msg
                                );

                            return (
                                <div
                                    key={
                                        msg._id ||
                                        `${msg.attachment}-${index}`
                                    }
                                    onContextMenu={(e) =>
                                        openActionMenu(
                                            e,
                                            msg
                                        )
                                    }
                                    style={{
                                        position:
                                            'relative',
                                        minWidth: 0,
                                        minHeight: 0,
                                        overflow:
                                            'hidden',
                                        background:
                                            '#e5e7eb',

                                        borderRadius:
                                            index === 0
                                                ? '8px 0 0 0'
                                                : index === 1
                                                    ? visibleMessages.length <= 2
                                                        ? '0 8px 8px 0'
                                                        : '0 8px 0 0'
                                                    : index === 2
                                                        ? '0 0 0 8px'
                                                        : '0 0 8px 0',

                                        cursor:
                                            isSelectionMode
                                                ? 'pointer'
                                                : 'pointer'
                                    }}
                                >
                                    {/* IMAGE */}

                                    <ImagePreview
                                        src={
                                            msg.attachment
                                        }
                                        alt={
                                            msg.message ||
                                            'Image'
                                        }
                                        images={
                                            galleryImages
                                        }
                                        initialIndex={
                                            index
                                        }
                                    />

                                    {/* =================================
                                        REACTION
                                    ================================== */}

                                    {!showMoreOverlay && (
                                        <div
                                            style={{
                                                position:
                                                    'absolute',
                                                left: '5px',
                                                bottom: '5px',
                                                zIndex: 9,

                                                /*
                                                 * Since selection
                                                 * mode sets the
                                                 * grid to
                                                 * pointerEvents
                                                 * none, this is
                                                 * purely visual.
                                                 */
                                                pointerEvents:
                                                    'none'
                                            }}
                                        >
                                            <MessageReactions
                                                reactionGroups={
                                                    reactionGroups
                                                }
                                                isMe={
                                                    isMe
                                                }
                                            />
                                        </div>
                                    )}

                                    {/* =================================
                                        +N OVERLAY
                                    ================================== */}

                                    {showMoreOverlay && (
                                        <div
                                            style={{
                                                position:
                                                    'absolute',
                                                inset: 0,
                                                background:
                                                    'rgba(0,0,0,0.48)',
                                                display:
                                                    'flex',
                                                alignItems:
                                                    'center',
                                                justifyContent:
                                                    'center',
                                                color:
                                                    '#ffffff',
                                                fontSize:
                                                    '1.5rem',
                                                fontWeight:
                                                    700,
                                                zIndex:
                                                    7,
                                                pointerEvents:
                                                    'none'
                                            }}
                                        >
                                            +{extraCount}
                                        </div>
                                    )}
                                </div>
                            );
                        }
                    )}
                </div>

                {/* =============================================
                    ONE SELECTION CHECKMARK
                ============================================== */}

                {isSelectionMode && (
                    <div
                        style={{
                            position:
                                'absolute',
                            top: '8px',
                            right: '8px',
                            width: '24px',
                            height: '24px',
                            borderRadius:
                                '50%',
                            border:
                                isCollageSelected
                                    ? '2px solid #2563eb'
                                    : '2px solid rgba(255,255,255,0.95)',
                            background:
                                isCollageSelected
                                    ? '#2563eb'
                                    : 'rgba(0,0,0,0.35)',
                            display: 'flex',
                            alignItems:
                                'center',
                            justifyContent:
                                'center',
                            zIndex: 30,
                            pointerEvents:
                                'none',
                            boxShadow:
                                '0 1px 5px rgba(0,0,0,0.35)'
                        }}
                    >
                        {isCollageSelected && (
                            <span
                                style={{
                                    color:
                                        '#ffffff',
                                    fontSize:
                                        '15px',
                                    lineHeight: 1,
                                    fontWeight:
                                        800
                                }}
                            >
                                ✓
                            </span>
                        )}
                    </div>
                )}

                {/* =============================================
                    ONE META FOR WHOLE COLLAGE
                ============================================== */}

                {imageMessages.length > 0 && (
                    <div
                        style={{
                            position:
                                'absolute',
                            right: '5px',
                            bottom: '5px',
                            zIndex: 20,
                            padding:
                                '2px 5px',
                            borderRadius:
                                '8px',
                            background:
                                'rgba(0,0,0,0.42)',
                            backdropFilter:
                                'blur(3px)',
                            pointerEvents:
                                'none'
                        }}
                    >
                        <MessageMeta
                            msg={
                                imageMessages[
                                    imageMessages.length -
                                    1
                                ]
                            }
                            isMe={isMe}
                            audioDuration={0}
                            formatTime={() => ''}
                            overlay
                        />
                    </div>
                )}
            </div>

            {/* =================================================
                ACTION MENU
            ================================================= */}

            {showActionMenu && (
                <MessageActionMenu
                    msg={
                        actionMessage
                    }
                    isMe={isMe}
                    isVoiceMemoFile={
                        false
                    }
                    menuCoords={
                        menuCoords
                    }
                    showActionMenu={
                        showActionMenu
                    }
                    setShowActionMenu={
                        setShowActionMenu
                    }
                    chatProps={
                        chatProps
                    }
                    handleCopyMessageTextContent={() => {}}
                />
            )}
        </>
    );
};