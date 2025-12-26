const express = require('express');
const router = express.Router();
const {
  getCommentsByPostId,
  createComment,
  updateComment,
  deleteComment,
  approveComment,
  rejectComment,
  flagComment,
  getAllComments,
  getCommentById,
  bulkModerateComments,
  getCommentStats,
} = require('../controllers/commentsController');
const { verifyToken, checkRole } = require('../middleware/auth');

// Public routes
router.get('/post/:postId', getCommentsByPostId);
router.get('/:id', getCommentById);

// Protected routes (authentication required)
router.post('/', verifyToken, createComment);
router.put('/:id', verifyToken, updateComment);
router.delete('/:id', verifyToken, deleteComment);
router.post('/:id/flag', verifyToken, flagComment);

// Admin-only routes
router.get('/', verifyToken, checkRole('admin'), getAllComments);
router.patch('/:id/approve', verifyToken, checkRole('admin'), approveComment);
router.patch('/:id/reject', verifyToken, checkRole('admin'), rejectComment);
router.post('/bulk-moderate', verifyToken, checkRole('admin'), bulkModerateComments);
router.get('/stats', verifyToken, checkRole('admin'), getCommentStats);

module.exports = router;
