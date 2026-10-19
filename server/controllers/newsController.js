const fs = require('fs');
const path = require('path');
const News = require('../models/News');
const User = require('../models/Users');
const socket = require('../config/socket');

const removeUploadedFile = filePath => {
  if (!filePath) return;

  const relativePath = filePath.replace(/^[/\\]+/, '');
  const absolutePath = path.join(__dirname, '..', relativePath);

  fs.unlink(absolutePath, err => {
    if (err && err.code !== 'ENOENT') {
      console.error('Could not remove uploaded file:', err.message);
    }
  });
};

const getUploadedFiles = req => {
  const files = [];

  if (Array.isArray(req.files)) {
    files.push(...req.files);
  } else if (req.files && typeof req.files === 'object') {
    Object.values(req.files).forEach(group => {
      if (Array.isArray(group)) files.push(...group);
    });
  }

  if (req.file) files.push(req.file);

  return files;
};

const getImageFiles = req =>
  getUploadedFiles(req).filter(file =>
    file.mimetype?.startsWith('image/')
  );

const getVideoFile = req =>
  getUploadedFiles(req).find(file =>
    file.mimetype?.startsWith('video/')
  );

const buildImagePaths = req =>
  getImageFiles(req).map(
    file => `/public/uploads/news/${file.filename}`
  );

const normalizeNewsMedia = news => {
  const images = Array.isArray(news.images)
    ? news.images.filter(Boolean)
    : [];

  if (!images.length && news.imagePath) {
    images.push(news.imagePath);
  }

  news.images = images;

  return news;
};

exports.getNewsFeed = async (req, res) => {
  try {
    const items = await News.find()
      .populate('createdBy', 'username profileImage')
      .sort({ createdAt: -1 });

    // Resolve profile data for legacy comments and replies that predate profile snapshots.
    const usernames = new Set();
    items.forEach(item => item.comments.forEach(comment => {
      if (comment.user && !comment.profileImage) usernames.add(comment.user);
      comment.replies.forEach(reply => {
        if (reply.user && !reply.profileImage) usernames.add(reply.user);
      });
    }));
    const profiles = await User.find({ username: { $in: [...usernames] } })
      .select('username profileImage')
      .lean();
    const profilesByUsername = new Map(profiles.map(profile => [profile.username, profile]));

    items.forEach(item => item.comments.forEach(comment => {
      const commentProfile = profilesByUsername.get(comment.user);
      if (!comment.profileImage && commentProfile) {
        comment.profileImage = commentProfile.profileImage || '';
        comment.userId = comment.userId || commentProfile._id;
      }
      comment.replies.forEach(reply => {
        const replyProfile = profilesByUsername.get(reply.user);
        if (!reply.profileImage && replyProfile) {
          reply.profileImage = replyProfile.profileImage || '';
          reply.userId = reply.userId || replyProfile._id;
        }
      });
    }));

    items.forEach(normalizeNewsMedia);

    res.status(200).json(items);
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
};

exports.createNewsArticle = async (req, res) => {
  try {
    const { title, fullText } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        error: 'Title is required.'
      });
    }

    if (!fullText || !fullText.trim()) {
      return res.status(400).json({
        error: 'Article text is required.'
      });
    }

    const images = buildImagePaths(req);
    const videoFile = getVideoFile(req);

    const freshNews = new News({
      title: title.trim(),
      fullText: fullText.trim(),
      imagePath: images[0] || '',
      images,
      videoPath: videoFile
        ? `/public/uploads/news/${videoFile.filename}`
        : '',
      createdBy: req.user.id,
      likes: [],
      comments: []
    });

    await freshNews.save();

    const populatedNews = await News.findById(freshNews._id)
      .populate('createdBy', 'username profileImage');

    normalizeNewsMedia(populatedNews);

    res.status(201).json(populatedNews);
  } catch (err) {
    getUploadedFiles(req).forEach(file => {
      removeUploadedFile(`/public/uploads/news/${file.filename}`);
    });

    res.status(500).json({
      error: err.message
    });
  }
};

