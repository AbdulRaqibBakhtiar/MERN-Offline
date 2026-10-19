const mongoose = require('mongoose');

const ReplySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    profileImage: { type: String, default: '' },
    user: {
      type: String,
      required: true
    },
    text: {
      type: String,
      required: true
    },
    approvals: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    disapprovals: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    _id: true
  }
);

const CommentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    profileImage: { type: String, default: '' },
    user: {
      type: String,
      required: true
    },
    text: {
      type: String,
      required: true
    },
    approvals: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    disapprovals: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    replies: [ReplySchema],
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    _id: true
  }
);

const NewsSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },

    meta: {
      type: String,
      default: 'Published Today | Business Desk'
    },

    fullText: {
      type: String,
      required: true
    },

    imagePath: {
      type: String,
      default: ''
    },

    images: [
      {
        type: String
      }
    ],

    videoPath: {
      type: String,
      default: ''
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],

    comments: [CommentSchema]
  },
  {
    timestamps: true
  }
);

const News =
  mongoose.models.News ||
  mongoose.model('News', NewsSchema);

module.exports = News;
