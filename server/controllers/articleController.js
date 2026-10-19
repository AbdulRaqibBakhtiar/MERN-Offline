const fs = require('fs');
const path = require('path');
const Article = require('../models/Article');
const User = require('../models/Users');

const getFiles = req => Array.isArray(req.files) ? req.files : [];
const uploadedUrl = file => `/public/uploads/articles/${file.filename}`;
const cleanupUploads = req => getFiles(req).forEach(file => fs.unlink(path.join(__dirname, '..', 'public', 'uploads', 'articles', file.filename), () => {}));
const removeArticleMedia = urls => {
  const uploadRoot = path.resolve(__dirname, '..', 'public', 'uploads', 'articles');
  (urls || []).filter(url => typeof url === 'string' && url.startsWith('/public/uploads/articles/')).forEach(url => {
    const target = path.resolve(__dirname, '..', url.replace(/^\/+/, ''));
    if (target.startsWith(`${uploadRoot}${path.sep}`)) fs.unlink(target, error => {
      if (error && error.code !== 'ENOENT') console.error('Could not remove article media:', error.message);
    });
  });
};
const publicArticle = (query, includeRevisions = true) => {
  const populated = query.populate('editor', 'username firstName lastName profileImage').populate('comments.userId', 'username firstName lastName profileImage').populate('comments.replies.userId', 'username firstName lastName profileImage');
  return includeRevisions ? populated.populate('revisions.editor', 'username firstName lastName') : populated;
};
const mediaIn = blocks => (blocks || []).filter(block => ['image', 'video'].includes(block.type)).map(block => block.url).filter(Boolean);
const unique = items => [...new Set(items)];
const addRevision = (article, editorId) => {
  article.revisions.push({ editor: editorId, title: article.title, summary: article.summary, category: article.category, date: article.date, contents: article.contents, savedAt: new Date() });
  while (article.revisions.length > 20) article.revisions.shift();
};
const cleanUnreferencedMedia = (article, previousUrls) => {
  const retained = new Set([...mediaIn(article.contents), ...article.revisions.flatMap(revision => mediaIn(revision.contents))]);
  removeArticleMedia(unique(previousUrls).filter(url => !retained.has(url)));
};

const ARTICLE_CATEGORIES = ['community', 'marketplace', 'business', 'guides', 'news'];
const updateFields = (article, req) => {
  const { title, summary, date, category } = req.body;
  if (typeof title !== 'string' || !title.trim() || typeof summary !== 'string' || !summary.trim()) throw new Error('Title and summary are required.');
  article.title = title.trim(); article.summary = summary.trim(); article.date = date || article.date; article.contents = parsePayload(req);
  if (category !== undefined) {
    if (!ARTICLE_CATEGORIES.includes(category)) throw new Error('Choose a valid article category.');
    article.category = category;
  }
};
const ensureReadyToPublish = article => {
  if (!article.contents.some(block => block.text?.trim() || (['image', 'video', 'link'].includes(block.type) && block.url))) {
    throw new Error('Add some article content before submitting or publishing.');
  }
};

