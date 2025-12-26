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
  publishPost,
  unpublishPost,
  getPostsByUserId,
  getDeletedPosts,
  restorePost,
} = require('../controllers/postsController');
const { verifyToken, checkRole } = require('../middleware/auth');
const { handleUploadError } = require('../middleware/upload');

// Image upload endpoint
router.post('/upload-image', verifyToken, handleUploadError, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
      });
    }

    const imageUrl = `/uploads/${req.file.filename}`;

    res.json({
      success: true,
      message: 'Image uploaded successfully',
      data: {
        url: imageUrl,
        filename: req.file.filename,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error uploading image',
      error: error.message,
    });
  }
});

// Public and protected routes - order matters, more specific routes first
router.get('/', getAllPosts);
router.get('/my-posts', verifyToken, getUserPosts);
router.get('/slug/:slug', getPostBySlug);
router.get('/user/:userId', getPostsByUserId);
router.get('/deleted', verifyToken, checkRole('admin'), getDeletedPosts);
router.get('/:id', getPostById);

// Protected routes
router.post('/', verifyToken, createPost);
router.put('/:id', verifyToken, updatePost);
router.delete('/:id', verifyToken, deletePost);

// Publish/Unpublish routes
router.post('/:id/publish', verifyToken, publishPost);
router.post('/:id/unpublish', verifyToken, unpublishPost);

// Restore post (admin only)
router.post('/:id/restore', verifyToken, checkRole('admin'), restorePost);

module.exports = router;
