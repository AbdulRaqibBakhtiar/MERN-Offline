const mongoose = require('mongoose');

const ArticleReplySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true, trim: true, maxlength: 2000 },
  createdAt: { type: Date, default: Date.now }
});

const ArticleCommentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true, trim: true, maxlength: 2000 },
  replies: [ArticleReplySchema],
  createdAt: { type: Date, default: Date.now }
});

const ArticleBlockSchema = new mongoose.Schema({
  type: { type: String, enum: ['paragraph', 'heading', 'quote', 'link', 'image', 'video'], required: true },
  text: { type: String, default: '' },
  url: { type: String, default: '' },
  caption: { type: String, default: '' }
}, { _id: false });

const ArticleRevisionSchema = new mongoose.Schema({
  editor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  summary: { type: String, default: '' },
  category: { type: String, default: 'community' },
  date: { type: Date },
  contents: { type: [ArticleBlockSchema], default: [] },
  savedAt: { type: Date, default: Date.now }
});

const ArticleSchema = new mongoose.Schema({
  editor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, trim: true, maxlength: 180 },
  summary: { type: String, required: true, trim: true, maxlength: 500 },
  category: { type: String, enum: ['community', 'marketplace', 'business', 'guides', 'news'], default: 'community', index: true },
  viewCount: { type: Number, default: 0, min: 0 },
  date: { type: Date, default: Date.now },
  contents: { type: [ArticleBlockSchema], default: [] },
  status: { type: String, enum: ['draft', 'in_review', 'scheduled', 'published', 'archived'], default: 'draft', index: true },
  scheduledFor: { type: Date, default: null },
  publishedAt: { type: Date, default: null },
  revisions: { type: [ArticleRevisionSchema], default: [] },
  comments: { type: [ArticleCommentSchema], default: [] }
}, { timestamps: true });

module.exports = mongoose.models.Article || mongoose.model('Article', ArticleSchema);