const parsePayload = (req) => {
  let contents;
  try {
    contents = JSON.parse(req.body.contents || '[]');
  } catch {
    throw new Error('Article content is not valid.');
  }
  if (!Array.isArray(contents) || contents.length > 100) throw new Error('Article content must contain up to 100 blocks.');
  const files = getFiles(req);
  const blocks = contents.map(block => {
    if (!block || !['paragraph', 'heading', 'quote', 'link', 'image', 'video'].includes(block.type)) throw new Error('Article contains an unsupported content block.');
    const next = { type: block.type, text: String(block.text || '').trim(), caption: String(block.caption || '').trim(), url: String(block.url || '').trim() };
    if (block.fileIndex !== undefined && block.fileIndex !== null && block.fileIndex !== '') {
      const file = files[Number(block.fileIndex)];
      if (!file) throw new Error('An attached media file is missing.');
      if ((block.type === 'image' && !file.mimetype.startsWith('image/')) || (block.type === 'video' && !file.mimetype.startsWith('video/'))) {
        throw new Error(`Choose a matching ${block.type} file for this block.`);
      }
      next.url = uploadedUrl(file);
    }
    if (['image', 'video', 'link'].includes(next.type) && !next.url) throw new Error('Every media and link block needs a URL or uploaded file.');
    if (next.type === 'link' && !/^https?:\/\//i.test(next.url)) throw new Error('Links must begin with http:// or https://.');
    return next;
  });
  return blocks;
};

exports.listArticles = async (req, res) => {
  try {
    await Article.updateMany({ status: { $exists: false } }, { $set: { status: 'published' } });
    await exports.publishScheduledArticles();
    const canReviewAll = ['admin', 'editor'].includes(req.user?.role);
    const visibilityFilter = canReviewAll
      ? {}
      : req.user?.role === 'author'
        ? { $or: [{ status: 'published' }, { editor: req.user.id }] }
        : { status: 'published' };
    const articles = await publicArticle(Article.find(visibilityFilter)).sort({ date: -1, createdAt: -1 });
    res.json(articles);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.listPublicArticles = async (req, res) => {
  try {
    await exports.publishScheduledArticles();
    const articles = await publicArticle(Article.find({ status: 'published' }).select('-revisions'), false).sort({ publishedAt: -1, date: -1, createdAt: -1 });
    return res.json(articles);
  } catch { return res.status(500).json({ error: 'Could not load published articles.' }); }
};

exports.recordArticleView = async (req, res) => {
  try {
    const article = await Article.findOneAndUpdate({ _id: req.params.id, status: 'published' }, { $inc: { viewCount: 1 } }, { new: true }).select('_id viewCount');
    if (!article) return res.status(404).json({ error: 'Published article not found.' });
    return res.json({ viewCount: article.viewCount });
  } catch { return res.status(400).json({ error: 'Could not record this article view.' }); }
};

exports.createArticle = async (req, res) => {
  try {
    const { title, summary, date } = req.body;
    if (!title?.trim() || !summary?.trim()) return res.status(400).json({ error: 'Title and summary are required.' });
    const status = ['published', 'scheduled', 'in_review', 'archived'].includes(req.body.status) ? req.body.status : 'draft';
    if (req.user?.role === 'author' && !['draft', 'in_review'].includes(status)) {
      cleanupUploads(req);
      return res.status(403).json({ error: 'Authors can save drafts or submit articles for review. An editor must publish or schedule them.' });
    }
    const scheduledFor = status === 'scheduled' ? new Date(req.body.scheduledFor) : null;
    if (status === 'scheduled' && (!req.body.scheduledFor || Number.isNaN(scheduledFor.getTime()) || scheduledFor <= new Date())) return res.status(400).json({ error: 'Choose a future publication date and time.' });
    const publishedAt = status === 'published' ? new Date() : null;
    const contents = parsePayload(req);
    const category = req.body.category || 'community';
    if (!ARTICLE_CATEGORIES.includes(category)) return res.status(400).json({ error: 'Choose a valid article category.' });
    const articleData = { editor: req.user.id, title, summary, category, date: status === 'published' ? publishedAt : date || new Date(), contents, status, scheduledFor, publishedAt };
    if (['in_review', 'scheduled', 'published'].includes(status)) ensureReadyToPublish(articleData);
    const article = await Article.create(articleData);
    res.status(201).json(await publicArticle(Article.findById(article._id)));
  } catch (error) { cleanupUploads(req); res.status(400).json({ error: error.message }); }
};

exports.updateArticle = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    if (!article) return res.status(404).json({ error: 'Article not found.' });
    const previousMedia = [...mediaIn(article.contents), ...article.revisions.flatMap(revision => mediaIn(revision.contents))];
    addRevision(article, req.user.id);
    updateFields(article, req);
    const requestedStatus = req.body.status;
    if (req.user?.role === 'author' && requestedStatus && !['draft', 'in_review'].includes(requestedStatus)) {
      cleanupUploads(req);
      return res.status(403).json({ error: 'Authors can save drafts or submit articles for review. An editor must publish or schedule them.' });
    }
    if (['draft', 'in_review', 'published', 'scheduled'].includes(requestedStatus)) {
      article.status = requestedStatus;
      if (requestedStatus === 'scheduled') {
        const publishDate = new Date(req.body.scheduledFor);
        if (!req.body.scheduledFor || Number.isNaN(publishDate.getTime()) || publishDate <= new Date()) return res.status(400).json({ error: 'Choose a future publication date and time.' });
        article.scheduledFor = publishDate;
      } else article.scheduledFor = null;
      if (requestedStatus === 'published') { article.publishedAt = new Date(); article.date = article.publishedAt; }
      if (['in_review', 'scheduled', 'published'].includes(requestedStatus)) ensureReadyToPublish(article);
    }
    await article.save();
    cleanUnreferencedMedia(article, previousMedia);
    res.json(await publicArticle(Article.findById(article._id)));
  } catch (error) { cleanupUploads(req); res.status(400).json({ error: error.message }); }
};

exports.autosaveDraft = async (req, res) => {
  try {
    const { title, summary, date } = req.body;
    if (!title?.trim() || !summary?.trim()) return res.status(400).json({ error: 'Add a title and summary to save this draft.' });
    const category = req.body.category || 'community';
    if (!ARTICLE_CATEGORIES.includes(category)) return res.status(400).json({ error: 'Choose a valid article category.' });
    const article = await Article.create({ editor: req.user.id, title, summary, category, date: date || new Date(), contents: parsePayload(req), status: 'draft' });
    res.status(201).json(await publicArticle(Article.findById(article._id)));
  } catch (error) { cleanupUploads(req); res.status(400).json({ error: error.message }); }
};

exports.autosaveArticle = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    if (!article) return res.status(404).json({ error: 'Article not found.' });
    if (article.status === 'published' || article.status === 'archived') return res.status(409).json({ error: 'Use the review workflow to edit a published or archived article.' });
    const previousMedia = [...mediaIn(article.contents), ...article.revisions.flatMap(revision => mediaIn(revision.contents))];
    updateFields(article, req);
    article.status = 'draft'; article.scheduledFor = null;
    await article.save();
    cleanUnreferencedMedia(article, previousMedia);
    res.json(await publicArticle(Article.findById(article._id)));
  } catch (error) { cleanupUploads(req); res.status(400).json({ error: error.message }); }
};

