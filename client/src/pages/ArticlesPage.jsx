import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Archive, ArrowDown, ArrowUp, CalendarDays, Check, Clock3, History, ImagePlus, Link2, LoaderCircle, MessageCircle, MoreHorizontal, Pencil, Plus, RotateCcw, Search, Send, Trash2, Video, X } from 'lucide-react';
import api from '../api/axios';
import { API_BASE_URL } from '../api/config';
import DeleteModal from '../components/Modal/DeleteModal';
import Toast from '../components/Layout/Toast';
import UserAvatar from '../components/Layout/UserAvatar';

const emptyBlock = type => ({ type, text: '', url: '', caption: '' });
const displayName = user => user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user?.username || 'Reader';
const mediaUrl = url => /^(https?:|blob:|data:)/i.test(url || '') ? url : `${API_BASE_URL}${url || ''}`;
const asLocalDateTime = value => { const date = new Date(value); date.setMinutes(date.getMinutes() - date.getTimezoneOffset()); return date.toISOString().slice(0, 16); };
const localDateTimeNow = () => asLocalDateTime(Date.now() + 60000);
const ARTICLE_STATES = [
  { id: 'all', label: 'All articles' }, { id: 'draft', label: 'Drafts' },
  { id: 'in_review', label: 'In review' }, { id: 'scheduled', label: 'Scheduled' },
  { id: 'published', label: 'Published' }, { id: 'archived', label: 'Archived' }
];
const ARTICLE_CATEGORIES = [{ id: 'all', label: 'All topics' }, { id: 'marketplace', label: 'Marketplace' }, { id: 'business', label: 'Business' }, { id: 'guides', label: 'Guides' }, { id: 'news', label: 'News' }, { id: 'community', label: 'Community' }];
const statusLabel = status => ({ draft: 'Draft', in_review: 'In review', scheduled: 'Scheduled', published: 'Published', archived: 'Archived' }[status] || 'Draft');

function ArticleBody({ blocks }) {
  return <div className="article-body">
    {(blocks || []).map((block, index) => {
      if (block.type === 'heading') return <h2 key={index}>{block.text}</h2>;
      if (block.type === 'quote') return <blockquote key={index}>{block.text}</blockquote>;
      if (block.type === 'link') return <p className="article-link-block" key={index}><Link2 size={17} /><a href={block.url} target="_blank" rel="noreferrer">{block.text || block.url}</a></p>;
      if (block.type === 'image') return <figure key={index}><img src={mediaUrl(block.url)} alt={block.caption || ''} loading="lazy" />{block.caption && <figcaption>{block.caption}</figcaption>}</figure>;
      if (block.type === 'video') return <figure key={index}><video src={mediaUrl(block.url)} controls preload="metadata" />{block.caption && <figcaption>{block.caption}</figcaption>}</figure>;
      return <p key={index}>{block.text}</p>;
    })}
  </div>;
}

