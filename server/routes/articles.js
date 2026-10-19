const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect } = require('../middleware/auth');
const {
  requireArticleAuthoringRole,
  requireArticleOwnerOrEditor,
  requireArticleWorkflowPermission
} = require('../middleware/articleAuthorization');
const controller = require('../controllers/articleController');

const uploadDir = path.join(__dirname, '..', 'public', 'uploads', 'articles');
fs.mkdirSync(uploadDir, { recursive: true });
const upload = multer({
  storage: multer.diskStorage({ destination: uploadDir, filename: (req, file, cb) => cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname).toLowerCase()}`) }),
  limits: { files: 10, fileSize: 25 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.gif': 'image/gif', '.mp4': 'video/mp4', '.webm': 'video/webm', '.mov': 'video/quicktime' };
    const extension = path.extname(file.originalname).toLowerCase();
    if (allowed[extension] === file.mimetype) return cb(null, true);
    return cb(new Error('Only supported image and video media can be attached.'));
  }
});
const router = express.Router();
router.get('/public', controller.listPublicArticles);
router.get('/', (req, res, next) => req.get('Authorization') ? protect(req, res, next) : next(), controller.listArticles);
router.post('/:id/view', controller.recordArticleView);
router.post('/autosave', protect, requireArticleAuthoringRole, controller.autosaveDraft);
router.put('/:id/autosave', protect, requireArticleAuthoringRole, requireArticleOwnerOrEditor, upload.array('media', 10), controller.autosaveArticle);
router.post('/', protect, requireArticleAuthoringRole, upload.array('media', 10), controller.createArticle);
router.put('/:id', protect, requireArticleAuthoringRole, requireArticleOwnerOrEditor, upload.array('media', 10), controller.updateArticle);
router.delete('/:id', protect, requireArticleAuthoringRole, requireArticleOwnerOrEditor, controller.deleteArticle);
router.patch('/:id/workflow', protect, requireArticleAuthoringRole, requireArticleWorkflowPermission, controller.changeWorkflow);
router.post('/:id/revisions/:revisionId/restore', protect, requireArticleAuthoringRole, requireArticleOwnerOrEditor, controller.restoreRevision);
router.post('/:id/comments', protect, controller.addComment);
router.post('/:id/comments/:commentId/replies', protect, controller.addReply);
module.exports = router;