exports.changeWorkflow = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    if (!article) return res.status(404).json({ error: 'Article not found.' });
    const { action, scheduledFor } = req.body;
    if (action === 'submit_review' && article.status === 'draft') { ensureReadyToPublish(article); article.status = 'in_review'; }
    else if (action === 'withdraw_review' && article.status === 'in_review') article.status = 'draft';
    else if (action === 'publish' && ['draft', 'in_review', 'scheduled'].includes(article.status)) {
      ensureReadyToPublish(article);
      article.status = 'published'; article.publishedAt = new Date(); article.date = article.publishedAt; article.scheduledFor = null;
    } else if (action === 'unpublish' && article.status === 'published') {
      article.status = 'draft'; article.scheduledFor = null;
    } else if (action === 'unschedule' && article.status === 'scheduled') {
      article.status = 'draft'; article.scheduledFor = null;
    } else if (action === 'schedule' && ['draft', 'in_review'].includes(article.status)) {
      ensureReadyToPublish(article);
      const publishDate = new Date(scheduledFor);
      if (!scheduledFor || Number.isNaN(publishDate.getTime()) || publishDate <= new Date()) return res.status(400).json({ error: 'Choose a future publication date and time.' });
      article.status = 'scheduled'; article.scheduledFor = publishDate;
    } else if (action === 'archive' && article.status !== 'archived') {
      article.status = 'archived'; article.scheduledFor = null;
    } else if (action === 'restore' && article.status === 'archived') {
      article.status = 'draft'; article.scheduledFor = null;
    } else return res.status(409).json({ error: 'That workflow action is not available for the current article status.' });
    await article.save();
    res.json(await publicArticle(Article.findById(article._id)));
  } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.restoreRevision = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    if (!article) return res.status(404).json({ error: 'Article not found.' });
    const revision = article.revisions.id(req.params.revisionId);
    if (!revision) return res.status(404).json({ error: 'Revision not found.' });
    const previousMedia = [...mediaIn(article.contents), ...article.revisions.flatMap(item => mediaIn(item.contents))];
    addRevision(article, req.user.id);
    article.title = revision.title; article.summary = revision.summary; article.category = revision.category || 'community'; article.date = revision.date || article.date; article.contents = revision.contents;
    article.status = 'draft'; article.scheduledFor = null;
    await article.save();
    cleanUnreferencedMedia(article, previousMedia);
    res.json(await publicArticle(Article.findById(article._id)));
  } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.publishScheduledArticles = async () => {
  const now = new Date();
  return Article.updateMany({ status: 'scheduled', scheduledFor: { $lte: now } }, { $set: { status: 'published', publishedAt: now, date: now, scheduledFor: null } });
};

exports.deleteArticle = async (req, res) => {
  try {
    const article = await Article.findByIdAndDelete(req.params.id);
    if (!article) return res.status(404).json({ error: 'Article not found.' });
    removeArticleMedia([...mediaIn(article.contents), ...article.revisions.flatMap(revision => mediaIn(revision.contents))]);
    res.json({ message: 'Article deleted.' });
  } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.addComment = async (req, res) => {
  try {
    const text = String(req.body.text || '').trim();
    if (!text) return res.status(400).json({ error: 'Comment cannot be empty.' });
    const current = await Article.findById(req.params.id).select('status');
    if (!current) return res.status(404).json({ error: 'Article not found.' });
    if (current.status !== 'published') return res.status(409).json({ error: 'Comments are open on published articles only.' });
    const profile = await User.findById(req.user.id).select('username firstName lastName profileImage');
    const article = await Article.findOneAndUpdate({ _id: req.params.id, status: 'published' }, { $push: { comments: { userId: req.user.id, text } } }, { new: true });
    if (!article) return res.status(404).json({ error: 'Article not found.' });
    const comment = article.comments[article.comments.length - 1].toObject();
    comment.userId = profile;
    res.status(201).json({ comment });
  } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.addReply = async (req, res) => {
  try {
    const text = String(req.body.text || '').trim();
    if (!text) return res.status(400).json({ error: 'Reply cannot be empty.' });
    const profile = await User.findById(req.user.id).select('username firstName lastName profileImage');
    const article = await Article.findOneAndUpdate(
      { _id: req.params.id, status: 'published', 'comments._id': req.params.commentId },
      { $push: { 'comments.$.replies': { userId: req.user.id, text } } }, { new: true }
    );
    if (!article) return res.status(404).json({ error: 'Article or comment not found.' });
    const comment = article.comments.id(req.params.commentId);
    const reply = comment.replies[comment.replies.length - 1].toObject();
    reply.userId = profile;
    res.status(201).json({ reply });
  } catch (error) { res.status(500).json({ error: error.message }); }
};