exports.updateNewsArticle = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, fullText } = req.body;

    const oldArticle = await News.findById(id);

    if (!oldArticle) {
      return res.status(404).json({
        error: 'Target announcement document not found.'
      });
    }

    const updateData = {};

    if (typeof title === 'string') {
      updateData.title = title.trim();
    }

    if (typeof fullText === 'string') {
      updateData.fullText = fullText.trim();
    }

    const newImages = buildImagePaths(req);
    const newVideo = getVideoFile(req);

    if (newImages.length) {
      const oldImages =
        Array.isArray(oldArticle.images) &&
          oldArticle.images.length
          ? oldArticle.images
          : oldArticle.imagePath
            ? [oldArticle.imagePath]
            : [];

      oldImages.forEach(removeUploadedFile);

      updateData.images = newImages;
      updateData.imagePath = newImages[0] || '';
    }

    if (newVideo) {
      if (oldArticle.videoPath) {
        removeUploadedFile(oldArticle.videoPath);
      }

      updateData.videoPath =
        `/public/uploads/news/${newVideo.filename}`;
    }

    const updatedNews = await News.findByIdAndUpdate(
      id,
      updateData,
      {
        new: true,
        runValidators: true
      }
    ).populate('createdBy', 'username profileImage');

    normalizeNewsMedia(updatedNews);

    res.status(200).json(updatedNews);
  } catch (err) {
    getUploadedFiles(req).forEach(file => {
      removeUploadedFile(`/public/uploads/news/${file.filename}`);
    });

    res.status(500).json({
      error: err.message
    });
  }
};

exports.deleteNewsArticle = async (req, res) => {
  try {
    const { id } = req.params;

    const targetPost = await News.findById(id);

    if (!targetPost) {
      return res.status(404).json({
        error: 'Target news article not found.'
      });
    }

    const images =
      Array.isArray(targetPost.images) &&
        targetPost.images.length
        ? targetPost.images
        : targetPost.imagePath
          ? [targetPost.imagePath]
          : [];

    images.forEach(removeUploadedFile);

    if (targetPost.videoPath) {
      removeUploadedFile(targetPost.videoPath);
    }

    await News.findByIdAndDelete(id);

    res.status(200).json({
      message: 'News entry deleted successfully.'
    });
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
};

exports.addNewsComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({
        error: 'Comment cannot be empty.'
      });
    }

    const username =
      req.user.username ||
      'System Node';
    const profile = await User.findById(req.user.id).select('profileImage');

    const updatedPost = await News.findByIdAndUpdate(
      id,
      {
        $push: {
          comments: {
            userId: req.user.id,
            profileImage: profile?.profileImage || '',
            user: username,
            text: text.trim(),
            approvals: [],
            disapprovals: [],
            replies: []
          }
        }
      },
      {
        new: true
      }
    );

    if (!updatedPost) {
      return res.status(404).json({
        error: 'Target article not found.'
      });
    }

    const newComment =
      updatedPost.comments[
      updatedPost.comments.length - 1
      ];

    socket.getIO().emit(
      'news_comment_updated',
      {
        newsId: String(updatedPost._id),
        comment: newComment
      }
    );

    res.status(201).json({ comment: newComment });
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
};

exports.editNewsComment = async (req, res) => {
  try {
    const { newsId, commentId } = req.params;
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({
        error: 'Comment cannot be empty.'
      });
    }

    const news = await News.findById(newsId);

    if (!news) {
      return res.status(404).json({
        error: 'News article not found.'
      });
    }

    const comment = news.comments.id(commentId);

    if (!comment) {
      return res.status(404).json({
        error: 'Comment not found.'
      });
    }

    if (comment.user !== req.user.username && !['admin', 'editor'].includes(req.user.role)) {
      return res.status(403).json({ error: 'You can only edit your own comment.' });
    }

    comment.text = text.trim();

    await news.save();

    res.status(200).json({
      comment
    });
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
};

exports.toggleNewsLike = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const news = await News.findById(id);

    if (!news) {
      return res.status(404).json({
        error: 'News article not found.'
      });
    }

    const alreadyLiked = news.likes.some(
      likeId =>
        String(likeId) === String(userId)
    );

    if (alreadyLiked) {
      news.likes = news.likes.filter(
        likeId =>
          String(likeId) !== String(userId)
      );
    } else {
      news.likes.push(userId);
    }

    await news.save();

    res.status(200).json({
      liked: !alreadyLiked,
      likeCount: news.likes.length
    });
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
};

