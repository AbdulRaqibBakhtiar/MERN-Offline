import { API_BASE_URL } from '../../api/config';
import { getAvatarUrl } from '../../utils/avatar';
import UserAvatar from '../Layout/UserAvatar';
import { MediaViewer } from '../Layout/MediaViewer';
import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Heart, MessageCircle, Share2, Send, MoreHorizontal, Edit3, Trash2, Reply, ThumbsUp, ThumbsDown, Maximize2, X } from 'lucide-react';

function NewsCard({
  newsItem,
  user,
  editingNewsId,
  setEditingNewsId,
  editNewsPreviewUrl,
  setIsEditNewsCropOpen,
  editTitle,
  setEditTitle,
  editSummary,
  setEditSummary,
  editFullText,
  setEditFullText,
  executeNewsSave,
  setSearchCategory,
  activeMenuId,
  setActiveMenuId,
  startEditingNews,
  requestNewsDelete,
  isNewsExpanded,
  setIsNewsExpanded,
  expandedCommentsMap,
  setExpandedCommentsMap,
  handleCommentDelete,
  handleCommentSubmit,
  handleNewsLike,
  handleCommentApprove,
  handleCommentDisapprove,
  newComment,
  setNewComment,
  setDeleteCommentTarget,
  handleCommentEdit
}) {
  const [heartAnimating, setHeartAnimating] = useState(false);
  const [commentTextFocused, setCommentTextFocused] = useState(false);
  const [activeCommentMenu, setActiveCommentMenu] = useState(null);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentText, setEditingCommentText] = useState('');
  const [hoveredCommentId, setHoveredCommentId] = useState(null);
  const [menuPosition, setMenuPosition] = useState(null);
  const [commentMenuPosition, setCommentMenuPosition] = useState(null);
  const [commentDeleteTarget, setCommentDeleteTarget] = useState(null);
  const [commentDeleteBusy, setCommentDeleteBusy] = useState(false);
  const [postDeletePending, setPostDeletePending] = useState(false);
  const [postDeleteBusy, setPostDeleteBusy] = useState(false);
  const [toast, setToast] = useState(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [expandedReplies, setExpandedReplies] = useState({});
  const [replyText, setReplyText] = useState({});
  const [replyBusy, setReplyBusy] = useState({});
  const [visibleComments, setVisibleComments] = useState(4);
  const [localComments, setLocalComments] = useState(newsItem.comments || []);
  const [locallyDeletedComments, setLocallyDeletedComments] = useState(new Set());
  const canManagePost = ['admin', 'editor'].includes(user?.role) || (user?.role === 'author' && String(newsItem.createdBy?._id || newsItem.createdBy) === String(user?._id || user?.id));
  const canManageComment = comment => ['admin', 'editor'].includes(user?.role) || (
    String(comment.userId?._id || comment.userId || '') === String(user?._id || user?.id || '') ||
    Boolean(user?.username && comment.user === user.username)
  );

  useEffect(() => {
    setLocalComments(prev => {
      const incoming = newsItem.comments || [];
      const deleted = locallyDeletedComments;

      const incomingMap = new Map(
        incoming.map(comment => [String(comment._id), comment])
      );

      const merged = incoming.map(comment => {
        const local = prev.find(item => String(item._id) === String(comment._id));

        if (!local) return comment;

        const localReplies = Array.isArray(local.replies) ? local.replies : [];
        const incomingReplies = Array.isArray(comment.replies) ? comment.replies : [];

        const replyMap = new Map(
          incomingReplies.map(reply => [String(reply._id), reply])
        );

        localReplies.forEach(reply => {
          if (!replyMap.has(String(reply._id))) {
            replyMap.set(String(reply._id), reply);
          }
        });

        return {
          ...comment,
          replies: Array.from(replyMap.values())
        };
      });

      prev.forEach(comment => {
        const id = String(comment._id);

        if (!incomingMap.has(id) && !deleted.has(id)) {
          merged.push(comment);
        }
      });

      return merged.filter(
        comment => !deleted.has(String(comment._id))
      );
    });
  }, [newsItem._id, newsItem.comments, locallyDeletedComments]);

  const mediaImages = useMemo(() => {
    const collected = [];
    const addValue = value => {
      if (!value) return;
      if (Array.isArray(value)) {
        value.forEach(addValue);
        return;
      }
      if (typeof value === 'string') {
        if (!collected.includes(value)) collected.push(value);
        return;
      }
      if (typeof value === 'object') {
        const nested = value.url || value.path || value.imagePath || value.src || value.location || value.filePath || value.filename;
        if (nested) {
          addValue(nested);
          return;
        }
        if (Array.isArray(value.images)) value.images.forEach(addValue);
        if (Array.isArray(value.imagePaths)) value.imagePaths.forEach(addValue);
        if (Array.isArray(value.media)) value.media.forEach(addValue);
      }
    };
    addValue(newsItem.images);
    addValue(newsItem.imagePaths);
    addValue(newsItem.mediaImages);
    addValue(newsItem.imagePath);
    addValue(newsItem.media);
    return collected;
  }, [newsItem.images, newsItem.imagePaths, newsItem.mediaImages, newsItem.imagePath, newsItem.media]);

  const likeList = newsItem.likes || [];
  const likeCount = likeList.length;
  const commentsOpen = !!expandedCommentsMap[newsItem._id];

  useEffect(() => {
    setVisibleComments(4);
  }, [newsItem._id, localComments.length]);

  const currentUserId = useMemo(() => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return null;
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.id || payload._id || payload.userId || null;
    } catch {
      return null;
    }
  }, []);

  const hasLiked = !!currentUserId && likeList.some(item => {
    const value = typeof item === 'object' ? item._id : item;
    return String(value) === String(currentUserId);
  });

  const api = async (endpoint, options = {}) => {
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}`, ...(options.headers || {}) };
    if (options.body !== undefined) headers['Content-Type'] = 'application/json';
    const response = await fetch(`${API_BASE_URL}/content${endpoint}`, { ...options, headers });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || 'Request failed.');
    return data;
  };

  const formatTimeAgo = dateString => {
    if (!dateString) return '';
    const elapsed = Date.now() - new Date(dateString).getTime();
    const minute = 60000;
    const hour = minute * 60;
    const day = hour * 24;
    if (elapsed < minute) return 'Just now';
    if (elapsed < hour) return `${Math.round(elapsed / minute)}m ago`;
    if (elapsed < day) return `${Math.round(elapsed / hour)}h ago`;
    return new Date(dateString).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const getPreviewText = (text, maxLength = 180) => {
    if (!text) return '';
    const clean = text.replace(/\s+/g, ' ').trim();
    if (clean.length <= maxLength) return clean;
    const shortened = clean.slice(0, maxLength);
    const lastSpace = shortened.lastIndexOf(' ');
    return `${shortened.slice(0, lastSpace > 0 ? lastSpace : maxLength).trim()}...`;
  };

  const previewText = getPreviewText(newsItem.fullText);

  const mediaUrl = path => {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('blob:') || path.startsWith('data:')) return path;
    return `${API_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
  };

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!activeMenuId) {
      setMenuPosition(null);
      return;
    }
    const update = () => {
      const el = document.querySelector(`[data-post-menu-button="${activeMenuId}"]`);
      if (!el) return;
      const r = el.getBoundingClientRect();
      const menuWidth = 180;
      const menuHeight = 100;
      const gap = 7;
      const padding = 10;
      let top = r.bottom + gap;
      if (top + menuHeight > window.innerHeight - padding) top = r.top - menuHeight - gap;
      top = Math.max(padding, Math.min(top, window.innerHeight - menuHeight - padding));
      let right = window.innerWidth - r.right;
      right = Math.max(padding, Math.min(right, window.innerWidth - menuWidth - padding));
      setMenuPosition({ top, right });
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [activeMenuId]);

  useEffect(() => {
    if (!activeCommentMenu) {
      setCommentMenuPosition(null);
      return;
    }
    const update = () => {
      const el = document.querySelector(`[data-comment-menu-button="${activeCommentMenu}"]`);
      if (!el) return;
      const r = el.getBoundingClientRect();
      const menuWidth = 135;
      const menuHeight = 88;
      const gap = 6;
      const padding = 10;
      let top = r.bottom + gap;
      if (top + menuHeight > window.innerHeight - padding) top = r.top - menuHeight - gap;
      top = Math.max(padding, Math.min(top, window.innerHeight - menuHeight - padding));
      let right = window.innerWidth - r.right;
      right = Math.max(padding, Math.min(right, window.innerWidth - menuWidth - padding));
      setCommentMenuPosition({ top, right });
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [activeCommentMenu]);

  useEffect(() => {
    const closeMenus = e => {
      if (e.target.closest?.('[data-context-menu]') || e.target.closest?.('[data-post-menu-button]') || e.target.closest?.('[data-comment-menu-button]')) return;
      setActiveCommentMenu(null);
      setActiveMenuId(null);
    };
    document.addEventListener('click', closeMenus);
    return () => document.removeEventListener('click', closeMenus);
  }, [setActiveMenuId]);

  const handleShare = async e => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}${window.location.pathname}#news-card-${newsItem._id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: newsItem.title, text: previewText, url: shareUrl });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        setToast({ type: 'success', message: 'News link copied to clipboard.' });
      }
    } catch (err) {
      if (err?.name !== 'AbortError') setToast({ type: 'error', message: 'Unable to share this article.' });
    }
  };

  const onLikeClick = async e => {
    e.stopPropagation();
    setHeartAnimating(true);
    setTimeout(() => setHeartAnimating(false), 280);
    await handleNewsLike(newsItem._id);
  };

  const iconButtonStyle = {
    border: 'none',
    outline: 'none',
    background: 'transparent',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all .2s ease',
    WebkitTapHighlightColor: 'transparent'
  };

  const startEditingComment = comment => {
    setActiveCommentMenu(null);
    setEditingCommentId(comment._id);
    setEditingCommentText(comment.text || '');
  };

  const cancelEditingComment = () => {
    setEditingCommentId(null);
    setEditingCommentText('');
  };

  const saveEditedComment = async comment => {
    const text = editingCommentText.trim();
    if (!text) return;
    if (typeof handleCommentEdit !== 'function') {
      setToast({ type: 'error', message: 'Comment editing is unavailable.' });
      return;
    }
    try {
      const result = await handleCommentEdit(newsItem._id, comment._id, text);
      if (result !== false) {
        setLocallyDeletedComments(prev => {
          const next = new Set(prev);
          next.add(String(commentDeleteTarget.commentId));
          return next;
        });

        setLocalComments(prev =>
          prev.filter(
            item => String(item._id) !== String(commentDeleteTarget.commentId)
          )
        );
        cancelEditingComment();
      }
    } catch {
      setToast({ type: 'error', message: 'Unable to edit the comment.' });
    }
  };

  const requestCommentDelete = comment => {
    setActiveCommentMenu(null);
    const target = { newsId: newsItem._id, commentId: comment._id };
    setCommentDeleteTarget(target);
    if (typeof setDeleteCommentTarget === 'function') setDeleteCommentTarget(target);
  };

  const confirmCommentDelete = async () => {
    if (!commentDeleteTarget) return;
    if (typeof handleCommentDelete !== 'function') {
      setToast({ type: 'error', message: 'Comment deletion is unavailable.' });
      return;
    }
    setCommentDeleteBusy(true);
    try {
      const result = await handleCommentDelete(commentDeleteTarget.newsId, commentDeleteTarget.commentId);
      if (result === false) {
        setToast({ type: 'error', message: 'Unable to delete the comment.' });
        return;
      }
      setLocalComments(prev => prev.filter(item => item._id !== commentDeleteTarget.commentId));
      setCommentDeleteTarget(null);
      if (typeof setDeleteCommentTarget === 'function') setDeleteCommentTarget(null);
      setToast({ type: 'success', message: 'Comment deleted successfully.' });
    } catch {
      setToast({ type: 'error', message: 'Unable to delete the comment.' });
    } finally {
      setCommentDeleteBusy(false);
    }
  };

  const requestPostDelete = e => {
    e.stopPropagation();
    setActiveMenuId(null);
    setPostDeletePending(true);
  };

  const confirmPostDelete = async () => {
    if (!postDeletePending) return;
    setPostDeleteBusy(true);
    try {
      const result = await requestNewsDelete(newsItem._id);
      if (result === false) {
        setToast({ type: 'error', message: 'Unable to delete the article.' });
        return;
      }
      setPostDeletePending(false);
      setToast({ type: 'success', message: 'Article deleted successfully.' });
    } catch {
      setToast({ type: 'error', message: 'Unable to delete the article.' });
    } finally {
      setPostDeleteBusy(false);
    }
  };

  const sendReply = async commentId => {
    const text = (replyText[commentId] || '').trim();

    if (!text || replyBusy[commentId]) return;

    setReplyBusy(prev => ({
      ...prev,
      [commentId]: true
    }));

    try {
      const result = await api(
        `/news/${newsItem._id}/comments/${commentId}/replies`,
        {
          method: 'POST',
          body: JSON.stringify({ text })
        }
      );

      const createdReply =
        result?.reply ||
        result?.data?.reply ||
        result?.comment?.replies?.[result.comment.replies.length - 1] ||
        result?.data ||
        null;

      const reply = {
        ...(createdReply || {}),
        _id:
          createdReply?._id ||
          createdReply?.id ||
          `local-reply-${Date.now()}`,
        text:
          createdReply?.text ||
          text,
        user:
          createdReply?.user ||
          createdReply?.username ||
          createdReply?.createdBy?.username ||
          'You',
        createdAt:
          createdReply?.createdAt ||
          new Date().toISOString(),
        approvals:
          createdReply?.approvals || [],
        disapprovals:
          createdReply?.disapprovals || []
      };

      setLocalComments(prev => {
        return prev.map(comment => {
          if (String(comment._id) !== String(commentId)) {
            return comment;
          }

          const existingReplies =
            Array.isArray(comment.replies)
              ? comment.replies
              : [];

          const alreadyExists = existingReplies.some(
            existing =>
              String(existing._id) === String(reply._id)
          );

          if (alreadyExists) {
            return comment;
          }

          return {
            ...comment,
            replies: [
              ...existingReplies,
              reply
            ]
          };
        });
      });

      setReplyText(prev => ({
        ...prev,
        [commentId]: ''
      }));

      setExpandedReplies(prev => ({
        ...prev,
        [commentId]: true
      }));

      setToast({
        type: 'success',
        message: 'Reply posted.'
      });
    } catch (error) {
      console.error('REPLY ERROR:', error);

      setToast({
        type: 'error',
        message: error.message || 'Unable to post reply.'
      });
    } finally {
      setReplyBusy(prev => ({
        ...prev,
        [commentId]: false
      }));
    }
  };

  const voteReply = async (commentId, replyId, type) => {
    try {
      const result = await api(
        `/news/${newsItem._id}/comments/${commentId}/replies/${replyId}/${type}`,
        { method: 'POST' }
      );

      setLocalComments(prev =>
        prev.map(comment => {
          if (String(comment._id) !== String(commentId)) {
            return comment;
          }

          return {
            ...comment,
            replies: (comment.replies || []).map(reply => {
              if (String(reply._id) !== String(replyId)) {
                return reply;
              }

              if (result?.reply) {
                return {
                  ...reply,
                  ...result.reply
                };
              }

              const userId = String(currentUserId);

              const approvals = (reply.approvals || [])
                .filter(id =>
                  String(
                    typeof id === 'object'
                      ? id._id
                      : id
                  ) !== userId
                );

              const disapprovals = (reply.disapprovals || [])
                .filter(id =>
                  String(
                    typeof id === 'object'
                      ? id._id
                      : id
                  ) !== userId
                );

              if (type === 'approve') {
                approvals.push(currentUserId);
              } else {
                disapprovals.push(currentUserId);
              }

              return {
                ...reply,
                approvals,
                disapprovals
              };
            })
          };
        })
      );
    } catch (error) {
      console.error('REPLY VOTE ERROR:', error);

      setToast({
        type: 'error',
        message: 'Unable to update reply vote.'
      });
    }
  };

  const loadMoreComments = () => {
    setVisibleComments(prev => Math.min(prev + 10, localComments.length));
  };

  const activeComment = localComments.find(c => c._id === activeCommentMenu);

  const postMenu = canManagePost && activeMenuId === newsItem._id && menuPosition ? createPortal(
    <div data-context-menu onClick={e => e.stopPropagation()} style={{
      position: 'fixed',
      top: menuPosition.top,
      right: menuPosition.right,
      zIndex: 2147483647,
      width: '180px',
      padding: '6px',
      borderRadius: '13px',
      background: 'var(--bg-card)',
      border: '1px solid var(--border-color)',
      boxShadow: '0 18px 45px rgba(0,0,0,.24)'
    }}>
      <button type="button" onClick={e => {
        e.stopPropagation();
        setActiveMenuId(null);
        startEditingNews(newsItem);
      }} style={{
        width: '100%',
        border: 'none',
        background: 'transparent',
        textAlign: 'left',
        padding: '10px 11px',
        borderRadius: '9px',
        cursor: 'pointer',
        color: 'var(--text-primary)',
        fontWeight: '750',
        fontSize: '.78rem',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <Edit3 size={15} />
        <span>Edit Article</span>
      </button>

      <button type="button" onClick={requestPostDelete} style={{
        width: '100%',
        border: 'none',
        background: 'transparent',
        textAlign: 'left',
        padding: '10px 11px',
        borderRadius: '9px',
        cursor: 'pointer',
        color: '#ef4444',
        fontWeight: '800',
        fontSize: '.78rem',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <Trash2 size={15} />
        <span>Delete Article</span>
      </button>
    </div>,
    document.body
  ) : null;

  const commentMenu = activeCommentMenu && commentMenuPosition ? createPortal(
    <div data-context-menu onClick={e => e.stopPropagation()} style={{
      position: 'fixed',
      top: commentMenuPosition.top,
      right: commentMenuPosition.right,
      zIndex: 2147483647,
      width: '135px',
      padding: '5px',
      borderRadius: '11px',
      background: 'var(--bg-card)',
      border: '1px solid var(--border-color)',
      boxShadow: '0 16px 38px rgba(0,0,0,.22)'
    }}>
      {activeComment && <>
        <button type="button" onClick={e => {
          e.stopPropagation();
          startEditingComment(activeComment);
        }} style={{
          width: '100%',
          border: 'none',
          background: 'transparent',
          textAlign: 'left',
          padding: '8px 10px',
          borderRadius: '8px',
          cursor: 'pointer',
          color: 'var(--text-primary)',
          fontWeight: '750',
          fontSize: '.75rem',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Edit3 size={14} />
          <span>Edit</span>
        </button>

        <button type="button" onClick={e => {
          e.stopPropagation();
          requestCommentDelete(activeComment);
        }} style={{
          width: '100%',
          border: 'none',
          background: 'transparent',
          textAlign: 'left',
          padding: '8px 10px',
          borderRadius: '8px',
          cursor: 'pointer',
          color: '#ef4444',
          fontWeight: '800',
          fontSize: '.75rem',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Trash2 size={14} />
          <span>Delete</span>
        </button>
      </>}
    </div>,
    document.body
  ) : null;

  const openViewer = index => {
    setViewerIndex(index);
    setViewerOpen(true);
  };

  const renderMedia = () => {
    if (!mediaImages.length) return null;

    const count = mediaImages.length;

    const mediaContainer = {
      marginTop: '12px',
      borderRadius: '14px',
      overflow: 'hidden',
      background: 'var(--bg-main)',
      position: 'relative'
    };

    const imageStyle = {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      display: 'block'
    };

    if (count === 1) return (
      <div style={mediaContainer}>
        <div onClick={() => openViewer(0)} style={{
          position: 'relative',
          cursor: 'zoom-in',
          aspectRatio: '16 / 9',
          maxHeight: '520px',
          overflow: 'hidden',
          background: 'var(--bg-main)'
        }}>
          <img src={mediaUrl(mediaImages[0])} alt={newsItem.title} loading="lazy" style={imageStyle} />
          <div style={{
            position: 'absolute',
            right: '12px',
            bottom: '12px',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,.55)',
            color: '#fff',
            backdropFilter: 'blur(6px)',
            pointerEvents: 'none'
          }}>
            <Maximize2 size={17} />
          </div>
        </div>
      </div>
    );

    if (count === 2) return (
      <div style={{ ...mediaContainer, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px', height: '300px' }}>
        {mediaImages.slice(0, 2).map((src, index) => (
          <div key={`${src}-${index}`} onClick={() => openViewer(index)} style={{ position: 'relative', overflow: 'hidden', cursor: 'zoom-in' }}>
            <img src={mediaUrl(src)} alt={`${newsItem.title} ${index + 1}`} loading="lazy" style={imageStyle} />
          </div>
        ))}
      </div>
    );

    if (count === 3) return (
      <div style={{
        ...mediaContainer,
        display: 'grid',
        gridTemplateColumns: '1.4fr 1fr',
        gridTemplateRows: '1fr 1fr',
        gap: '3px',
        height: '350px'
      }}>
        <div onClick={() => openViewer(0)} style={{ gridRow: '1 / span 2', position: 'relative', overflow: 'hidden', cursor: 'zoom-in' }}>
          <img src={mediaUrl(mediaImages[0])} alt={`${newsItem.title} 1`} loading="lazy" style={imageStyle} />
        </div>

        {mediaImages.slice(1, 3).map((src, index) => (
          <div key={`${src}-${index + 1}`} onClick={() => openViewer(index + 1)} style={{ position: 'relative', overflow: 'hidden', cursor: 'zoom-in' }}>
            <img src={mediaUrl(src)} alt={`${newsItem.title} ${index + 2}`} loading="lazy" style={imageStyle} />
          </div>
        ))}
      </div>
    );

    const remaining = count - 4;

    return (
      <div style={{
        ...mediaContainer,
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gridTemplateRows: '1fr 1fr',
        gap: '3px',
        height: '350px'
      }}>
        {mediaImages.slice(0, 4).map((src, index) => (
          <div key={`${src}-${index}`} onClick={() => openViewer(index)} style={{ position: 'relative', overflow: 'hidden', cursor: 'zoom-in' }}>
            <img src={mediaUrl(src)} alt={`${newsItem.title} ${index + 1}`} loading="lazy" style={imageStyle} />
            {index === 3 && remaining > 0 && (
              <div style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(0,0,0,.48)',
                color: '#fff',
                fontSize: '1.35rem',
                fontWeight: '900'
              }}>
                +{remaining}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const viewer = (
    <MediaViewer
      isOpen={viewerOpen}
      media={mediaImages.map((src, index) => ({
        url: mediaUrl(src),
        type: 'image',
        title: newsItem.title,
        alt: `${newsItem.title} image ${index + 1}`
      }))}
      initialIndex={viewerIndex}
      onClose={() => setViewerOpen(false)}
      title={newsItem.title || 'News image'}
    />
  );
  const postDeleteDialog = postDeletePending ? (
    <div onClick={e => e.stopPropagation()} style={{
      position: 'absolute',
      inset: 0,
      zIndex: 100,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '18px',
      boxSizing: 'border-box',
      background: 'rgba(0,0,0,.16)',
      backdropFilter: 'blur(3px)',
      borderRadius: '16px'
    }}>
      <div style={{
        width: 'min(370px,100%)',
        boxSizing: 'border-box',
        padding: '18px',
        borderRadius: '15px',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        boxShadow: '0 20px 55px rgba(0,0,0,.28)'
      }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
          <div style={{
            width: '40px',
            height: '40px',
            minWidth: '40px',
            borderRadius: '11px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(239,68,68,.1)',
            color: '#ef4444'
          }}>
            <Trash2 size={19} />
          </div>

          <div>
            <strong style={{ display: 'block', fontSize: '.92rem' }}>Delete this article?</strong>
            <div style={{ marginTop: '5px', color: 'var(--text-secondary)', fontSize: '.75rem', lineHeight: '1.45' }}>
              This article and its discussion may be permanently removed.
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '17px' }}>
          <button type="button" disabled={postDeleteBusy} onClick={() => setPostDeletePending(false)} style={{
            border: '1px solid var(--border-color)',
            background: 'var(--bg-main)',
            color: 'var(--text-primary)',
            padding: '9px 13px',
            borderRadius: '9px',
            cursor: 'pointer',
            fontWeight: '750',
            fontSize: '.75rem',
            opacity: postDeleteBusy ? .6 : 1
          }}>
            Cancel
          </button>

          <button type="button" disabled={postDeleteBusy} onClick={confirmPostDelete} style={{
            border: 'none',
            background: '#ef4444',
            color: '#fff',
            padding: '9px 14px',
            borderRadius: '9px',
            cursor: 'pointer',
            fontWeight: '800',
            fontSize: '.75rem',
            opacity: postDeleteBusy ? .65 : 1
          }}>
            {postDeleteBusy ? 'Deleting...' : 'Delete Article'}
          </button>
        </div>
      </div>
    </div>
  ) : null;

  const commentDeleteDialog = commentDeleteTarget ? createPortal(
    <div onClick={e => e.stopPropagation()} style={{
      position: 'fixed',
      inset: 0,
      zIndex: 2147483645,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      background: 'rgba(0,0,0,.25)',
      backdropFilter: 'blur(3px)'
    }}>
      <div style={{
        width: 'min(370px,100%)',
        padding: '18px',
        borderRadius: '15px',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        boxShadow: '0 22px 60px rgba(0,0,0,.3)'
      }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
          <div style={{
            width: '40px',
            height: '40px',
            minWidth: '40px',
            borderRadius: '11px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(239,68,68,.1)',
            color: '#ef4444'
          }}>
            <Trash2 size={19} />
          </div>

          <div>
            <strong style={{ display: 'block', fontSize: '.9rem' }}>Delete this comment?</strong>
            <div style={{ marginTop: '5px', color: 'var(--text-secondary)', fontSize: '.74rem', lineHeight: '1.45' }}>
              This action cannot be undone.
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '17px' }}>
          <button type="button" disabled={commentDeleteBusy} onClick={() => {
            setCommentDeleteTarget(null);
            if (typeof setDeleteCommentTarget === 'function') setDeleteCommentTarget(null);
          }} style={{
            border: '1px solid var(--border-color)',
            background: 'var(--bg-main)',
            color: 'var(--text-primary)',
            padding: '9px 13px',
            borderRadius: '9px',
            cursor: 'pointer',
            fontWeight: '750',
            fontSize: '.75rem'
          }}>
            Cancel
          </button>

          <button type="button" disabled={commentDeleteBusy} onClick={confirmCommentDelete} style={{
            border: 'none',
            background: '#ef4444',
            color: '#fff',
            padding: '9px 14px',
            borderRadius: '9px',
            cursor: 'pointer',
            fontWeight: '800',
            fontSize: '.75rem'
          }}>
            {commentDeleteBusy ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  ) : null;

  const resultToast = toast ? createPortal(
    <div role="status" aria-live="polite" style={{
      position: 'fixed',
      left: '50%',
      bottom: '28px',
      transform: 'translateX(-50%)',
      zIndex: 2147483647,
      width: 'min(390px,calc(100vw - 28px))',
      padding: '12px 14px',
      borderRadius: '12px',
      background: 'var(--bg-card)',
      border: '1px solid var(--border-color)',
      boxShadow: '0 16px 45px rgba(0,0,0,.25)',
      display: 'flex',
      alignItems: 'center',
      gap: '10px'
    }}>
      <strong style={{ color: toast.type === 'error' ? '#ef4444' : '#10b981', fontSize: '16px' }}>
        {toast.type === 'error' ? '!' : '✓'}
      </strong>

      <span style={{
        flex: 1,
        color: 'var(--text-primary)',
        fontSize: '.82rem',
        fontWeight: '700'
      }}>
        {toast.message}
      </span>

      <button type="button" onClick={() => setToast(null)} style={{ ...iconButtonStyle, color: 'var(--text-secondary)' }}>
        <X size={17} />
      </button>
    </div>,
    document.body
  ) : null;

  return (
    <article
      id={`news-card-${newsItem._id}`}
      className="panel-card news-article home-feed-item-card"
      onClick={() => setSearchCategory('news')}
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        padding: '16px',
        boxSizing: 'border-box',
        boxShadow: '0 4px 12px rgba(0,0,0,.06)',
        position: 'relative',
        color: 'var(--text-primary)',
        borderRadius: '16px',
        overflow: 'visible'
      }}
    >
      {postDeleteDialog}
      {commentDeleteDialog}
      {resultToast}
      {viewer}

      {editingNewsId === newsItem._id ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <span style={{
            fontSize: '.78rem',
            background: 'var(--bg-main)',
            padding: '7px 12px',
            borderRadius: '8px',
            fontWeight: '800',
            alignSelf: 'flex-start'
          }}>
            Editing Active Announcement
          </span>

          <div style={{
            width: '100%',
            borderRadius: '14px',
            overflow: 'hidden',
            background: 'var(--bg-main)',
            border: '1px solid var(--border-color)'
          }}>
            {editNewsPreviewUrl ? (
              <img src={editNewsPreviewUrl} alt="Preview" style={{ width: '100%', maxHeight: '420px', objectFit: 'contain', display: 'block' }} />
            ) : mediaImages[0] ? (
              <img src={mediaUrl(mediaImages[0])} alt="Current" style={{ width: '100%', maxHeight: '420px', objectFit: 'contain', display: 'block' }} />
            ) : (
              <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
                No Photo Attached
              </div>
            )}
          </div>

          <button type="button" onClick={() => setIsEditNewsCropOpen(true)} style={{
            padding: '10px 14px',
            background: 'var(--bg-main)',
            color: 'var(--text-primary)',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '700'
          }}>
            Modify Post Photo Asset
          </button>

          <input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)} placeholder="News title" style={{
            padding: '12px',
            borderRadius: '8px',
            border: '1px solid var(--border-color)',
            background: 'var(--bg-main)',
            color: 'var(--text-primary)',
            outline: 'none',
            fontSize: '.9rem',
            fontWeight: '700'
          }} />

          <textarea value={editFullText} onChange={e => setEditFullText(e.target.value)} placeholder="Write the full article..." style={{
            padding: '14px',
            borderRadius: '8px',
            border: '1px solid var(--border-color)',
            background: 'var(--bg-main)',
            color: 'var(--text-primary)',
            outline: 'none',
            minHeight: '160px',
            resize: 'vertical',
            fontFamily: 'inherit',
            lineHeight: '1.5'
          }} />

          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="button" onClick={() => executeNewsSave(newsItem._id, newsItem)} style={{
              flex: 1,
              padding: '12px',
              background: '#10b981',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '700'
            }}>
              Save Changes
            </button>

            <button type="button" onClick={() => {
              setEditingNewsId(null);
              setIsEditNewsCropOpen(false);
            }} style={{
              flex: 1,
              padding: '12px',
              background: 'var(--bg-main)',
              color: 'var(--text-primary)',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '700'
            }}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="news-card-heading" style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: '12px',
            marginBottom: '10px'
          }}>
            <div style={{ minWidth: 0, paddingRight: '4px', flex: 1 }}>
              <h2 className="news-card-title" style={{
                margin: 0,
                fontSize: '1.22rem',
                fontWeight: '850',
                lineHeight: '1.35',
                letterSpacing: '-.01em'
              }}>
                {newsItem.title}
              </h2>

              <p className="news-card-byline" style={{
                margin: '6px 0 0',
                fontSize: '.72rem',
                color: 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                flexWrap: 'wrap'
              }}>
                <UserAvatar person={newsItem.createdBy} className="news-card-author-avatar" /><strong>{newsItem.createdBy?.username || 'System'}</strong>
                <span>•</span>
                <span>Published {formatTimeAgo(newsItem.createdAt)}</span>
              </p>
            </div>

            {canManagePost && <button type="button" data-post-menu-button={newsItem._id} onClick={e => {
              e.stopPropagation();
              setActiveMenuId(activeMenuId === newsItem._id ? null : newsItem._id);
            }} aria-label="Article options" style={{
              ...iconButtonStyle,
              width: '34px',
              height: '34px',
              minWidth: '34px',
              borderRadius: '50%',
              color: 'var(--text-secondary)',
              background: 'var(--bg-main)'
            }}>
              <MoreHorizontal size={19} />
            </button>}
          </div>

          {postMenu}

          {isNewsExpanded && newsItem.fullText ? (
            <div style={{
              margin: '10px 0 12px',
              fontSize: '.9rem',
              lineHeight: '1.65',
              color: 'var(--text-secondary)'
            }}>
              <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{newsItem.fullText}</p>

              <button type="button" onClick={e => {
                e.stopPropagation();
                setIsNewsExpanded(false);
              }} style={{
                marginTop: '7px',
                padding: 0,
                border: 'none',
                background: 'none',
                color: '#2563eb',
                cursor: 'pointer',
                fontWeight: '800'
              }}>
                Show less
              </button>
            </div>
          ) : (
            <p style={{
              margin: '10px 0 12px',
              fontSize: '.9rem',
              lineHeight: '1.55',
              color: 'var(--text-secondary)'
            }}>
              {previewText}

              {newsItem.fullText && newsItem.fullText.length > 180 && (
                <button type="button" onClick={e => {
                  e.stopPropagation();
                  setIsNewsExpanded(true);
                }} style={{
                  marginLeft: '6px',
                  padding: 0,
                  border: 'none',
                  background: 'none',
                  color: '#2563eb',
                  cursor: 'pointer',
                  fontWeight: '800'
                }}>
                  Read more
                </button>
              )}
            </p>
          )}

          {renderMedia()}

          {newsItem.videoPath && (
            <div style={{
              marginTop: mediaImages.length ? '10px' : '12px',
              borderRadius: '14px',
              overflow: 'hidden',
              background: '#000',
              position: 'relative',
              width: '100%',
              aspectRatio: '16 / 9',
              maxHeight: '520px'
            }} onClick={e => e.stopPropagation()}>
              <video src={mediaUrl(newsItem.videoPath)} controls preload="metadata" playsInline style={{
                display: 'block',
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                background: '#000'
              }} />
            </div>
          )}

          <div className="news-card-actions" style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
            marginTop: '13px',
            padding: '5px 2px'
          }}>
            <button type="button" onClick={e => {
              e.stopPropagation();
              setExpandedCommentsMap(prev => ({ ...prev, [newsItem._id]: !prev[newsItem._id] }));
            }} aria-label="Comments" style={{
              ...iconButtonStyle,
              height: '40px',
              padding: '0 10px',
              gap: '7px',
              borderRadius: '10px',
              color: commentsOpen ? '#2563eb' : 'var(--text-secondary)',
              background: commentsOpen ? 'rgba(37,99,235,.09)' : 'transparent',
              fontSize: '.75rem',
              fontWeight: '800'
            }}>
              <MessageCircle size={19} strokeWidth={2.2} />
              <span>Comments {localComments.length}</span>
            </button>

            <button type="button" onClick={onLikeClick} aria-label={hasLiked ? 'Unlike article' : 'Like article'} style={{
              ...iconButtonStyle,
              minWidth: '72px',
              height: '40px',
              padding: '0 10px',
              gap: '7px',
              borderRadius: '10px',
              color: hasLiked ? '#ef1748' : 'var(--text-secondary)',
              background: hasLiked ? 'rgba(239,23,72,.09)' : 'transparent',
              transform: heartAnimating ? 'scale(1.12)' : 'scale(1)'
            }}>
              <Heart size={20} strokeWidth={2.2} fill={hasLiked ? 'currentColor' : 'none'} />
              <span style={{ fontSize: '.75rem', fontWeight: '850' }}>{likeCount}</span>
            </button>

            <button type="button" onClick={handleShare} aria-label="Share article" style={{
              ...iconButtonStyle,
              minWidth: '72px',
              height: '40px',
              padding: '0 10px',
              gap: '7px',
              borderRadius: '10px',
              color: 'var(--text-secondary)',
              background: 'transparent',
              fontSize: '.75rem',
              fontWeight: '800'
            }}>
              <Share2 size={19} strokeWidth={2.2} />
              <span>Share</span>
            </button>
          </div>

          {commentsOpen && (
            <div style={{ marginTop: '9px' }} onClick={e => e.stopPropagation()}>
              <div style={{ maxHeight: '520px', overflowY: 'auto', paddingRight: '3px' }}>
                {localComments.length === 0 ? (
                  <div style={{
                    padding: '28px 0',
                    textAlign: 'center',
                    color: 'var(--text-secondary)',
                    fontSize: '.82rem'
                  }}>
                    <div style={{ marginBottom: '5px', display: 'flex', justifyContent: 'center' }}>
                      <MessageCircle size={25} />
                    </div>
                    <div>No discussion yet.</div>
                  </div>
                ) : (
                  <>
                    {localComments.slice(0, visibleComments).map((comment, index) => {
                      const approvals = comment.approvals || [];
                      const disapprovals = comment.disapprovals || [];
                      const replies = comment.replies || [];

                      const approvedByMe = !!currentUserId && approvals.some(id => String(typeof id === 'object' ? id._id : id) === String(currentUserId));
                      const disapprovedByMe = !!currentUserId && disapprovals.some(id => String(typeof id === 'object' ? id._id : id) === String(currentUserId));
                      const isEditing = editingCommentId === comment._id;

                      return (
                        <div key={comment._id || index} onMouseEnter={() => {
                          if (!isEditing) setHoveredCommentId(comment._id);
                        }} onMouseLeave={() => {
                          if (activeCommentMenu !== comment._id) setHoveredCommentId(null);
                        }} style={{
                          padding: '14px 0',
                          borderBottom: '1px solid var(--border-color)',
                          position: 'relative'
                        }}>
                          <div style={{ display: 'flex', gap: '10px' }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '7px',
                                flexWrap: 'wrap'
                              }}>
                                <span style={{
                                  width: '29px',
                                  height: '29px',
                                  minWidth: '29px',
                                  borderRadius: '50%',
                                  background: 'linear-gradient(135deg,#2563eb,#7c3aed)',
                                  color: '#fff',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '11px',
                                  fontWeight: '900'
                                }}>
                                  {getAvatarUrl(comment.profileImage || comment.userId?.profileImage) ? (
                                    <img src={getAvatarUrl(comment.profileImage || comment.userId?.profileImage)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                                  ) : (comment.user?.trim().charAt(0) || 'U')}
                                </span>

                                <strong style={{ fontSize: '.92rem' }}>{comment.user}</strong>

                                <span style={{ fontSize: '.78rem', color: 'var(--text-secondary)' }}>
                                  {formatTimeAgo(comment.createdAt)}
                                </span>

                                {!isEditing && canManageComment(comment) && (
                                  <button type="button" data-comment-menu-button={comment._id} onClick={e => {
                                    e.stopPropagation();
                                    setActiveCommentMenu(activeCommentMenu === comment._id ? null : comment._id);
                                  }} aria-label="Comment options" style={{
                                    ...iconButtonStyle,
                                    marginLeft: 'auto',
                                    width: '29px',
                                    height: '29px',
                                    borderRadius: '50%',
                                    color: 'var(--text-secondary)',
                                    background: hoveredCommentId === comment._id || activeCommentMenu === comment._id ? 'var(--bg-main)' : 'transparent'
                                  }}>
                                    <MoreHorizontal size={17} />
                                  </button>
                                )}
                              </div>

                              {isEditing ? (
                                <div style={{ paddingLeft: '39px', marginTop: '8px' }}>
                                  <textarea value={editingCommentText} onChange={e => setEditingCommentText(e.target.value)} rows={3} autoFocus style={{
                                    width: '100%',
                                    boxSizing: 'border-box',
                                    resize: 'vertical',
                                    padding: '9px 11px',
                                    borderRadius: '10px',
                                    border: '1px solid var(--border-color)',
                                    background: 'var(--bg-main)',
                                    color: 'var(--text-primary)',
                                    outline: 'none',
                                    fontFamily: 'inherit',
                                    fontSize: '.8rem',
                                    lineHeight: '1.45'
                                  }} />

                                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', marginTop: '6px' }}>
                                    <button type="button" onClick={cancelEditingComment} style={{
                                      ...iconButtonStyle,
                                      padding: '5px 8px',
                                      fontWeight: '700',
                                      color: 'var(--text-secondary)'
                                    }}>
                                      Cancel
                                    </button>

                                    <button type="button" disabled={!editingCommentText.trim()} onClick={() => saveEditedComment(comment)} style={{
                                      ...iconButtonStyle,
                                      padding: '6px 11px',
                                      borderRadius: '7px',
                                      background: 'var(--text-primary)',
                                      color: 'var(--bg-card)',
                                      fontWeight: '800',
                                      opacity: editingCommentText.trim() ? 1 : .5
                                    }}>
                                      Save
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <div style={{
                                    paddingLeft: '39px',
                                    marginTop: '5px',
                                    fontSize: '.84rem',
                                    lineHeight: '1.5',
                                    whiteSpace: 'pre-wrap',
                                    wordBreak: 'break-word'
                                  }}>
                                    {comment.text}
                                  </div>

                                  <div style={{
                                    paddingLeft: '39px',
                                    marginTop: '9px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    flexWrap: 'wrap'
                                  }}>
                                    <button type="button" onClick={() => handleCommentApprove(newsItem._id, comment._id)} style={{
                                      ...iconButtonStyle,
                                      gap: '5px',
                                      padding: '5px 8px',
                                      borderRadius: '8px',
                                      color: approvedByMe ? '#2563eb' : 'var(--text-secondary)',
                                      background: approvedByMe ? 'rgba(37,99,235,.1)' : 'transparent',
                                      fontSize: '.78rem',
                                      fontWeight: '900'
                                    }}>
                                      <ThumbsUp size={14} strokeWidth={2.2} />
                                      {approvals.length}
                                    </button>

                                    <button type="button" onClick={() => handleCommentDisapprove(newsItem._id, comment._id)} style={{
                                      ...iconButtonStyle,
                                      gap: '5px',
                                      padding: '5px 8px',
                                      borderRadius: '8px',
                                      color: disapprovedByMe ? '#ef4444' : 'var(--text-secondary)',
                                      background: disapprovedByMe ? 'rgba(239,68,68,.1)' : 'transparent',
                                      fontSize: '.78rem',
                                      fontWeight: '900'
                                    }}>
                                      <ThumbsDown size={14} strokeWidth={2.2} />
                                      {disapprovals.length}
                                    </button>

                                    <button type="button" onClick={() => setExpandedReplies(prev => ({ ...prev, [comment._id]: !prev[comment._id] }))} style={{
                                      ...iconButtonStyle,
                                      gap: '5px',
                                      padding: '5px 8px',
                                      borderRadius: '8px',
                                      color: 'var(--text-secondary)',
                                      background: 'transparent',
                                      fontSize: '.78rem',
                                      fontWeight: '900'
                                    }}>
                                      <Reply size={14} strokeWidth={2.2} />
                                      {replies.length > 0 ? `${replies.length} ${replies.length === 1 ? 'reply' : 'replies'}` : 'Reply'}
                                    </button>
                                  </div>

                                  {expandedReplies[comment._id] && (
                                    <div style={{
                                      marginLeft: '39px',
                                      marginTop: '11px',
                                      paddingLeft: '12px',
                                      borderLeft: '2px solid var(--border-color)'
                                    }}>
                                      {replies.length > 0 && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                                          {replies.map(reply => {
                                            const replyApprovals = reply.approvals || [];
                                            const replyDisapprovals = reply.disapprovals || [];

                                            const replyApproved = !!currentUserId && replyApprovals.some(id => String(typeof id === 'object' ? id._id : id) === String(currentUserId));
                                            const replyDisapproved = !!currentUserId && replyDisapprovals.some(id => String(typeof id === 'object' ? id._id : id) === String(currentUserId));

                                            return (
                                              <div key={reply._id} style={{ padding: '9px 0 10px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                                                  <span style={{
                                                    width: '23px',
                                                    height: '23px',
                                                    minWidth: '23px',
                                                    borderRadius: '50%',
                                                    background: 'var(--text-primary)',
                                                    color: 'var(--bg-card)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '11px',
                                                    fontWeight: '900'
                                                  }}>
                                                    {getAvatarUrl(reply.profileImage || reply.userId?.profileImage) ? (
                                                      <img src={getAvatarUrl(reply.profileImage || reply.userId?.profileImage)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                                                    ) : (reply.user?.trim().charAt(0) || 'U')}
                                                  </span>

                                                  <span style={{ fontWeight: '800', fontSize: '.86rem' }}>{reply.user}</span>

                                                  <span style={{ fontSize: '.74rem', color: 'var(--text-secondary)' }}>
                                                    {formatTimeAgo(reply.createdAt)}
                                                  </span>
                                                </div>

                                                <div style={{
                                                  marginTop: '4px',
                                                  fontSize: '.9rem',
                                                  lineHeight: '1.45',
                                                  whiteSpace: 'pre-wrap',
                                                  wordBreak: 'break-word'
                                                }}>
                                                  {reply.text}
                                                </div>

                                                <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                                                  <button type="button" onClick={() => voteReply(comment._id, reply._id, 'approve')} style={{
                                                    ...iconButtonStyle,
                                                    gap: '4px',
                                                    padding: '4px 7px',
                                                    borderRadius: '8px',
                                                    color: replyApproved ? '#2563eb' : 'var(--text-secondary)',
                                                    background: replyApproved ? 'rgba(37,99,235,.1)' : 'transparent',
                                                    fontSize: '.74rem',
                                                    fontWeight: '900'
                                                  }}>
                                                    <ThumbsUp size={13} strokeWidth={2.2} />
                                                    {replyApprovals.length}
                                                  </button>

                                                  <button type="button" onClick={() => voteReply(comment._id, reply._id, 'disapprove')} style={{
                                                    ...iconButtonStyle,
                                                    gap: '4px',
                                                    padding: '4px 7px',
                                                    borderRadius: '8px',
                                                    color: replyDisapproved ? '#ef4444' : 'var(--text-secondary)',
                                                    background: replyDisapproved ? 'rgba(239,68,68,.1)' : 'transparent',
                                                    fontSize: '.74rem',
                                                    fontWeight: '900'
                                                  }}>
                                                    <ThumbsDown size={13} strokeWidth={2.2} />
                                                    {replyDisapprovals.length}
                                                  </button>
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      )}

                                      <div style={{
                                        display: 'flex',
                                        gap: '6px',
                                        marginTop: '6px',
                                        paddingBottom: '2px'
                                      }}>
                                        <input value={replyText[comment._id] || ''} onChange={e => setReplyText(prev => ({ ...prev, [comment._id]: e.target.value }))} onKeyDown={e => {
                                          if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            sendReply(comment._id);
                                          }
                                        }} placeholder="Write a reply..." style={{
                                          flex: 1,
                                          minWidth: 0,
                                          height: '36px',
                                          boxSizing: 'border-box',
                                          padding: '0 10px',
                                          borderRadius: '9px',
                                          border: '1px solid var(--border-color)',
                                          background: 'var(--bg-main)',
                                          color: 'var(--text-primary)',
                                          outline: 'none',
                                          fontSize: '.73rem'
                                        }} />

                                        <button type="button" disabled={!replyText[comment._id]?.trim() || replyBusy[comment._id]} onClick={() => sendReply(comment._id)} aria-label="Post reply" style={{
                                          ...iconButtonStyle,
                                          width: '38px',
                                          height: '36px',
                                          borderRadius: '9px',
                                          background: replyText[comment._id]?.trim() ? 'var(--text-primary)' : 'var(--bg-main)',
                                          color: replyText[comment._id]?.trim() ? 'var(--bg-card)' : 'var(--text-secondary)',
                                          cursor: replyText[comment._id]?.trim() ? 'pointer' : 'not-allowed',
                                          opacity: replyText[comment._id]?.trim() ? 1 : .6
                                        }}>
                                          {replyBusy[comment._id] ? '...' : <Send size={15} />}
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {visibleComments < localComments.length && (
                      <button type="button" onClick={loadMoreComments} style={{
                        width: '100%',
                        marginTop: '12px',
                        padding: '10px 14px',
                        border: '1px solid var(--border-color)',
                        borderRadius: '11px',
                        background: 'var(--bg-main)',
                        color: 'var(--text-primary)',
                        cursor: 'pointer',
                        fontWeight: '800',
                        fontSize: '.76rem'
                      }}>
                        Load more comments
                        <span style={{ marginLeft: '6px', color: 'var(--text-secondary)' }}>
                          ({Math.min(10, localComments.length - visibleComments)} more)
                        </span>
                      </button>
                    )}
                  </>
                )}
              </div>

              {commentMenu}

              <form className="news-comment-composer" onSubmit={async e => {
                e.preventDefault();

                const text = newComment.trim();

                if (!text) return;

                try {
                  const result = await handleCommentSubmit(e, newsItem._id);

                  const createdComment =
                    result?.comment ||
                    result?.data?.comment ||
                    null;

                  if (createdComment) {
                    setLocalComments(prev => {
                      const exists = prev.some(
                        comment =>
                          String(comment._id) === String(createdComment._id)
                      );

                      if (exists) return prev;

                      return [
                        createdComment,
                        ...prev
                      ];
                    });
                  }
                } catch (error) {
                  console.error('COMMENT SUBMIT ERROR:', error);
                }
              }} style={{
                display: 'flex',
                gap: '7px',
                marginTop: '12px',
                alignItems: 'center'
              }}>
                <input className="news-comment-input" type="text" value={newComment} onChange={e => setNewComment(e.target.value)} onFocus={() => setCommentTextFocused(true)} onBlur={() => setCommentTextFocused(false)} placeholder="Write a comment..." style={{
                  flex: 1,
                  minWidth: 0,
                  height: '40px',
                  boxSizing: 'border-box',
                  padding: '0 12px',
                  border: `1px solid ${commentTextFocused ? '#94a3b8' : 'var(--border-color)'}`,
                  background: 'var(--bg-main)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  borderRadius: '11px',
                  fontSize: '.82rem'
                }} />

                <button type="submit" disabled={!newComment.trim()} aria-label="Post comment" style={{
                  ...iconButtonStyle,
                  width: '42px',
                  height: '40px',
                  borderRadius: '11px',
                  background: newComment.trim() ? 'linear-gradient(135deg,#2563eb,#7c3aed)' : 'var(--bg-main)',
                  color: newComment.trim() ? '#fff' : 'var(--text-secondary)',
                  cursor: newComment.trim() ? 'pointer' : 'not-allowed',
                  opacity: newComment.trim() ? 1 : .6,
                  boxShadow: newComment.trim() ? '0 5px 14px rgba(37,99,235,.2)' : 'none'
                }}>
                  <Send size={16} />
                </button>
              </form>
            </div>
          )}
        </>
      )}
    </article>
  );
}

export default NewsCard;
