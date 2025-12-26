const express = require('express');
const router = express.Router();
const {
  createComment,
  getPostComments,
  getAllComments,
  getCommentById,
  updateComment,
  deleteComment,
  approveComment,
  rejectComment,
  flagComment,
  getCommentStats,
  bulkApprove,
  bulkReject,
  bulkDelete,
} = require('../controllers/commentsController');
const { verifyToken, checkRole } = require('../middleware/auth');

router.post('/', verifyToken, createComment);

router.get('/stats', verifyToken, checkRole('admin'), getCommentStats);

router.get('/', verifyToken, checkRole('admin'), getAllComments);

router.get('/post/:postId', getPostComments);

router.get('/:id', getCommentById);

router.put('/:id', verifyToken, updateComment);

router.delete('/:id', verifyToken, deleteComment);

router.post('/:id/approve', verifyToken, checkRole('admin'), approveComment);

router.post('/:id/reject', verifyToken, checkRole('admin'), rejectComment);

router.post('/:id/flag', verifyToken, flagComment);

router.post('/bulk/approve', verifyToken, checkRole('admin'), bulkApprove);

router.post('/bulk/reject', verifyToken, checkRole('admin'), bulkReject);

router.post('/bulk/delete', verifyToken, checkRole('admin'), bulkDelete);

module.exports = router;
