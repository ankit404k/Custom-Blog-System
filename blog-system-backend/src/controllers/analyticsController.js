const AnalyticsModel = require('../models/analyticsModel');
const { 
  calculateEngagementRate, 
  formatMetrics, 
  generateTrendData,
  formatDate,
  getRelativeTime 
} = require('../utils/analytics');
const { pool } = require('../config/database');

// ==================== DASHBOARD ====================

/**
 * Get comprehensive dashboard metrics
 * @route GET /api/analytics/dashboard
 */
const getDashboardMetrics = async (req, res, next) => {
  try {
    const { timeRange = 'all' } = req.query;
    
    const metrics = await AnalyticsModel.getDashboardMetrics(timeRange);
    
    // Get trends for comparison
    const trends = await AnalyticsModel.getTrends(timeRange === 'all' ? 30 : parseInt(timeRange));
    
    res.json({
      success: true,
      data: {
        metrics,
        trends
      }
    });
  } catch (error) {
    next(error);
  }
};

// ==================== POSTS ANALYTICS ====================

/**
 * Get analytics for all posts
 * @route GET /api/analytics/posts
 */
const getPostsAnalytics = async (req, res, next) => {
  try {
    const {
      sortBy = 'views',
      sortOrder = 'DESC',
      page = 1,
      limit = 20,
      search,
      startDate,
      endDate
    } = req.query;
    
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    const filters = {
      sortBy,
      sortOrder,
      limit: parseInt(limit),
      offset,
      search,
      startDate,
      endDate
    };
    
    const posts = await AnalyticsModel.getPostsAnalytics(filters);
    
    // Format posts data
    const formattedPosts = posts.map(post => ({
      ...post,
      engagement_rate: parseFloat(post.engagement_rate),
      formattedDate: formatDate(post.published_at || post.created_at)
    }));
    
    res.json({
      success: true,
      data: formattedPosts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: formattedPosts.length
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get analytics for a single post
 * @route GET /api/analytics/posts/:postId
 */
const getSinglePostAnalytics = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const { userId } = req.user || {}; // Get authenticated user if available
    
    const analytics = await AnalyticsModel.getAnalyticsForPost(postId);
    
    if (!analytics) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }
    
    // Check if current user has liked the post
    let isLiked = false;
    if (userId) {
      isLiked = await AnalyticsModel.isPostLikedByUser(postId, userId);
    }
    
    // Get view history
    const viewHistory = await AnalyticsModel.getPostViewHistory(postId, 30);
    
    // Get like history
    const likeHistory = await AnalyticsModel.getPostLikeHistory(postId, 30);
    
    // Format trends
    const viewTrend = generateTrendData(viewHistory, 'daily');
    const likeTrend = generateTrendData(likeHistory, 'daily');
    
    res.json({
      success: true,
      data: {
        ...analytics,
        isLiked,
        viewTrend,
        likeTrend
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Track post view
 * @route POST /api/analytics/track-view
 */
const trackView = async (req, res, next) => {
  try {
    const { post_id } = req.body;
    const userId = req.user?.id || null;
    
    // Get metadata from request
    const sessionId = req.sessionID || req.ip || null;
    const ip_address = req.ip || null;
    const user_agent = req.get('user-agent') || null;
    const referrer = req.get('referer') || null;
    
    if (!post_id) {
      return res.status(400).json({
        success: false,
        message: 'Post ID is required'
      });
    }
    
    await AnalyticsModel.trackView(post_id, userId, sessionId, {
      ip_address,
      user_agent,
      referrer
    });
    
    // Get updated analytics
    const analytics = await AnalyticsModel.getAnalyticsForPost(post_id);
    
    res.json({
      success: true,
      message: 'View tracked successfully',
      data: {
        views: analytics?.views || 0
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Like a post
 * @route POST /api/analytics/like
 */
const likePost = async (req, res, next) => {
  try {
    const { post_id } = req.body;
    const userId = req.user.id;
    
    if (!post_id) {
      return res.status(400).json({
        success: false,
        message: 'Post ID is required'
      });
    }
    
    // Check if already liked
    const alreadyLiked = await AnalyticsModel.isPostLikedByUser(post_id, userId);
    
    if (alreadyLiked) {
      return res.status(400).json({
        success: false,
        message: 'You have already liked this post'
      });
    }
    
    await AnalyticsModel.likePost(post_id, userId);
    
    const likes = await AnalyticsModel.getPostLikes(post_id);
    
    res.json({
      success: true,
      message: 'Post liked successfully',
      data: {
        like_count: likes,
        liked: true
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Unlike a post
 * @route POST /api/analytics/unlike
 */
const unlikePost = async (req, res, next) => {
  try {
    const { post_id } = req.body;
    const userId = req.user.id;
    
    if (!post_id) {
      return res.status(400).json({
        success: false,
        message: 'Post ID is required'
      });
    }
    
    await AnalyticsModel.unlikePost(post_id, userId);
    
    const likes = await AnalyticsModel.getPostLikes(post_id);
    
    res.json({
      success: true,
      message: 'Post unliked successfully',
      data: {
        like_count: likes,
        liked: false
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Toggle like (like or unlike based on current state)
 * @route POST /api/analytics/posts/:postId/toggle-like
 */
const toggleLike = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;
    
    const isLiked = await AnalyticsModel.isPostLikedByUser(postId, userId);
    
    if (isLiked) {
      await AnalyticsModel.unlikePost(postId, userId);
    } else {
      await AnalyticsModel.likePost(postId, userId);
    }
    
    const likes = await AnalyticsModel.getPostLikes(postId);
    
    res.json({
      success: true,
      message: isLiked ? 'Post unliked' : 'Post liked',
      data: {
        like_count: likes,
        liked: !isLiked
      }
    });
  } catch (error) {
    next(error);
  }
};

// ==================== USERS ANALYTICS ====================

/**
 * Get analytics for all users
 * @route GET /api/analytics/users
 */
const getUsersAnalytics = async (req, res, next) => {
  try {
    const {
      sortBy = 'total_posts',
      sortOrder = 'DESC',
      page = 1,
      limit = 20,
      search,
      activityLevel
    } = req.query;
    
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    const filters = {
      sortBy,
      sortOrder,
      limit: parseInt(limit),
      offset,
      search,
      activityLevel
    };
    
    const users = await AnalyticsModel.getUsersAnalytics(filters);
    
    // Format users data
    const formattedUsers = users.map(user => ({
      ...user,
      formattedLastLogin: user.last_login_at ? getRelativeTime(user.last_login_at) : 'Never',
      formattedJoinedDate: formatDate(user.account_created_at)
    }));
    
    res.json({
      success: true,
      data: formattedUsers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: formattedUsers.length
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get analytics for a single user
 * @route GET /api/analytics/users/:userId
 */
const getSingleUserAnalytics = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user?.id;
    const isAdmin = req.user?.role === 'admin';
    
    // Check authorization: admins can see any user, users can only see their own
    if (!isAdmin && parseInt(currentUserId) !== parseInt(userId)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view this user\'s analytics'
      });
    }
    
    const analytics = await AnalyticsModel.getAnalyticsForUser(userId);
    
    if (!analytics) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Get user's posts analytics
    const [postsData] = await pool.query(
      `SELECT 
        p.id,
        p.title,
        p.slug,
        p.published_at,
        a.views,
        (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likes,
        a.comments_count
       FROM posts p
       LEFT JOIN analytics a ON p.id = a.post_id
       WHERE p.user_id = ? AND p.deleted_at IS NULL
       ORDER BY a.views DESC`,
      [userId]
    );
    
    res.json({
      success: true,
      data: {
        ...analytics,
        posts: postsData.map(post => ({
          ...post,
          engagement_rate: post.views > 0 
            ? ((post.likes + post.comments_count) / post.views * 100).toFixed(2)
            : 0,
          formattedDate: formatDate(post.published_at)
        }))
      }
    });
  } catch (error) {
    next(error);
  }
};

// ==================== COMMENTS ANALYTICS ====================

/**
 * Get comments analytics
 * @route GET /api/analytics/comments
 */
const getCommentsAnalytics = async (req, res, next) => {
  try {
    const { days = 30 } = req.query;
    
    const analytics = await AnalyticsModel.getCommentsAnalytics(parseInt(days));
    
    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    next(error);
  }
};

// ==================== ENGAGEMENT ANALYTICS ====================

/**
 * Get overall engagement analytics
 * @route GET /api/analytics/engagement
 */
const getEngagementAnalytics = async (req, res, next) => {
  try {
    const { days = 30 } = req.query;
    
    const analytics = await AnalyticsModel.getEngagementAnalytics(parseInt(days));
    
    // Get top posts by engagement
    const topPosts = await AnalyticsModel.getTopPosts(10, 'total_engagement', parseInt(days));
    
    // Get top users by engagement
    const topUsers = await AnalyticsModel.getTopUsers(10, 'total_views', parseInt(days));
    
    res.json({
      success: true,
      data: {
        ...analytics,
        topPosts: topPosts.map(post => ({
          ...post,
          engagement_rate: parseFloat(post.engagement_rate)
        })),
        topUsers
      }
    });
  } catch (error) {
    next(error);
  }
};

// ==================== TOP CONTENT ====================

/**
 * Get top posts
 * @route GET /api/analytics/top-posts
 */
const getTopPosts = async (req, res, next) => {
  try {
    const { limit = 10, metric = 'views', days = 30 } = req.query;
    
    const topPosts = await AnalyticsModel.getTopPosts(
      parseInt(limit),
      metric,
      parseInt(days)
    );
    
    res.json({
      success: true,
      data: topPosts
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get top users
 * @route GET /api/analytics/top-users
 */
const getTopUsers = async (req, res, next) => {
  try {
    const { limit = 10, metric = 'total_posts', days = 30 } = req.query;
    
    const topUsers = await AnalyticsModel.getTopUsers(
      parseInt(limit),
      metric,
      parseInt(days)
    );
    
    res.json({
      success: true,
      data: topUsers
    });
  } catch (error) {
    next(error);
  }
};

// ==================== LEGACY ENDPOINTS (for backward compatibility) ====================

/**
 * Legacy endpoint - get post analytics
 * @deprecated Use getSinglePostAnalytics instead
 */
const getPostAnalytics = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const analytics = await AnalyticsModel.getAnalyticsForPost(postId);
    
    if (!analytics) {
      return res.status(404).json({
        success: false,
        message: 'Analytics not found for this post',
      });
    }
    
    res.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Legacy endpoint - get all analytics
 * @deprecated Use getPostsAnalytics instead
 */
const getAllAnalytics = async (req, res, next) => {
  try {
    const [analytics] = await pool.query(`
      SELECT 
        a.*,
        p.title as post_title,
        p.slug as post_slug,
        u.username as author_username
      FROM analytics a
      JOIN posts p ON a.post_id = p.id
      JOIN users u ON p.user_id = u.id
      WHERE p.deleted_at IS NULL
      ORDER BY a.views DESC
    `);

    res.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Legacy endpoint - increment post likes
 * @deprecated Use likePost or toggleLike instead
 */
const incrementPostLikes = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;
    
    // Check if already liked
    const alreadyLiked = await AnalyticsModel.isPostLikedByUser(postId, userId);
    
    if (alreadyLiked) {
      return res.status(400).json({
        success: false,
        message: 'You have already liked this post'
      });
    }
    
    await AnalyticsModel.likePost(postId, userId);
    
    const analytics = await AnalyticsModel.getAnalyticsForPost(postId);
    const likes = await AnalyticsModel.getPostLikes(postId);

    res.json({
      success: true,
      message: 'Post liked successfully',
      data: {
        ...analytics,
        like_count: likes
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Legacy endpoint - get dashboard stats
 * @deprecated Use getDashboardMetrics instead
 */
const getDashboardStats = async (req, res, next) => {
  try {
    const metrics = await AnalyticsModel.getDashboardMetrics('all');
    
    const stats = {
      totalUsers: metrics.users.total_users,
      activeUsers: metrics.users.active_users,
      newUsers: metrics.users.new_users,
      totalPosts: metrics.posts.total_posts,
      publishedPosts: metrics.posts.published_posts,
      draftPosts: metrics.posts.draft_posts,
      totalComments: metrics.comments.total_comments,
      pendingComments: metrics.comments.pending_comments,
      totalViews: metrics.views,
      totalLikes: metrics.likes,
      totalEngagement: metrics.engagement.total,
      engagementRate: metrics.engagement.rate
    };

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  // Dashboard
  getDashboardMetrics,
  
  // Posts Analytics
  getPostsAnalytics,
  getSinglePostAnalytics,
  getPostAnalytics, // Legacy
  getTopPosts,
  
  // View & Like Tracking
  trackView,
  likePost,
  unlikePost,
  toggleLike,
  incrementPostLikes, // Legacy
  
  // Users Analytics
  getUsersAnalytics,
  getSingleUserAnalytics,
  getTopUsers,
  
  // Comments Analytics
  getCommentsAnalytics,
  
  // Engagement Analytics
  getEngagementAnalytics,
  
  // Legacy
  getAllAnalytics,
  getDashboardStats
};
