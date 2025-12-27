const express = require('express');
const router = express.Router();
const {
  getDashboardMetrics,
  getPostsAnalytics,
  getSinglePostAnalytics,
  getPostAnalytics,
  getTopPosts,
  getUsersAnalytics,
  getSingleUserAnalytics,
  getTopUsers,
  getCommentsAnalytics,
  getEngagementAnalytics,
  trackView,
  likePost,
  unlikePost,
  toggleLike,
  incrementPostLikes,
  getAllAnalytics,
  getDashboardStats
} = require('../controllers/analyticsController');
const { verifyToken, checkRole } = require('../middleware/auth');

// ==================== DASHBOARD ====================
// Get comprehensive dashboard metrics (admin only)
router.get('/dashboard', verifyToken, checkRole('admin'), getDashboardMetrics);

// ==================== POSTS ANALYTICS ====================
// Get all posts analytics (admin only)
router.get('/posts', verifyToken, checkRole('admin'), getPostsAnalytics);

// Get single post analytics (public, but with restricted data for non-admins)
router.get('/posts/:postId', getSinglePostAnalytics);

// Track post view (public)
router.post('/track-view', trackView);

// Like a post (authenticated)
router.post('/like', verifyToken, likePost);

// Unlike a post (authenticated)
router.post('/unlike', verifyToken, unlikePost);

// Toggle like (authenticated)
router.post('/posts/:postId/toggle-like', verifyToken, toggleLike);

// Get top posts (public)
router.get('/top-posts', getTopPosts);

// ==================== USERS ANALYTICS ====================
// Get all users analytics (admin only)
router.get('/users', verifyToken, checkRole('admin'), getUsersAnalytics);

// Get single user analytics (admin or own user)
router.get('/users/:userId', verifyToken, getSingleUserAnalytics);

// Get top users (admin only)
router.get('/top-users', verifyToken, checkRole('admin'), getTopUsers);

// ==================== COMMENTS ANALYTICS ====================
// Get comments analytics (admin only)
router.get('/comments', verifyToken, checkRole('admin'), getCommentsAnalytics);

// ==================== ENGAGEMENT ANALYTICS ====================
// Get overall engagement analytics (admin only)
router.get('/engagement', verifyToken, checkRole('admin'), getEngagementAnalytics);

// ==================== LEGACY ENDPOINTS (for backward compatibility) ====================
// Legacy: get post analytics
router.get('/post/:postId', getPostAnalytics);

// Legacy: get all analytics
router.get('/all', verifyToken, checkRole('admin'), getAllAnalytics);

// Legacy: get dashboard stats
router.get('/dashboard-stats', verifyToken, checkRole('admin'), getDashboardStats);

// Legacy: increment post likes
router.post('/post/:postId/like', verifyToken, incrementPostLikes);

module.exports = router;