exports.approveComment = async (req, res) => {
  try {
    const { newsId, commentId } = req.params;
    const userId = req.user.id;

    const news = await News.findById(newsId);

    if (!news) {
      return res.status(404).json({
        error: 'News article not found.'
      });
    }

    const comment = news.comments.id(commentId);

    if (!comment) {
      return res.status(404).json({
        error: 'Comment not found.'
      });
    }

    const alreadyApproved = comment.approvals.some(
      id => String(id) === String(userId)
    );

    comment.disapprovals =
      comment.disapprovals.filter(
        id => String(id) !== String(userId)
      );

    if (alreadyApproved) {
      comment.approvals =
        comment.approvals.filter(
          id => String(id) !== String(userId)
        );
    } else {
      comment.approvals.push(userId);
    }

    await news.save();

    res.status(200).json({
      comment
    });
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
};

exports.disapproveComment = async (req, res) => {
  try {
    const { newsId, commentId } = req.params;
    const userId = req.user.id;

    const news = await News.findById(newsId);

    if (!news) {
      return res.status(404).json({
        error: 'News article not found.'
      });
    }

    const comment = news.comments.id(commentId);

    if (!comment) {
      return res.status(404).json({
        error: 'Comment not found.'
      });
    }

    const alreadyDisapproved =
      comment.disapprovals.some(
        id => String(id) === String(userId)
      );

    comment.approvals =
      comment.approvals.filter(
        id => String(id) !== String(userId)
      );

    if (alreadyDisapproved) {
      comment.disapprovals =
        comment.disapprovals.filter(
          id => String(id) !== String(userId)
        );
    } else {
      comment.disapprovals.push(userId);
    }

    await news.save();

    res.status(200).json({
      comment
    });
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
};

exports.addCommentReply = async (req, res) => {
  try {
    const { newsId, commentId } = req.params;
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({
        error: 'Reply cannot be empty.'
      });
    }

    const news = await News.findById(newsId);

    if (!news) {
      return res.status(404).json({
        error: 'News article not found.'
      });
    }

    const comment = news.comments.id(commentId);

    if (!comment) {
      return res.status(404).json({
        error: 'Comment not found.'
      });
    }

    const profile = await User.findById(req.user.id).select('profileImage');
    comment.replies.push({
      userId: req.user.id,
      profileImage: profile?.profileImage || '',
      user: req.user.username || 'System Node',
      text: text.trim(),
      approvals: [],
      disapprovals: []
    });

    await news.save();

    res.status(201).json({
      comment
    });
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
};

exports.approveReply = async (req, res) => {
  try {
    const {
      newsId,
      commentId,
      replyId
    } = req.params;

    const userId = req.user.id;
    const news = await News.findById(newsId);

    if (!news) {
      return res.status(404).json({
        error: 'News article not found.'
      });
    }

    const comment = news.comments.id(commentId);

    if (!comment) {
      return res.status(404).json({
        error: 'Comment not found.'
      });
    }

    const reply = comment.replies.id(replyId);

    if (!reply) {
      return res.status(404).json({
        error: 'Reply not found.'
      });
    }

    const alreadyApproved = reply.approvals.some(
      id => String(id) === String(userId)
    );

    reply.disapprovals =
      reply.disapprovals.filter(
        id => String(id) !== String(userId)
      );

    if (alreadyApproved) {
      reply.approvals =
        reply.approvals.filter(
          id => String(id) !== String(userId)
        );
    } else {
      reply.approvals.push(userId);
    }

    await news.save();

    res.status(200).json({
      reply
    });
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
};

exports.disapproveReply = async (req, res) => {
  try {
    const {
      newsId,
      commentId,
      replyId
    } = req.params;

    const userId = req.user.id;
    const news = await News.findById(newsId);

    if (!news) {
      return res.status(404).json({
        error: 'News article not found.'
      });
    }

    const comment = news.comments.id(commentId);

    if (!comment) {
      return res.status(404).json({
        error: 'Comment not found.'
      });
    }

    const reply = comment.replies.id(replyId);

    if (!reply) {
      return res.status(404).json({
        error: 'Reply not found.'
      });
    }

    const alreadyDisapproved =
      reply.disapprovals.some(
        id => String(id) === String(userId)
      );

    reply.approvals =
      reply.approvals.filter(
        id => String(id) !== String(userId)
      );

    if (alreadyDisapproved) {
      reply.disapprovals =
        reply.disapprovals.filter(
          id => String(id) !== String(userId)
        );
    } else {
      reply.disapprovals.push(userId);
    }

    await news.save();

    res.status(200).json({
      reply
    });
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
};

exports.deleteNewsComment = async (req, res) => {
  try {
    const {
      newsId,
      commentId
    } = req.params;

    const news = await News.findById(newsId);
    if (!news) return res.status(404).json({ error: 'Target article not found.' });
    const comment = news.comments.id(commentId);
    if (!comment) return res.status(404).json({ error: 'Comment not found.' });
    if (comment.user !== req.user.username && !['admin', 'editor'].includes(req.user.role)) {
      return res.status(403).json({ error: 'You can only delete your own comment.' });
    }

    const updatedPost =
      await News.findByIdAndUpdate(
        newsId,
        {
          $pull: {
            comments: {
              _id: commentId
            }
          }
        },
        {
          new: true
        }
      );

    if (!updatedPost) {
      return res.status(404).json({
        error: 'Target article not found.'
      });
    }

    res.status(200).json(
      updatedPost.comments
    );
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
};
