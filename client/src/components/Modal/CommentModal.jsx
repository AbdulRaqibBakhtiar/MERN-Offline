import React from 'react';

function CommentModal({ 
  isOpen, 
  onClose, 
  newsItem, 
  newComment, 
  setNewComment, 
  onCommentSubmit, 
  onCommentDelete, 
  formatTimeAgo 
}) {
  if (!isOpen || !newsItem) return null;
  const commentsList = newsItem.comments || [];

  return (
    <div 
      onClick={onClose} 
      style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', fontFamily: 'system-ui, -apple-system, sans-serif', animation: 'commentOverlayFade 0.2s ease-out' }} 
    >
      <style>{`
        @keyframes commentOverlayFade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes commentSheetSlide { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      {/* Modal Card Layout Window */}
      <div 
        onClick={(e) => e.stopPropagation()} 
        style={{ width: '100%', maxWidth: '500px', background: 'var(--bg-card, #ffffff)', borderRadius: '16px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.15), 0 10px 10px -5px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', maxHeight: '85vh', overflow: 'hidden', animation: 'commentSheetSlide 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}
        className="modal"
      >
        {/* Header Region */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color, #e2e8f0)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-primary, #0f172a)' }}>Discussion Feed</h3>
            <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted, #64748b)' }}>On: "{newsItem.title}"</p>
          </div>
          <button type="button" onClick={onClose} style={{ border: 'none', background: 'var(--bg-main, #f1f5f9)', width: '28px', height: '28px', borderRadius: '50%', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--text-muted, #64748b)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>&times;</button>
        </div>

        {/* Scrollable Container Content Body */}
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '10px', background: 'var(--bg-main, #fafafa)' }}>
          {commentsList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 10px', color: 'var(--text-muted, #94a3b8)', fontSize: '0.9rem' }}>
              💬 No replies posted yet. Be the first to kickstart the chat!
            </div>
          ) : (
            commentsList.map((comment) => (
              <div key={comment._id || Math.random()} style={{ padding: '10px 12px', background: 'var(--bg-card, #ffffff)', borderRadius: '10px', border: '1px solid var(--border-color, #e2e8f0)', position: 'relative', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ color: '#38bdf8', fontSize: '0.85rem', fontWeight: '600' }}>{comment.user}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted, #94a3b8)' }}>{formatTimeAgo(comment.createdAt)}</span>
                    <button type="button" onClick={() => onCommentDelete(newsItem._id, comment._id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: '0.8rem', opacity: 0.5 }} onMouseEnter={(e) => e.target.style.opacity = '1'} onMouseLeave={(e) => e.target.style.opacity = '0.5'}>🗑️</button>
                  </div>
                </div>
                <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-primary, #334155)', lineHeight: '1.4', paddingRight: '16px' }}>{comment.text}</p>
              </div>
            ))
          )}
        </div>

        {/* Persistent Input Submission Footer Panel */}
        <form onSubmit={(e) => onCommentSubmit(e, newsItem._id)} style={{ padding: '16px 20px', borderTop: '1px solid var(--border-color, #e2e8f0)', display: 'flex', gap: '8px', background: 'var(--bg-card, #ffffff)' }}>
          <input type="text" placeholder="Add to the conversation..." value={newComment} onChange={(e) => setNewComment(e.target.value)} style={{ flex: 1, padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color, #cbd5e1)', fontSize: '0.88rem', outline: 'none', background: 'var(--bg-main, transparent)', color: 'var(--text-primary, inherit)' }} />
          <button type="submit" style={{ padding: '10px 16px', background: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '0.88rem', cursor: 'pointer' }}>
            Reply
          </button>
        </form>
      </div>
    </div>
  );
}

export default CommentModal;
