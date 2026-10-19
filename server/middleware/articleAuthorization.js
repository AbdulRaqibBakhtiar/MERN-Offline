const Article = require('../models/Article');

const elevatedRoles = new Set(['admin', 'editor']);
const authoringRoles = new Set(['admin', 'editor', 'author']);

const requireArticleAuthoringRole = (req, res, next) => {
  if (!authoringRoles.has(req.user?.role)) {
    return res.status(403).json({ error: 'An author, editor, or admin role is required.' });
  }
  return next();
};

const loadArticleAndCheckOwner = async (req, res, next) => {
  try {
    const article = await Article.findById(req.params.id).select('editor status').lean();
    if (!article) return res.status(404).json({ error: 'Article not found.' });
    if (!elevatedRoles.has(req.user?.role) && String(article.editor) !== String(req.user?.id)) {
      return res.status(403).json({ error: 'Authors can only manage their own articles.' });
    }
    req.articleAccessRecord = article;
    return next();
  } catch (error) {
    return res.status(500).json({ error: 'Could not verify article permissions.' });
  }
};

const requireArticleOwnerOrEditor = (req, res, next) => loadArticleAndCheckOwner(req, res, next);

const requireArticleWorkflowPermission = async (req, res, next) => {
  try {
    const article = await Article.findById(req.params.id).select('editor status').lean();
    if (!article) return res.status(404).json({ error: 'Article not found.' });
    const elevated = elevatedRoles.has(req.user?.role);
    if (!elevated && String(article.editor) !== String(req.user?.id)) {
      return res.status(403).json({ error: 'Authors can only manage their own articles.' });
    }
    if (!elevated && !['submit_review', 'withdraw_review'].includes(req.body?.action)) {
      return res.status(403).json({ error: 'Authors can submit or withdraw their own articles for review.' });
    }
    req.articleAccessRecord = article;
    return next();
  } catch (error) {
    return res.status(500).json({ error: 'Could not verify article permissions.' });
  }
};

module.exports = {
  requireArticleAuthoringRole,
  requireArticleOwnerOrEditor,
  requireArticleWorkflowPermission,
  elevatedRoles
};
