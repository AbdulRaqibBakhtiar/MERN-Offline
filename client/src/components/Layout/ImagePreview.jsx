import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
    X,
    ZoomIn,
    ZoomOut,
    RotateCw,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';

import { MessageReactions } from './MessageReactions';

export const ImagePreview = ({
    src,
    alt = "Media Preview",
    images = [],
    initialIndex = 0
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({
        x: 0,
        y: 0
    });
    const [rotation, setRotation] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(initialIndex);

    const dragStartRef = useRef({
        x: 0,
        y: 0
    });

    const viewerRef = useRef(null);

    const hasGallery = images.length > 1;

    /*
     * ---------------------------------------------------------
     * CURRENT IMAGE
     * ---------------------------------------------------------
     */

    const currentImage = hasGallery
        ? images[currentIndex]
        : {
            url: src,
            name: alt
        };


    const currentReactionGroups =
        currentImage?.reactions || {};

    const hasReactions =
        Object.keys(currentReactionGroups).length > 0;

    useEffect(() => {
        if (!isOpen) return;

        document.body.style.overflow = 'hidden';

        const handleGlobalEsc = (e) => {
            if (e.key === 'Escape') {
                handleClose();
            }
        };

        window.addEventListener(
            'keydown',
            handleGlobalEsc
        );

        return () => {
            window.removeEventListener(
                'keydown',
                handleGlobalEsc
            );

            document.body.style.overflow = '';
        };
    }, [isOpen]);

    const handleClose = () => {
        setIsOpen(false);

        setScale(1);

        setPosition({
            x: 0,
            y: 0
        });

        setRotation(0);

        setIsDragging(false);

        document.body.style.overflow = '';
    };

    const handleZoomIn = () => {
        setScale(prev =>
            Math.min(prev + 0.4, 5)
        );
    };

    const handleZoomOut = () => {
        setScale(prev =>
            Math.max(prev - 0.4, 0.6)
        );
    };

    const handleRotate = () => {
        setRotation(prev =>
            prev + 90
        );
    };

    const handleWheel = (e) => {
        e.preventDefault();

        const zoomFactor =
            e.deltaY < 0
                ? 0.2
                : -0.2;

        setScale(prev =>
            Math.max(
                0.6,
                Math.min(
                    prev + zoomFactor,
                    5
                )
            )
        );
    };

    const handleMouseDown = (e) => {
        if (
            scale <= 1 &&
            rotation % 360 === 0
        ) {
            return;
        }

        e.preventDefault();

        setIsDragging(true);

        dragStartRef.current = {
            x: e.clientX - position.x,
            y: e.clientY - position.y
        };
    };

    const handleMouseMove = (e) => {
        if (!isDragging) return;

        setPosition({
            x:
                e.clientX -
                dragStartRef.current.x,

            y:
                e.clientY -
                dragStartRef.current.y
        });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const resetImageTransform = () => {
        setScale(1);

        setPosition({
            x: 0,
            y: 0
        });

        setRotation(0);

        setIsDragging(false);
    };

    /*
     * ---------------------------------------------------------
     * GALLERY NAVIGATION
     * ---------------------------------------------------------
     */

    const showPrevious = (e) => {
        e?.stopPropagation();

        if (!hasGallery) return;

        setCurrentIndex(prev =>
            prev <= 0
                ? images.length - 1
                : prev - 1
        );

        resetImageTransform();
    };

    const showNext = (e) => {
        e?.stopPropagation();

        if (!hasGallery) return;

        setCurrentIndex(prev =>
            prev >= images.length - 1
                ? 0
                : prev + 1
        );

        resetImageTransform();
    };

    /*
     * ---------------------------------------------------------
     * OPEN VIEWER
     * ---------------------------------------------------------
     */

    const handleThumbnailClick = () => {
        setCurrentIndex(initialIndex);

        resetImageTransform();

        setIsOpen(true);
    };

    return (
        <>
            {/* =================================================
                THUMBNAIL
            ================================================= */}

            <img
                src={src}
                alt={alt}
                onClick={handleThumbnailClick}
                draggable={false}
                style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                    cursor: 'pointer'
                }}
            />

            {/* =================================================
                FULLSCREEN VIEWER
            ================================================= */}

            {isOpen &&
                createPortal(
                    <div
                        ref={viewerRef}
                        onWheel={handleWheel}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                        onClick={(e) => {
                            if (
                                e.target ===
                                e.currentTarget
                            ) {
                                handleClose();
                            }
                        }}
                        style={{
                            position: 'fixed',
                            inset: 0,
                            background:
                                'rgba(5, 7, 12, 0.97)',
                            zIndex: 99999999,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            userSelect: 'none',
                            animation:
                                'lightboxFade 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
                        }}
                    >
                        <style>
                            {`
                                @keyframes lightboxFade {
                                    from {
                                        opacity: 0;
                                    }

                                    to {
                                        opacity: 1;
                                    }
                                }

                                .control-btn {
                                    background: rgba(255,255,255,0.08);
                                    border: 1px solid rgba(255,255,255,0.1);
                                    color: #fff;
                                    width: 40px;
                                    height: 40px;
                                    border-radius: 50%;
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                    cursor: pointer;
                                    transition: all 0.2s;
                                    backdrop-filter: blur(8px);
                                }

                                .control-btn:hover {
                                    background: rgba(255,255,255,0.18);
                                    transform: scale(1.05);
                                }

                                .gallery-nav-btn {
                                    background: rgba(255,255,255,0.08);
                                    border: 1px solid rgba(255,255,255,0.1);
                                    color: #fff;
                                    width: 46px;
                                    height: 46px;
                                    border-radius: 50%;
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                    cursor: pointer;
                                    transition: all 0.2s;
                                    backdrop-filter: blur(8px);
                                }

                                .gallery-nav-btn:hover {
                                    background: rgba(255,255,255,0.18);
                                    transform: translateY(-50%) scale(1.05);
                                }
                            `}
                        </style>

                        {/* =================================================
                            PREVIOUS
                        ================================================= */}

                        {hasGallery && (
                            <button
                                type="button"
                                onClick={showPrevious}
                                className="gallery-nav-btn"
                                style={{
                                    position: 'absolute',
                                    left: '24px',
                                    top: '50%',
                                    transform:
                                        'translateY(-50%)',
                                    zIndex: 20
                                }}
                                aria-label="Previous image"
                            >
                                <ChevronLeft size={26} />
                            </button>
                        )}

                        {/* =================================================
                            NEXT
                        ================================================= */}

                        {hasGallery && (
                            <button
                                type="button"
                                onClick={showNext}
                                className="gallery-nav-btn"
                                style={{
                                    position: 'absolute',
                                    right: '24px',
                                    top: '50%',
                                    transform:
                                        'translateY(-50%)',
                                    zIndex: 20
                                }}
                                aria-label="Next image"
                            >
                                <ChevronRight size={26} />
                            </button>
                        )}

                        {/* =================================================
                            TOP CONTROLS
                        ================================================= */}

                        <div
                            style={{
                                position: 'absolute',
                                top: '24px',
                                left: '24px',
                                right: '24px',
                                display: 'flex',
                                justifyContent:
                                    'space-between',
                                zIndex: 30,
                                pointerEvents: 'none'
                            }}
                        >
                            {/* LEFT CONTROLS */}

                            <div
                                style={{
                                    display: 'flex',
                                    gap: '12px',
                                    pointerEvents: 'auto'
                                }}
                            >
                                <button
                                    type="button"
                                    onClick={handleZoomIn}
                                    className="control-btn"
                                    aria-label="Zoom in"
                                >
                                    <ZoomIn size={18} />
                                </button>

                                <button
                                    type="button"
                                    onClick={handleZoomOut}
                                    className="control-btn"
                                    aria-label="Zoom out"
                                >
                                    <ZoomOut size={18} />
                                </button>

                                <button
                                    type="button"
                                    onClick={handleRotate}
                                    className="control-btn"
                                    aria-label="Rotate image"
                                >
                                    <RotateCw size={18} />
                                </button>
                            </div>

                            {/* CLOSE */}

                            <button
                                type="button"
                                onClick={handleClose}
                                className="control-btn"
                                style={{
                                    pointerEvents: 'auto'
                                }}
                                aria-label="Close"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* =================================================
                            IMAGE COUNTER
                        ================================================= */}

                        {hasGallery && (
                            <div
                                style={{
                                    position: 'absolute',
                                    top: '30px',
                                    left: '50%',
                                    transform:
                                        'translateX(-50%)',
                                    color: '#ffffff',
                                    background:
                                        'rgba(0,0,0,0.35)',
                                    padding:
                                        '5px 10px',
                                    borderRadius: '14px',
                                    fontSize: '0.72rem',
                                    fontWeight: 600,
                                    zIndex: 30,
                                    pointerEvents: 'none',
                                    backdropFilter:
                                        'blur(6px)'
                                }}
                            >
                                {currentIndex + 1} /{' '}
                                {images.length}
                            </div>
                        )}

                        {/* =================================================
                            IMAGE
                        ================================================= */}

                        <div
                            onMouseDown={handleMouseDown}
                            style={{
                                transform:
                                    `translate(${position.x}px, ${position.y}px) ` +
                                    `scale(${scale}) ` +
                                    `rotate(${rotation}deg)`,

                                transition: isDragging
                                    ? 'none'
                                    : 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',

                                cursor:
                                    scale > 1
                                        ? (
                                            isDragging
                                                ? 'grabbing'
                                                : 'grab'
                                        )
                                        : 'default',

                                maxWidth: '90vw',
                                maxHeight: '85vh',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent:
                                    'center'
                            }}
                        >
                            <img
                                src={
                                    currentImage?.url ||
                                    src
                                }
                                alt={
                                    currentImage?.name ||
                                    alt
                                }
                                draggable={false}
                                style={{
                                    maxWidth: '90vw',
                                    maxHeight: '85vh',
                                    objectFit: 'contain',
                                    borderRadius: '8px',
                                    boxShadow:
                                        '0 24px 64px rgba(0,0,0,0.5)',
                                    display: 'block'
                                }}
                            />
                        </div>

                        {/* =================================================
                            REACTIONS

                            IMPORTANT:
                            This is INSIDE the portal.

                            Therefore it belongs to the actual
                            fullscreen viewer.

                            When currentIndex changes,
                            currentReactionGroups changes too.
                        ================================================= */}

                        {hasReactions && (
                            <div
                                style={{
                                    position: 'absolute',
                                    left: '50%',
                                    bottom: '32px',
                                    transform:
                                        'translateX(-50%)',
                                    zIndex: 50,
                                    pointerEvents: 'none',

                                    /*
                                     * Keeps the badge readable
                                     * regardless of image size.
                                     */
                                    padding: '4px 8px',
                                    borderRadius: '18px',
                                    background:
                                        'rgba(0,0,0,0.35)',
                                    backdropFilter:
                                        'blur(8px)'
                                }}
                            >
                                <MessageReactions
                                    reactionGroups={
                                        currentReactionGroups
                                    }
                                />
                            </div>
                        )}
                    </div>,
                    document.body
                )}
        </>
    );
};