const News = require('../models/News');
const elevatedRoles = new Set(['admin', 'editor']);

const requireNewsAuthoringRole = (req, res, next) => {
  if (!['admin', 'editor', 'author'].includes(req.user?.role)) {
    return res.status(403).json({ error: 'An author, editor, or admin role is required.' });
  }
  return next();
};

const requireNewsOwnerOrEditor = async (req, res, next) => {
  if (elevatedRoles.has(req.user?.role)) return next();

  try {
    const post = await News.findById(req.params.id).select('createdBy').lean();
    if (!post) return res.status(404).json({ error: 'Post not found.' });
    if (String(post.createdBy) !== String(req.user?.id)) {
      return res.status(403).json({ error: 'You can only edit or delete your own posts.' });
    }
    return next();
  } catch (error) {
    return res.status(500).json({ error: 'Could not verify post permissions.' });
  }
};

module.exports = { requireNewsOwnerOrEditor, requireNewsAuthoringRole };
