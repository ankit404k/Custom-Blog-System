const express = require('express');
const router = express.Router();
const {
  getAllPosts,
  getPostById,
  getPostBySlug,
  createPost,
  updatePost,
  deletePost,
  getUserPosts,
} = require('../controllers/postsController');
const { verifyToken, checkRole } = require('../middleware/auth');

router.get('/', getAllPosts);
router.get('/my-posts', verifyToken, getUserPosts);
router.get('/:id', getPostById);
router.get('/slug/:slug', getPostBySlug);
router.post('/', verifyToken, createPost);
router.put('/:id', verifyToken, updatePost);
router.delete('/:id', verifyToken, deletePost);

module.exports = router;
