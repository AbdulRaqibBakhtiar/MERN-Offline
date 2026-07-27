import React from 'react';

function NewsCard({
  newsItem, editingNewsId, setEditingNewsId, editNewsPreviewUrl, setIsNewsCropOpen,
  setIsEditNewsCropOpen, editTitle, setEditTitle, editSummary, setEditSummary,
  editFullText, setEditFullText, executeNewsSave, setSearchCategory, activeMenuId,
  setActiveMenuId, startEditingNews, openDeleteModal, isNewsExpanded, setIsNewsExpanded,
  expandedCommentsMap, setExpandedCommentsMap, handleCommentDelete, handleCommentSubmit,
  newComment, setNewComment
}) {

  const formatTimeAgo = (dateString) => {
    if (!dateString) return '';
    const now = new Date();
    const past = new Date(dateString);
    const msPerMinute = 60 * 1000;
    const msPerHour = msPerMinute * 60;
    const msPerDay = msPerHour * 24;
    const elapsed = now - past;
    if (elapsed < msPerMinute) return 'Just now';
    if (elapsed < msPerHour) return Math.round(elapsed / msPerMinute) + 'm ago';
    if (elapsed < msPerDay) return Math.round(elapsed / msPerHour) + 'h ago';
    return past.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  return (
    /* 🚀 OVERHAULED BRIGHT WHITE SYSTEM CARD FRAME WITH FADED BORDER */
    <article
      className="panel-card news-article home-feed-item-card"
      onClick={() => setSearchCategory("news")} hover
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        padding: '16px 16px 8px 16px',
        padding: '16px',
        boxSizing: 'border-box',
        boxShadow: '0 4px 12px rgba(0,0,0,.06)',
        position: 'relative',
        color: 'var(--text-primary)',
        transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.25s ease'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow =
          '0 8px 20px rgba(0,0,0,.08)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.05)';
      }}
    >
      {editingNewsId === newsItem._id ? (
        <div className="home-inline-editor-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <span style={{ fontSize: '0.8rem', background: '#f1f5f9', color: '#1e293b', padding: '6px 12px', borderRadius: '8px', fontWeight: '800', alignSelf: 'flex-start' }} className="home-edit-badge">⚡ Editing Active Announcement</span>

          <div style={{ width: '100%', height: 'auto', borderRadius: '14px', overflow: 'hidden', background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {editNewsPreviewUrl ? (
              <img src={editNewsPreviewUrl} alt="Preview" style={{ width: '100%', height: 'auto', maxHeight: '420px', objectFit: 'contain', display: 'block' }} />
            ) : newsItem.imagePath ? (
              <img src={`http://localhost:5000${newsItem.imagePath}`} alt="Current" style={{ width: '100%', height: 'auto', maxHeight: '420px', objectFit: 'contain', display: 'block' }} />
            ) : (
              <span style={{ fontSize: '0.9rem', color: '#64748b', padding: '32px 0', fontWeight: '600' }}>No Photo Attached</span>
            )}
          </div>
          <button type="button" onClick={() => setIsEditNewsCropOpen(true)} style={{ padding: '10px 14px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: '700', color: '#1e293b' }}>📷 Modify Post Photo Asset...</button>
          <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8fafc', color: '#0f172a', outline: 'none', fontSize: '0.9rem', fontWeight: '700' }} />
          <input type="text" value={editSummary} onChange={(e) => setEditSummary(e.target.value)} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8fafc', color: '#0f172a', outline: 'none', fontSize: '0.88rem', fontWeight: '500' }} />
          <textarea value={editFullText} onChange={(e) => setEditFullText(e.target.value)} style={{ padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8fafc', color: '#0f172a', outline: 'none', minHeight: '120px', resize: 'vertical', fontFamily: 'inherit', fontSize: '0.88rem', lineHeight: '1.5' }} />
          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="button" onClick={() => executeNewsSave(newsItem._id, newsItem)} style={{ padding: '12px', background: '#10b981', color: '#ffffff', border: 'none', borderRadius: '8px', cursor: 'pointer', flex: 1, fontWeight: '700', fontSize: '#0.88rem', boxShadow: '0 4px 12px rgba(16,185,129,0.25)' }}>Save Changes</button>
            <button type="button" onClick={() => setEditingNewsId(null)} style={{ padding: '12px', background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#1e293b', borderRadius: '8px', cursor: 'pointer', flex: 1, fontWeight: '700', fontSize: '0.88rem' }}>Cancel</button>
          </div>
        </div>
      ) : (
        <React.Fragment>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }} className="home-card-header-flex-row">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              {/* 🌟 BRIGHT MODERN HIGH-CONTRAST TYPOGRAPHY */}
              <h2 style={{
                margin: 0,
                fontSize: '1.22rem',
                fontWeight: '800',
                color: 'var(--text-primary)',
                letterSpacing: '-0.02em',
                lineHeight: '1.35'
              }}>{newsItem.title}</h2>
              <p
                style={{
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '.76rem',
                  color: 'var(--text-secondary)',
                  fontWeight: '500'
                }}
              >
                <strong style={{ color: 'var(--text-primary)' }}>
                  {newsItem.createdBy?.username || "System"}
                </strong>

                <span style={{ color: 'var(--border-color)' }}>•</span>

                <span>{formatTimeAgo(newsItem.createdAt)}</span>
              </p>
            </div>

            <div style={{ position: 'relative' }} onClick={(e) => e.stopPropagation()}>
              <button type="button" aria-label="Open article options configuration menu" onClick={() => setActiveMenuId(activeMenuId === newsItem._id ? null : newsItem._id)} style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                border: 'none',
                background: 'var(--bg-main)',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                transition: '.2s'
              }} onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--border-color)";
                e.currentTarget.style.color = "var(--text-primary)";
              }} onMouseLeave={(e) => {
                e.currentTarget.style.background = "var(--bg-main)";
                e.currentTarget.style.color = "var(--text-secondary)";
              }}>⋮</button>
              {activeMenuId === newsItem._id && (
                <div style={{
                  position: 'absolute', top: '100%', right: 0, background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '14px',
                  padding: '8px',
                  boxShadow: '0 12px 30px rgba(0,0,0,.12)', minWidth: '170px', zIndex: 50
                }}>
                  <button type="button" onClick={() => { startEditingNews(newsItem); setActiveMenuId(null); }} style={{ width: '100%', textAlign: 'left', padding: '10px 14px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: '700', borderRadius: '8px' }} onMouseEnter={(e) => e.target.style.background = 'var(--bg-main)'} onMouseLeave={(e) => e.target.style.background = 'none'}>⚙️ Edit Article</button>
                  <button type="button" aria-label="Delete this announcement post completely" onClick={() => { openDeleteModal(newsItem._id); setActiveMenuId(null); }} style={{ width: '100%', textAlign: 'left', padding: '10px 14px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem', color: '#ef4444', fontWeight: '800', borderRadius: '8px' }} onMouseEnter={(e) => e.target.style.background = 'rgba(239,68,68,.08)'} onMouseLeave={(e) => e.target.style.background = 'none'}>🗑️ Remove Post</button>
                </div>
              )}
            </div>
          </div>

          {/* 🖼️ ASPECT CONFINED IMAGE CONTAINER FRAME WITH CRISP NEUTRAL BORDER */}
          <div style={{
            width: '100%', height: 'auto', borderRadius: '12px', overflow: 'hidden', background: 'var(--bg-main)',
            border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }} className="home-landscape-crop-frame">
            {newsItem.imagePath ? (
              <img src={`http://localhost:5000${newsItem.imagePath}`} alt="News" style={{
                width: '100%',
                height: 'auto',
                maxHeight: '300px',
                objectFit: 'cover',
                display: 'block'
              }} />
            ) : (
              <div style={{ width: '100%', padding: '48px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '0.92rem', fontWeight: '700' }}>Primary News Photo Blueprint Node</div>
            )}
          </div>
          {isNewsExpanded && newsItem.fullText ? (
            <div style={{ background: 'var(--bg-main)', padding: '16px', borderRadius: '14px', margin: '14px 0', border: '1px solid var(--border-color)', lineHeight: '1.65', fontSize: '0.95rem', color: 'var(--text-primary)', fontWeight: '500' }} className="news-text-full">
              <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{newsItem.fullText}</p>
            </div>
          ) : (
            <p style={{ fontSize: '0.95rem', lineHeight: '1.6', color: 'var(--text-primary)', margin: '0 0 10px 0', fontWeight: '500' }} className="news-text-summary">{newsItem.summary}</p>
          )}

          {/* MODERN SHIMMER READ PILL BADGE ACTION */}
          <div
            style={{
              marginTop: '14px',
              paddingTop: '12px',
              borderTop: '1px solid #ececec',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
            className="home-card-actions-wrapper-row"
          >
            <button
              type="button"
              aria-label={isNewsExpanded ? "Collapse full article text details" : "Expand full article text details"}
              onClick={() => setIsNewsExpanded(!isNewsExpanded)}
              style={{
                background: 'var(--bg-main)',
                border: '1px solid var(--border-color)',
                padding: '8px 16px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                color: '#2563eb',
                fontWeight: '700',
                fontSize: '0.88rem',
                borderRadius: '999px',
                transition: 'all .25s ease',
                fontFamily: '"Inter", "Segoe UI", sans-serif'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#2563eb';
                e.currentTarget.style.color = '#ffffff';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 14px rgba(37,99,235,.25)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--bg-main)';
                e.currentTarget.style.color = '#2563eb';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
              className="home-styled-readmore-btn"
            >
              <>
                {isNewsExpanded ? "Show less" : "Continue reading"}

                <span>
                  {isNewsExpanded ? "↑" : "→"}
                </span>
              </>
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setExpandedCommentsMap(prev => ({
                  ...prev,
                  [newsItem._id]: !prev[newsItem._id]
                }));
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'var(--bg-main)',
                border: '1px solid var(--border-color)',
                borderRadius: '20px',
                padding: '6px 12px',
                cursor: 'pointer',
                transition: '0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--border-color)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--bg-main)';
              }}
            >

              <span style={{ fontSize: '0.95rem' }}>💬</span>

              <span
                style={{
                  background: '#111',
                  color: '#fff',
                  borderRadius: '999px',
                  padding: '2px 8px',
                  fontSize: '0.75rem',
                  fontWeight: '700'
                }}
              >
                {(newsItem.comments || []).length}
              </span>

            </button>
          </div>

          {/* 💬 CLEAN DISCUSSION STREAM LAYER SECTION WITH FADED GREY BREAKS */}
          <div style={{ marginTop: '12px', paddingTop: '20px', borderTop: '1px solid var(--border-color)' }} className="news-comments-section">

            {(() => {
              const commentsList = newsItem.comments || [];
              const isExpanded = !!expandedCommentsMap[newsItem._id];
              return (
                <React.Fragment>
                  <div
                    style={{
                      maxHeight: isExpanded ? '340px' : 'none',
                      overflowY: isExpanded ? 'auto' : 'visible',
                      marginBottom: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px'
                    }}
                    className="comments-list"
                  >
                    {isExpanded &&
                      commentsList.map((comment, commentIdx) => (

                        /* 🏢 PURE WHITE CARDS FOR COMMENTS WITH GREY EDGE HIGHLIGHTS */
                        <div
                          key={comment._id || `comment_node_${commentIdx}`}
                          style={{
                            padding: '10px 0',
                            background: 'transparent',
                            borderBottom: '1px solid var(--border-color)',
                            position: 'relative'
                          }}
                          className="comment-bubble"
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>

                              {/* 👤 REFACTORED LEGIBLE UNIQUE FIRST-LETTER PROFILE ICON */}
                              <span style={{
                                width: '22px',
                                height: '22px',
                                minWidth: '22px',
                                minHeight: '22px',
                                borderRadius: '50%',
                                background: '#111',
                                color: '#ffffff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '11px',
                                fontWeight: '900',
                                textTransform: 'uppercase',
                                lineHeight: '1',
                                textAlign: 'center',
                                boxShadow: '0 2px 4px rgba(37,99,235,0.2)'
                              }}>
                                {comment.user ? comment.user.trim().charAt(0) : 'U'}
                              </span>

                              <strong style={{ color: 'var(--text-primary)', fontSize: '0.8rem', fontWeight: '800' }}>{comment.user}</strong>
                              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: '500' }}>{formatTimeAgo(comment.createdAt)}</span>
                            </div>
                            <button type="button" aria-label="Delete comment string" onClick={(e) => { e.stopPropagation(); handleCommentDelete(newsItem._id, comment._id); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: '0.8rem', opacity: 0.5, transition: 'all 0.2s', color: '#ef4444' }} onMouseEnter={(e) => e.target.style.opacity = 1} onMouseLeave={(e) => e.target.style.opacity = 0.5} title="Delete Comment">🗑️</button>
                          </div>
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)', display: 'block', lineHeight: '1.5', fontWeight: '500', paddingLeft: '32px' }}>{comment.text}</span>
                        </div>
                      ))}
                  </div>
                </React.Fragment>
              );
            })()}

            {/* Comment Entry Input Box Component Form */}
            {expandedCommentsMap[newsItem._id] && (
              <form onSubmit={(e) => handleCommentSubmit(e, newsItem._id)} style={{ display: 'flex', gap: '8px', marginTop: '14px' }} className="comment-form-box" onClick={(e) => e.stopPropagation()}>
                <input type="text" placeholder="Add to the conversation discussion..." value={newComment} onChange={(e) => setNewComment(e.target.value)} style={{
                  fontSize: '0.85rem', padding: '12px 16px', flex: 1, margin: 0, borderRadius: '10px', background: 'var(--bg-main)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)', outline: 'none', transition: 'all 0.2s'
                }} onFocus={(e) => e.target.style.borderColor = 'var(--text-primary)'} onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'} className="input-field" />
                <button type="submit" style={{ padding: '12px 20px', fontSize: '0.85rem', margin: 0, width: 'auto', background: '#111', color: '#ffffff', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', transition: 'background 0.2s', boxShadow: '0 4px 12px rgba(37,99,235,0.2)' }} onMouseEnter={(e) => e.currentTarget.style.background = '#1d4ed8'} onMouseLeave={(e) => e.currentTarget.style.background = '#111'} className="add-button">Reply</button>
              </form>)}
          </div>
        </React.Fragment>
      )
      }
    </article >
  );
}

export default NewsCard;
