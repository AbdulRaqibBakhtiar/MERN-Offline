const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { protect, requireAdmin } = require('../middleware/auth');
const { requireNewsOwnerOrEditor, requireNewsAuthoringRole } = require('../middleware/newsAuthorization');

const {
  getNewsFeed,
  createNewsArticle,
  updateNewsArticle,
  deleteNewsArticle,
  addNewsComment,
  editNewsComment,
  toggleNewsLike,
  approveComment,
  disapproveComment,
  deleteNewsComment,
  addCommentReply,
  approveReply,
  disapproveReply
} = require('../controllers/newsController');

const {
  getActiveAds,
  createAdCampaign,
  updateAdCampaign,
  deleteAdCampaign
} = require('../controllers/adController');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folder = req.path.includes('/news')
      ? 'public/uploads/news/'
      : 'public/uploads/ads/';

    cb(null, folder);
  },

  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(
      /[^a-zA-Z0-9._-]/g,
      '_'
    );

    cb(
      null,
      `${Date.now()}-${Math.round(Math.random() * 1e9)}-${safeName}`
    );
  }
});

const upload = multer({
  storage,
  limits: {
    files: 10,
    fileSize: 25 * 1024 * 1024
  },

  fileFilter: (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const allowedTypes = {
      '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
      '.webp': 'image/webp', '.gif': 'image/gif', '.mp4': 'video/mp4',
      '.webm': 'video/webm', '.mov': 'video/quicktime'
    };
    if (allowedTypes[extension] === file.mimetype) {
      cb(null, true);
    } else {
      cb(
        new Error(
          'Only image and video files are allowed.'
        )
      );
    }
  }
});

const newsUpload = upload.fields([
  {
    name: 'images',
    maxCount: 10
  },
  {
    name: 'image',
    maxCount: 1
  },
  {
    name: 'video',
    maxCount: 1
  }
]);

router.get(
  '/news/latest',
  getNewsFeed
);

router.post(
  '/news',
  protect, requireNewsAuthoringRole,
  newsUpload,
  createNewsArticle
);

router.put(
  '/news/:id',
  protect, requireNewsOwnerOrEditor,
  newsUpload,
  updateNewsArticle
);

router.delete(
  '/news/:id',
  protect, requireNewsOwnerOrEditor,
  deleteNewsArticle
);

router.post(
  '/news/:id/like',
  protect,
  toggleNewsLike
);

router.post(
  '/news/:id/comments',
  protect,
  addNewsComment
);

router.put(
  '/news/:newsId/comments/:commentId',
  protect,
  editNewsComment
);

router.delete(
  '/news/:newsId/comments/:commentId',
  protect,
  deleteNewsComment
);

router.post(
  '/news/:newsId/comments/:commentId/approve',
  protect,
  approveComment
);

router.post(
  '/news/:newsId/comments/:commentId/disapprove',
  protect,
  disapproveComment
);

router.post(
  '/news/:newsId/comments/:commentId/replies',
  protect,
  addCommentReply
);

router.post(
  '/news/:newsId/comments/:commentId/replies/:replyId/approve',
  protect,
  approveReply
);

router.post(
  '/news/:newsId/comments/:commentId/replies/:replyId/disapprove',
  protect,
  disapproveReply
);

router.get(
  '/ads/active',
  getActiveAds
);

router.post(
  '/ads',
  protect, requireAdmin,
  upload.array('images', 10),
  createAdCampaign
);

router.put(
  '/ads/:id',
  protect, requireAdmin,
  upload.array('images', 10),
  updateAdCampaign
);

router.delete(
  '/ads/:id',
  protect, requireAdmin,
  deleteAdCampaign
);

module.exports = router;
