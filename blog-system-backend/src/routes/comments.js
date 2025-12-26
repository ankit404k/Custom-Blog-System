const express = require('express');
const router = express.Router();
const {
  getCommentsByPostId,
  createComment,
  updateComment,
  deleteComment,
  approveComment,
  rejectComment,
} = require('../controllers/commentsController');
const { verifyToken, checkRole } = require('../middleware/auth');

router.get('/post/:postId', getCommentsByPostId);
router.post('/', verifyToken, createComment);
router.put('/:id', verifyToken, updateComment);
router.delete('/:id', verifyToken, deleteComment);
router.patch('/:id/approve', verifyToken, checkRole('admin'), approveComment);
router.patch('/:id/reject', verifyToken, checkRole('admin'), rejectComment);

module.exports = router;
