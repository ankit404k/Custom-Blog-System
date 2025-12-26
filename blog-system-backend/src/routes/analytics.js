const express = require('express');
const router = express.Router();
const {
  getPostAnalytics,
  getAllAnalytics,
  getTopPosts,
  getDashboardStats,
  incrementPostLikes,
} = require('../controllers/analyticsController');
const { verifyToken, checkRole } = require('../middleware/auth');

router.get('/post/:postId', getPostAnalytics);
router.get('/all', verifyToken, checkRole('admin'), getAllAnalytics);
router.get('/top-posts', getTopPosts);
router.get('/dashboard-stats', verifyToken, checkRole('admin'), getDashboardStats);
router.post('/post/:postId/like', verifyToken, incrementPostLikes);

module.exports = router;