export default function ArticlesPage({ user, searchQuery = '', onClearSearch, publicOnly = false }) {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [autosaving, setAutosaving] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState({});
  const [commentText, setCommentText] = useState({});
  const [replyText, setReplyText] = useState({});
  const [busyComment, setBusyComment] = useState('');
  const [filter, setFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [articleSearch, setArticleSearch] = useState('');
  const [autosaveState, setAutosaveState] = useState('');
  const [revisionsOpen, setRevisionsOpen] = useState({});
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState(null);
  const [openArticleMenuId, setOpenArticleMenuId] = useState(null);
  const canAuthorArticles = ['admin', 'editor', 'author'].includes(user?.role);
  const canManageArticle = article => ['admin', 'editor'].includes(user?.role) || (
    user?.role === 'author' && String(article.editor?._id || article.editor) === String(user?._id || user?.id)
  );
  const isEditorialManager = ['admin', 'editor'].includes(user?.role);
  const autosaveSequence = useRef(0);
  const lastAutosavedSignature = useRef('');
  const editingRef = useRef(null);
  const viewedArticleIds = useRef(new Set());
  editingRef.current = editing;
  const closeToast = useCallback(() => setToast(null), []);
  useEffect(() => { setFilter('all'); setArticleSearch(''); setCategoryFilter('all'); }, [searchQuery]);
  const notify = (message, type = 'success') => setToast({ message, type, id: Date.now() });
  useEffect(() => () => editingRef.current?.contents.forEach(block => {
    if (block.previewUrl) URL.revokeObjectURL(block.previewUrl);
  }), []);

  const loadArticles = useCallback(async ({ showLoading = true } = {}) => {
    if (showLoading) setLoading(true);
    setError('');
    try { const response = await api.get(publicOnly ? '/articles/public' : '/articles'); setArticles(Array.isArray(response.data) ? response.data : []); }
    catch (err) { setError(err.response?.data?.error || 'Could not load articles.'); }
    finally { if (showLoading) setLoading(false); }
  }, [publicOnly]);
  useEffect(() => {
    loadArticles();
    const refreshTimer = window.setInterval(() => loadArticles({ showLoading: false }), 60000);
    return () => window.clearInterval(refreshTimer);
  }, [loadArticles]);
  useEffect(() => {
    if (loading || typeof IntersectionObserver === 'undefined') return undefined;
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const id = entry.target.dataset.articleId;
        if (!entry.isIntersecting || !id || viewedArticleIds.current.has(id)) return;
        viewedArticleIds.current.add(id);
        observer.unobserve(entry.target);
        api.post(`/articles/${id}/view`).then(response => {
          setArticles(current => current.map(article => article._id === id ? { ...article, viewCount: response.data.viewCount } : article));
        }).catch(() => {});
      });
    }, { threshold: 0.2 });
    document.querySelectorAll('.article-card[data-article-id]').forEach(card => observer.observe(card));
    return () => observer.disconnect();
  }, [loading, articles.length]);
  useEffect(() => {
    if (!openArticleMenuId) return undefined;
    const closeOutside = event => {
      if (!event.target.closest('.article-actions')) setOpenArticleMenuId(null);
    };
    const closeOnEscape = event => { if (event.key === 'Escape') setOpenArticleMenuId(null); };
    document.addEventListener('mousedown', closeOutside);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeOutside);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [openArticleMenuId]);

  useEffect(() => {
    if (!editing || saving || autosaving) return undefined;
    if (editing.status === 'published') { setAutosaveState('Published edits save when you submit or publish'); return undefined; }
    if (editing.status === 'archived') { setAutosaveState('Restore this article before editing'); return undefined; }
    if (!editing.title.trim() || !editing.summary.trim()) { setAutosaveState('Add a title and summary to autosave'); return undefined; }
    if (editing.contents.some(block => block.file)) { setAutosaveState('Media will save with your next save or publish'); return undefined; }
    const snapshot = editing;
    const signature = JSON.stringify({ title: snapshot.title, summary: snapshot.summary, date: snapshot.date, contents: snapshot.contents });
    if (signature === lastAutosavedSignature.current) return undefined;
    const timer = setTimeout(async () => {
      const requestId = ++autosaveSequence.current;
      setAutosaveState('Saving draft…');
      const payload = {
        title: snapshot.title, summary: snapshot.summary, category: snapshot.category || 'community', date: new Date(`${snapshot.date}T12:00:00`).toISOString(),
        contents: JSON.stringify(snapshot.contents.map(({ type, text, url, caption }) => ({ type, text, url, caption })))
      };
      setAutosaving(true);
      try {
        const response = snapshot._id
          ? await api.put(`/articles/${snapshot._id}/autosave`, payload)
          : await api.post('/articles/autosave', payload);
        if (requestId !== autosaveSequence.current) return;
        lastAutosavedSignature.current = signature;
        const saved = response.data;
        setArticles(current => current.some(article => article._id === saved._id)
          ? current.map(article => article._id === saved._id ? saved : article)
          : [saved, ...current]);
        setEditing(current => current && current._id === snapshot._id ? { ...current, _id: saved._id, status: 'draft' } : current);
        setAutosaveState(`Saved ${new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`);
      } catch (err) {
        if (requestId === autosaveSequence.current) setAutosaveState(err.response?.data?.error || 'Autosave failed');
      } finally { setAutosaving(false); }
    }, 1400);
    return () => clearTimeout(timer);
  }, [editing, saving, autosaving]);

  const startNew = () => { setAutosaveState(''); setEditing({ _id: null, status: 'draft', title: '', summary: '', category: 'community', date: new Date().toISOString().slice(0, 10), scheduledFor: '', contents: [emptyBlock('paragraph')] }); };
  const startEdit = article => { setAutosaveState(''); setEditing({ ...article, category: article.category || 'community', date: new Date(article.date || article.createdAt).toISOString().slice(0, 10), scheduledFor: article.scheduledFor ? asLocalDateTime(article.scheduledFor) : '', contents: (article.contents || []).map(block => ({ ...block })) }); };
  const updateBlock = (index, updates) => setEditing(current => ({ ...current, contents: current.contents.map((block, i) => i === index ? { ...block, ...updates } : block) }));
  const addBlock = type => setEditing(current => ({ ...current, contents: [...current.contents, emptyBlock(type)] }));
  const moveBlock = (index, direction) => setEditing(current => {
    const next = [...current.contents]; const target = index + direction;
    if (target < 0 || target >= next.length) return current;
    [next[index], next[target]] = [next[target], next[index]];
    return { ...current, contents: next };
  });
  const removeBlock = index => setEditing(current => ({ ...current, contents: current.contents.filter((_, i) => i !== index) }));

  const attachFile = (index, type, file) => {
    if (!file) return;
    if (type === 'image' && !file.type.startsWith('image/')) return setError('Choose an image file.');
    if (type === 'video' && !file.type.startsWith('video/')) return setError('Choose a video file.');
    const previousPreview = editingRef.current?.contents[index]?.previewUrl;
    if (previousPreview) URL.revokeObjectURL(previousPreview);
    updateBlock(index, { file, previewUrl: URL.createObjectURL(file), url: '', text: '' }); setError('');
  };

  const closeEditor = () => {
    editingRef.current?.contents.forEach(block => { if (block.previewUrl) URL.revokeObjectURL(block.previewUrl); });
    setEditing(null); setPreviewOpen(false);
  };

  const saveArticle = async (event, nextStatus = 'draft') => {
    event?.preventDefault(); setSaving(true); setError('');
    try {
      const formData = new FormData();
      let fileIndex = 0;
      const contents = editing.contents.map(block => {
        if (!block.file) return { type: block.type, text: block.text, url: block.url, caption: block.caption };
        const currentFileIndex = fileIndex++;
        formData.append('media', block.file);
        return { type: block.type, text: block.text, url: '', caption: block.caption, fileIndex: currentFileIndex };
      });
      formData.append('title', editing.title); formData.append('summary', editing.summary);
      formData.append('category', editing.category || 'community');
      formData.append('date', new Date(`${editing.date}T12:00:00`).toISOString());
      formData.append('status', nextStatus);
      if (nextStatus === 'scheduled') formData.append('scheduledFor', new Date(editing.scheduledFor).toISOString());
      formData.append('contents', JSON.stringify(contents));
      const response = editing._id ? await api.put(`/articles/${editing._id}`, formData) : await api.post('/articles', formData);
      setArticles(current => current.some(article => article._id === response.data._id) ? current.map(article => article._id === response.data._id ? response.data : article) : [response.data, ...current]);
      notify(nextStatus === 'published' ? 'Article published.' : nextStatus === 'scheduled' ? 'Article scheduled.' : nextStatus === 'in_review' ? 'Article submitted for review.' : 'Draft saved.');
      closeEditor();
      setAutosaveState('');
    } catch (err) { setError(err.response?.data?.error || 'Could not save article.'); }
    finally { setSaving(false); }
  };

  const changeWorkflow = async (article, action, scheduledFor) => {
    try {
      const response = await api.patch(`/articles/${article._id}/workflow`, { action, scheduledFor });
      setArticles(current => current.map(item => item._id === article._id ? response.data : item));
      const messages = { submit_review: 'Article submitted for review.', withdraw_review: 'Article returned to drafts.', publish: 'Article published.', unpublish: 'Article unpublished.', unschedule: 'Article unscheduled.', archive: 'Article archived.', restore: 'Article restored to drafts.' };
      notify(messages[action] || 'Article workflow updated.');
    } catch (err) { notify(err.response?.data?.error || 'Could not update the article workflow.', 'error'); }
  };

  const restoreRevision = async (article, revision) => {
    if (!window.confirm('Restore this version? The current article will be kept in history.')) return;
    try {
      const response = await api.post(`/articles/${article._id}/revisions/${revision._id}/restore`);
      setArticles(current => current.map(item => item._id === article._id ? response.data : item));
      notify('Revision restored as a draft.');
    } catch (err) { notify(err.response?.data?.error || 'Could not restore this version.', 'error'); }
  };

  const effectiveArticleSearch = articleSearch.trim() || searchQuery.trim();
  const normalizedArticleQuery = effectiveArticleSearch.toLowerCase();
  const visibleArticles = articles.filter(article => {
    const matchesWorkflow = filter === 'all' || article.status === filter;
    const matchesCategory = categoryFilter === 'all' || (article.category || 'community') === categoryFilter;
    if (!matchesWorkflow || !matchesCategory || !normalizedArticleQuery) return matchesWorkflow && matchesCategory;
    const body = (article.contents || []).map(block => `${block.text || ''} ${block.caption || ''} ${block.url || ''}`).join(' ');
    return [article.title, article.summary, body].some(value => (value || '').toLowerCase().includes(normalizedArticleQuery));
  }).sort((a, b) => {
    const score = article => (Number(article.viewCount) || 0) + (article.comments || []).length * 4 + (article.comments || []).reduce((sum, comment) => sum + (comment.replies || []).length, 0) * 2;
    return score(b) - score(a) || new Date(b.publishedAt || b.date || b.createdAt) - new Date(a.publishedAt || a.date || a.createdAt);
  });
  const visibleWorkflowStates = isEditorialManager || user?.role === 'author'
    ? ARTICLE_STATES
    : [{ id: 'all', label: 'Published' }];

  const deleteArticle = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/articles/${deleteTarget._id}`);
      setArticles(current => current.filter(item => item._id !== deleteTarget._id));
      setDeleteTarget(null);
      notify('Article deleted.');
    } catch (err) { notify(err.response?.data?.error || 'Could not delete article.', 'error'); }
    finally { setDeleting(false); }
  };

  const submitComment = async (articleId, commentId = null) => {
    const key = commentId || articleId; const text = (commentId ? replyText[key] : commentText[key])?.trim();
    if (!text || busyComment === key) return;
    setBusyComment(key);
    try {
      const response = commentId
        ? await api.post(`/articles/${articleId}/comments/${commentId}/replies`, { text })
        : await api.post(`/articles/${articleId}/comments`, { text });
      setArticles(current => current.map(article => {
        if (article._id !== articleId) return article;
        if (!commentId) return { ...article, comments: [...(article.comments || []), response.data.comment] };
        return { ...article, comments: article.comments.map(comment => comment._id === commentId ? { ...comment, replies: [...(comment.replies || []), response.data.reply] } : comment) };
      }));
      commentId ? setReplyText(current => ({ ...current, [key]: '' })) : setCommentText(current => ({ ...current, [key]: '' }));
      notify(commentId ? 'Reply posted.' : 'Comment posted.');
    } catch (err) { notify(err.response?.data?.error || 'Could not post your comment.', 'error'); }
    finally { setBusyComment(''); }
  };

  return <main className="articles-page">
    <header className="articles-heading"><div><span className="articles-eyebrow">BAZZAR JOURNAL</span><h1>Articles</h1><p>Ideas, updates, and stories from the community.</p></div>{canAuthorArticles && <button className="articles-primary-button" onClick={startNew}><Plus size={18} /> Write an article</button>}</header>
    {normalizedArticleQuery && <div className="articles-search-notice"><span>Showing article matches for <strong>“{effectiveArticleSearch}”</strong></span><button type="button" onClick={() => { setArticleSearch(''); onClearSearch?.(); }}>Clear search <X size={14} /></button></div>}
    <section className="article-discovery" aria-label="Find articles">
      <label className="article-search-box"><span className="sr-only">Search articles</span><input type="search" value={articleSearch} onChange={event => setArticleSearch(event.target.value)} placeholder="Search stories, topics, and ideas…" /><Search size={18} />{articleSearch && <button type="button" onClick={() => setArticleSearch('')} aria-label="Clear article search"><X size={15} /></button>}</label>
      <nav className="article-category-filters" aria-label="Article categories">{ARTICLE_CATEGORIES.map(category => <button key={category.id} type="button" className={categoryFilter === category.id ? 'active' : ''} onClick={() => setCategoryFilter(category.id)}>{category.label}{category.id !== 'all' && <span>{articles.filter(article => (article.category || 'community') === category.id && (isEditorialManager || user?.role === 'author' || article.status === 'published')).length}</span>}</button>)}</nav>
    </section>
    {!loading && visibleArticles.some(article => article.status === 'published') && <section className="article-trending" aria-labelledby="article-trending-title"><div><span className="articles-eyebrow">COMMUNITY PICKS</span><h2 id="article-trending-title">Trending now</h2><p>Popular with readers for their conversations and recent activity.</p></div><div className="article-trending-list">{visibleArticles.filter(article => article.status === 'published').slice(0, 3).map((article, index) => <button type="button" key={article._id} onClick={() => document.getElementById(`article-${article._id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}><span>0{index + 1}</span><strong>{article.title}</strong><small>{Number(article.viewCount) || 0} reads · {article.comments?.length || 0} discussions</small></button>)}</div></section>}
    <nav className="article-state-filters" aria-label="Filter articles">{visibleWorkflowStates.map(state => <button key={state.id} className={filter === state.id ? 'active' : ''} onClick={() => setFilter(state.id)}>{state.label}<span>{state.id === 'all' ? articles.length : articles.filter(article => article.status === state.id).length}</span></button>)}</nav>
    {error && <div className="articles-alert" role="alert">{error}<button onClick={() => setError('')} aria-label="Dismiss"><X size={16} /></button></div>}
    {loading ? <div className="articles-loading"><LoaderCircle className="articles-spinner" /> Loading articles…</div> : articles.length === 0 ? <section className="articles-empty"><div className="articles-empty-icon">✍️</div><h2>{canAuthorArticles ? 'Start the conversation' : 'No published articles yet'}</h2><p>{canAuthorArticles ? 'Publish the first article for your community.' : 'Published community articles will appear here.'}</p>{canAuthorArticles && <button className="articles-primary-button" onClick={startNew}><Plus size={18} /> Write an article</button>}</section> : visibleArticles.length === 0 ? <section className="articles-empty"><h2>{normalizedArticleQuery ? 'No matching articles' : `No ${statusLabel(filter).toLowerCase()} articles`}</h2><p>{normalizedArticleQuery ? 'Try another search term or clear your search.' : 'Articles in this workflow state will show here.'}</p></section> : <section className="articles-list">
      {visibleArticles.map(article => <article className="article-card" id={`article-${article._id}`} data-article-id={article._id} key={article._id}>
        <div className="article-card-top"><UserAvatar person={article.editor} className="article-editor-avatar" /><div className="article-byline"><strong>{displayName(article.editor)}</strong><span><CalendarDays size={14} /> {new Date(article.date || article.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span></div><span className={`article-status-badge status-${article.status || 'draft'}`}>{statusLabel(article.status)}</span>
          {canManageArticle(article) && <div className="article-actions"><button type="button" className="article-more-trigger" onClick={() => setOpenArticleMenuId(current => current === article._id ? null : article._id)} aria-label="Article actions" aria-haspopup="menu" aria-expanded={openArticleMenuId === article._id}><MoreHorizontal size={19} /></button>{openArticleMenuId === article._id && <div className="article-more-menu" role="menu">
            <button type="button" role="menuitem" onClick={() => { setOpenArticleMenuId(null); startEdit(article); }}><Pencil size={15} /> Edit article</button>
            <button type="button" role="menuitem" onClick={() => { setOpenArticleMenuId(null); setRevisionsOpen(current => ({ ...current, [article._id]: !current[article._id] })); }}><History size={15} /> Revision history</button>
            <button type="button" role="menuitem" className="article-more-delete" onClick={() => { setOpenArticleMenuId(null); setDeleteTarget(article); }}><Trash2 size={15} /> Delete article</button>
          </div>}</div>}
        </div>
        {article.status === 'scheduled' && article.scheduledFor && <p className="article-scheduled-note"><Clock3 size={15} /> Scheduled for {new Date(article.scheduledFor).toLocaleString()}</p>}
        <div className="article-category-label">{ARTICLE_CATEGORIES.find(category => category.id === (article.category || 'community'))?.label || 'Community'}</div><h2 className="article-title">{article.title}</h2><p className="article-summary">{article.summary}</p><ArticleBody blocks={article.contents} />
        {canManageArticle(article) && <div className="article-workflow-actions">
          {article.status === 'draft' && <><button onClick={() => changeWorkflow(article, 'submit_review')}><Check size={15} /> Submit for review</button>{isEditorialManager && <><button className="workflow-primary" onClick={() => changeWorkflow(article, 'publish')}><Check size={15} /> Publish now</button><button onClick={() => startEdit(article)}><Clock3 size={15} /> Schedule</button></>}</>}
          {article.status === 'in_review' && <><button onClick={() => changeWorkflow(article, 'withdraw_review')}>Return to draft</button>{isEditorialManager && <><button className="workflow-primary" onClick={() => changeWorkflow(article, 'publish')}><Check size={15} /> Approve &amp; publish</button><button onClick={() => startEdit(article)}>Schedule</button></>}</>}
          {isEditorialManager && article.status === 'scheduled' && <><button onClick={() => changeWorkflow(article, 'unschedule')}>Unschedule</button><button className="workflow-primary" onClick={() => changeWorkflow(article, 'publish')}>Publish now</button></>}
          {isEditorialManager && article.status === 'published' && <><button onClick={() => changeWorkflow(article, 'unpublish')}>Unpublish</button><button onClick={() => changeWorkflow(article, 'archive')}><Archive size={15} /> Archive</button></>}
          {isEditorialManager && article.status === 'archived' && <button onClick={() => changeWorkflow(article, 'restore')}><RotateCcw size={15} /> Restore to drafts</button>}
        </div>}
        {revisionsOpen[article._id] && <section className="article-revision-history"><h3>Revision history <span>{article.revisions?.length || 0} saved versions</span></h3>{!article.revisions?.length ? <p>No saved revisions yet. Versions are added when an article is updated.</p> : [...article.revisions].reverse().map(revision => <div className="article-revision-row" key={revision._id}><div><strong>{revision.title}</strong><span>{displayName(revision.editor)} · {new Date(revision.savedAt).toLocaleString()}</span></div><button onClick={() => restoreRevision(article, revision)}><RotateCcw size={14} /> Restore</button></div>)}</section>}
        {article.status === 'published' && <><div className="article-comments-toggle"><button onClick={() => setCommentsOpen(current => ({ ...current, [article._id]: !current[article._id] }))}><MessageCircle size={17} /> {article.comments?.length || 0} comments</button></div>
        {commentsOpen[article._id] && <section className="article-comments"><h3>Discussion</h3>{(article.comments || []).map(comment => <div className="article-comment" key={comment._id}><UserAvatar person={comment.userId} className="article-comment-avatar" /><div className="article-comment-content"><strong>{displayName(comment.userId)}</strong><p>{comment.text}</p>{(comment.replies || []).map(reply => <div className="article-reply" key={reply._id}><UserAvatar person={reply.userId} className="article-reply-avatar" /><strong>{displayName(reply.userId)}</strong><p>{reply.text}</p></div>)}{user ? <form className="article-reply-form" onSubmit={event => { event.preventDefault(); submitComment(article._id, comment._id); }}><input value={replyText[comment._id] || ''} onChange={event => setReplyText(current => ({ ...current, [comment._id]: event.target.value }))} placeholder="Write a reply…" /><button disabled={!replyText[comment._id]?.trim() || busyComment === comment._id} aria-label="Send reply"><Send size={15} /></button></form> : <a className="article-signin-prompt" href="/login">Sign in to reply</a>}</div></div>)}{user ? <form className="article-comment-form" onSubmit={event => { event.preventDefault(); submitComment(article._id); }}><input value={commentText[article._id] || ''} onChange={event => setCommentText(current => ({ ...current, [article._id]: event.target.value }))} placeholder="Add to the discussion…" /><button disabled={!commentText[article._id]?.trim() || busyComment === article._id}><Send size={16} /> Comment</button></form> : <a className="article-signin-prompt" href="/login">Sign in to join the discussion</a>}</section>}</>}
      </article>)}
    </section>}

    {editing && createPortal(<div className="article-editor-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget && !saving) closeEditor(); }}><form className="article-editor-modal" onSubmit={saveArticle}>
      <header><div><span className="articles-eyebrow">ARTICLE EDITOR</span><h2>{previewOpen ? 'Preview article' : editing._id ? 'Edit article' : 'Write an article'}</h2></div><div className="article-modal-header-actions"><button type="button" className="article-cancel-button" onClick={() => setPreviewOpen(value => !value)}>{previewOpen ? 'Back to editor' : 'Preview'}</button><button type="button" className="article-modal-close" onClick={closeEditor} aria-label="Close editor"><X /></button></div></header>
      {previewOpen ? <article className="article-preview-page"><span className="article-preview-date">{editing.date && new Date(`${editing.date}T12:00:00`).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span><h1>{editing.title || 'Untitled article'}</h1><p className="article-preview-summary">{editing.summary || 'Your summary will appear here.'}</p><ArticleBody blocks={editing.contents.map(block => ({ ...block, url: block.previewUrl || block.url }))} /><div className="article-preview-note">Preview · Only you can see this unpublished article</div></article> : <>
      <label className="article-field">Title<input required maxLength="180" value={editing.title} onChange={event => setEditing(current => ({ ...current, title: event.target.value }))} placeholder="Give your story a title" /></label>
      <label className="article-field">Summary<textarea required maxLength="500" rows="2" value={editing.summary} onChange={event => setEditing(current => ({ ...current, summary: event.target.value }))} placeholder="A short introduction to your article" /></label>
      <label className="article-field">Category<select value={editing.category || 'community'} onChange={event => setEditing(current => ({ ...current, category: event.target.value }))}>{ARTICLE_CATEGORIES.filter(category => category.id !== 'all').map(category => <option key={category.id} value={category.id}>{category.label}</option>)}</select></label>
      <label className="article-field article-date-field">Publication date<input required type="date" value={editing.date} onChange={event => setEditing(current => ({ ...current, date: event.target.value }))} /></label>
      <label className="article-field article-date-field">Schedule publication (optional)<input type="datetime-local" min={localDateTimeNow()} value={editing.scheduledFor || ''} onChange={event => setEditing(current => ({ ...current, scheduledFor: event.target.value }))} /><span className="article-field-hint">The server publishes scheduled articles automatically.</span></label>
      <div className="article-content-label">Article content <span>Build your story from text, links, images, and video.</span></div>
      <div className="article-block-list">{editing.contents.map((block, index) => <section className="article-edit-block" key={index}><div className="article-block-toolbar"><span>{block.type === 'paragraph' ? 'Paragraph' : block.type.charAt(0).toUpperCase() + block.type.slice(1)}</span><button type="button" disabled={index === 0} onClick={() => moveBlock(index, -1)} aria-label="Move block up"><ArrowUp size={15} /></button><button type="button" disabled={index === editing.contents.length - 1} onClick={() => moveBlock(index, 1)} aria-label="Move block down"><ArrowDown size={15} /></button><button type="button" onClick={() => removeBlock(index)} aria-label="Remove block"><X size={15} /></button></div>
        {['paragraph', 'heading', 'quote'].includes(block.type) && <textarea rows={block.type === 'paragraph' ? 4 : 2} value={block.text} onChange={event => updateBlock(index, { text: event.target.value })} placeholder={block.type === 'paragraph' ? 'Write a paragraph…' : block.type === 'heading' ? 'Section heading' : 'Pull quote'} />}
        {block.type === 'link' && <div className="article-link-fields"><input type="url" value={block.url} onChange={event => updateBlock(index, { url: event.target.value })} placeholder="https://example.com" /><input value={block.text} onChange={event => updateBlock(index, { text: event.target.value })} placeholder="Link text" /></div>}
        {['image', 'video'].includes(block.type) && <div className="article-media-fields"><input type="file" accept={block.type === 'image' ? 'image/*' : 'video/*'} onChange={event => attachFile(index, block.type, event.target.files?.[0])} /><input value={block.caption} onChange={event => updateBlock(index, { caption: event.target.value })} placeholder="Caption (optional)" />{block.url && <span>Media attached</span>}{block.file && <span>{block.file.name}</span>}</div>}
      </section>)}</div>
      <div className="article-add-blocks"><button type="button" onClick={() => addBlock('paragraph')}>+ Paragraph</button><button type="button" onClick={() => addBlock('heading')}>+ Heading</button><button type="button" onClick={() => addBlock('quote')}>+ Quote</button><button type="button" onClick={() => addBlock('link')}><Link2 size={15} /> Link</button><button type="button" onClick={() => addBlock('image')}><ImagePlus size={15} /> Image</button><button type="button" onClick={() => addBlock('video')}><Video size={15} /> Video</button></div>
      {error && <div className="articles-alert" role="alert">{error}</div>}
      <footer className="article-editor-footer"><span className="article-autosave-status">{autosaving ? 'Saving draft…' : autosaveState}</span><button type="button" className="article-cancel-button" disabled={saving || autosaving} onClick={closeEditor}>Close</button><button type="button" className="article-cancel-button" disabled={saving || autosaving} onClick={event => saveArticle(event, 'draft')}>Save draft</button><button type="button" className="article-cancel-button" disabled={saving || autosaving} onClick={event => saveArticle(event, 'in_review')}>Submit for review</button>{isEditorialManager && editing.scheduledFor && <button type="button" className="article-cancel-button" disabled={saving || autosaving} onClick={event => saveArticle(event, 'scheduled')}><Clock3 size={15} /> Schedule</button>}{isEditorialManager && <button type="button" className="articles-primary-button" disabled={saving || autosaving} onClick={event => saveArticle(event, 'published')}>{saving && <LoaderCircle className="articles-spinner" />}{saving ? 'Saving…' : 'Publish now'}</button>}</footer>
      </>}
    </form></div>, document.body)}
    <DeleteModal
      deleteTargetId={deleteTarget?._id}
      title="Delete this article?"
      message={deleteTarget ? `“${deleteTarget.title}” and its uploaded media will be permanently removed. This cannot be undone.` : ''}
      confirmLabel="Delete article"
      busy={deleting}
      setDeleteTargetId={setDeleteTarget}
      handleConfirmDelete={deleteArticle}
    />
    <Toast key={toast?.id || 'article-toast'} message={toast?.message} type={toast?.type} onClose={closeToast} />
  </main>;
}
