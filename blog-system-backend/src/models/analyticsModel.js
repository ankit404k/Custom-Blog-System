const { pool } = require('../config/database');

const AnalyticsModel = {
  // ==================== VIEW TRACKING ====================
  
  /**
   * Track a post view
   */
  trackView: async (postId, userId = null, sessionId = null, metadata = {}) => {
    const { ip_address, user_agent, referrer } = metadata;
    
    // Insert into post_views table
    await pool.query(
      `INSERT INTO post_views (post_id, user_id, session_id, ip_address, user_agent, referrer)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [postId, userId, sessionId, ip_address, user_agent, referrer]
    );

    // Update analytics table
    const [result] = await pool.query(
      `INSERT INTO analytics (post_id, views) VALUES (?, 1)
       ON DUPLICATE KEY UPDATE views = views + 1`,
      [postId]
    );

    return result.affectedRows;
  },

  /**
   * Get post views count
   */
  getPostViews: async (postId) => {
    const [rows] = await pool.query(
      'SELECT views FROM analytics WHERE post_id = ?',
      [postId]
    );
    return rows[0]?.views || 0;
  },

  /**
   * Get view history for a post (daily breakdown)
   */
  getPostViewHistory: async (postId, days = 30) => {
    const [rows] = await pool.query(
      `SELECT 
        DATE(created_at) as date,
        COUNT(*) as views,
        COUNT(DISTINCT session_id) as unique_visitors
       FROM post_views
       WHERE post_id = ? AND created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
       GROUP BY DATE(created_at)
       ORDER BY date ASC`,
      [postId, days]
    );
    return rows;
  },

  // ==================== LIKE TRACKING ====================

  /**
   * Like a post
   */
  likePost: async (postId, userId) => {
    const [result] = await pool.query(
      'INSERT INTO likes (post_id, user_id) VALUES (?, ?)',
      [postId, userId]
    );
    return result.insertId;
  },

  /**
   * Unlike a post
   */
  unlikePost: async (postId, userId) => {
    const [result] = await pool.query(
      'DELETE FROM likes WHERE post_id = ? AND user_id = ?',
      [postId, userId]
    );
    return result.affectedRows;
  },

  /**
   * Check if user has liked a post
   */
  isPostLikedByUser: async (postId, userId) => {
    if (!userId) return false;
    const [rows] = await pool.query(
      'SELECT id FROM likes WHERE post_id = ? AND user_id = ?',
      [postId, userId]
    );
    return rows.length > 0;
  },

  /**
   * Get post likes count
   */
  getPostLikes: async (postId) => {
    const [rows] = await pool.query(
      'SELECT COUNT(*) as count FROM likes WHERE post_id = ?',
      [postId]
    );
    return rows[0].count;
  },

  /**
   * Get like history for a post (daily breakdown)
   */
  getPostLikeHistory: async (postId, days = 30) => {
    const [rows] = await pool.query(
      `SELECT 
        DATE(created_at) as date,
        COUNT(*) as likes
       FROM likes
       WHERE post_id = ? AND created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
       GROUP BY DATE(created_at)
       ORDER BY date ASC`,
      [postId, days]
    );
    return rows;
  },

  // ==================== POST ANALYTICS ====================

  /**
   * Get comprehensive analytics for a specific post
   */
  getAnalyticsForPost: async (postId) => {
    const [rows] = await pool.query(
      `SELECT 
        a.*,
        p.title,
        p.slug,
        p.status,
        p.published_at,
        u.username as author_name,
        u.id as author_id,
        (SELECT COUNT(*) FROM comments c WHERE c.post_id = ? AND c.status = 'approved' AND c.deleted_at IS NULL) as approved_comments,
        (SELECT COUNT(*) FROM comments c WHERE c.post_id = ? AND c.status = 'pending' AND c.deleted_at IS NULL) as pending_comments,
        (SELECT COUNT(*) FROM comments c WHERE c.post_id = ? AND c.status = 'rejected' AND c.deleted_at IS NULL) as rejected_comments,
        (SELECT COUNT(*) FROM likes l WHERE l.post_id = ?) as total_likes,
        (SELECT COUNT(DISTINCT session_id) FROM post_views pv WHERE pv.post_id = ?) as unique_views
       FROM analytics a
       JOIN posts p ON a.post_id = p.id
       JOIN users u ON p.user_id = u.id
       WHERE a.post_id = ?`,
      [postId, postId, postId, postId, postId, postId]
    );
    
    if (rows[0]) {
      // Calculate engagement rate
      const views = rows[0].views || 0;
      const likes = rows[0].total_likes || 0;
      const comments = rows[0].approved_comments || 0;
      rows[0].engagement_rate = views > 0 ? ((likes + comments) / views * 100).toFixed(2) : 0;
      rows[0].total_engagement = likes + comments;
    }
    
    return rows[0];
  },

  /**
   * Get all posts analytics with filters
   */
  getPostsAnalytics: async (filters = {}) => {
    const {
      sortBy = 'views',
      sortOrder = 'DESC',
      limit = 20,
      offset = 0,
      search,
      startDate,
      endDate
    } = filters;

    let query = `
      SELECT 
        p.id,
        p.title,
        p.slug,
        p.status,
        p.published_at,
        p.created_at,
        a.views,
        (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likes,
        a.comments_count,
        (SELECT COUNT(*) FROM likes WHERE post_id = p.id) + a.comments_count as total_engagement,
        CASE WHEN a.views > 0 THEN (((SELECT COUNT(*) FROM likes WHERE post_id = p.id) + a.comments_count) / a.views * 100) ELSE 0 END as engagement_rate,
        u.username as author_name
      FROM posts p
      LEFT JOIN analytics a ON p.id = a.post_id
      LEFT JOIN users u ON p.user_id = u.id
      WHERE p.deleted_at IS NULL
    `;
    
    const params = [];

    if (search) {
      query += ' AND (p.title LIKE ? OR p.content LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    if (startDate) {
      query += ' AND p.published_at >= ?';
      params.push(startDate);
    }

    if (endDate) {
      query += ' AND p.published_at <= ?';
      params.push(endDate);
    }

    const allowedSortFields = ['views', 'likes', 'engagement_rate', 'total_engagement', 'published_at', 'created_at'];
    const allowedSortOrders = ['ASC', 'DESC'];

    if (allowedSortFields.includes(sortBy) && allowedSortOrders.includes(sortOrder)) {
      query += ` ORDER BY ${sortBy} ${sortOrder}`;
    } else {
      query += ' ORDER BY a.views DESC';
    }

    query += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [rows] = await pool.query(query, params);
    return rows;
  },

  /**
   * Get top posts by metric
   */
  getTopPosts: async (limit = 10, metric = 'views', days = 30) => {
    const allowedMetrics = ['views', 'likes', 'comments_count', 'total_engagement', 'engagement_rate'];
    const sortBy = allowedMetrics.includes(metric) ? metric : 'views';

    const query = `
      SELECT 
        p.id,
        p.title,
        p.slug,
        a.views,
        (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likes,
        a.comments_count,
        (SELECT COUNT(*) FROM likes WHERE post_id = p.id) + a.comments_count as total_engagement,
        CASE WHEN a.views > 0 THEN (((SELECT COUNT(*) FROM likes WHERE post_id = p.id) + a.comments_count) / a.views * 100) ELSE 0 END as engagement_rate,
        u.username as author_name,
        p.published_at
      FROM posts p
      LEFT JOIN analytics a ON p.id = a.post_id
      LEFT JOIN users u ON p.user_id = u.id
      WHERE p.deleted_at IS NULL 
        AND p.status = 'published'
        AND p.published_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      ORDER BY ${sortBy} DESC
      LIMIT ?
    `;

    const [rows] = await pool.query(query, [days, parseInt(limit)]);
    return rows;
  },

  // ==================== USER ANALYTICS ====================

  /**
   * Get comprehensive analytics for a specific user
   */
  getAnalyticsForUser: async (userId) => {
    const [rows] = await pool.query(
      `SELECT 
        u.id,
        u.username,
        u.email,
        u.first_name,
        u.last_name,
        u.role,
        u.created_at as account_created_at,
        u.last_login_at,
        (SELECT COUNT(*) FROM posts WHERE user_id = u.id AND deleted_at IS NULL) as total_posts,
        (SELECT COUNT(*) FROM posts WHERE user_id = u.id AND deleted_at IS NULL AND status = 'published') as published_posts,
        (SELECT COUNT(*) FROM posts WHERE user_id = u.id AND deleted_at IS NULL AND status = 'draft') as draft_posts,
        (SELECT COUNT(*) FROM comments WHERE user_id = u.id AND deleted_at IS NULL) as total_comments,
        (SELECT COUNT(*) FROM comments WHERE user_id = u.id AND deleted_at IS NULL AND status = 'approved') as approved_comments,
        (SELECT COUNT(*) FROM comments WHERE user_id = u.id AND deleted_at IS NULL AND status = 'pending') as pending_comments,
        (SELECT SUM(a.views) FROM posts p JOIN analytics a ON p.id = a.post_id WHERE p.user_id = u.id AND p.deleted_at IS NULL) as total_views_on_posts,
        (SELECT SUM((SELECT COUNT(*) FROM likes WHERE post_id = p.id)) FROM posts p WHERE p.user_id = u.id AND p.deleted_at IS NULL) as total_likes_on_posts,
        CASE 
          WHEN u.last_login_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 'active'
          WHEN u.last_login_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 'inactive'
          ELSE 'dormant'
        END as activity_level
       FROM users u
       WHERE u.id = ?`,
      [userId]
    );

    if (rows[0]) {
      // Calculate average views per post
      const posts = rows[0].published_posts || 0;
      const views = rows[0].total_views_on_posts || 0;
      rows[0].average_views_per_post = posts > 0 ? (views / posts).toFixed(2) : 0;

      // Get most popular post
      const [topPost] = await pool.query(
        `SELECT p.id, p.title, p.slug, a.views
         FROM posts p
         LEFT JOIN analytics a ON p.id = a.post_id
         WHERE p.user_id = ? AND p.deleted_at IS NULL AND p.status = 'published'
         ORDER BY a.views DESC
         LIMIT 1`,
        [userId]
      );
      rows[0].most_popular_post = topPost[0] || null;

      // Get account age in days
      const accountCreated = new Date(rows[0].account_created_at);
      const now = new Date();
      const diffTime = Math.abs(now - accountCreated);
      rows[0].account_age_days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    return rows[0];
  },

  /**
   * Get all users analytics with filters
   */
  getUsersAnalytics: async (filters = {}) => {
    const {
      sortBy = 'total_posts',
      sortOrder = 'DESC',
      limit = 20,
      offset = 0,
      search,
      activityLevel
    } = filters;

    let query = `
      SELECT 
        u.id,
        u.username,
        u.email,
        u.role,
        u.created_at as account_created_at,
        u.last_login_at,
        (SELECT COUNT(*) FROM posts WHERE user_id = u.id AND deleted_at IS NULL) as total_posts,
        (SELECT COUNT(*) FROM posts WHERE user_id = u.id AND deleted_at IS NULL AND status = 'published') as published_posts,
        (SELECT COUNT(*) FROM comments WHERE user_id = u.id AND deleted_at IS NULL) as total_comments,
        (SELECT SUM(a.views) FROM posts p JOIN analytics a ON p.id = a.post_id WHERE p.user_id = u.id AND p.deleted_at IS NULL) as total_views,
        CASE 
          WHEN u.last_login_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 'active'
          WHEN u.last_login_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 'inactive'
          ELSE 'dormant'
        END as activity_level
      FROM users u
      WHERE 1=1
    `;
    
    const params = [];

    if (search) {
      query += ' AND (u.username LIKE ? OR u.email LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    if (activityLevel) {
      query += ` AND CASE 
        WHEN u.last_login_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 'active'
        WHEN u.last_login_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 'inactive'
        ELSE 'dormant'
      END = ?`;
      params.push(activityLevel);
    }

    const allowedSortFields = ['total_posts', 'published_posts', 'total_comments', 'total_views', 'last_login_at', 'account_created_at'];
    const allowedSortOrders = ['ASC', 'DESC'];

    if (allowedSortFields.includes(sortBy) && allowedSortOrders.includes(sortOrder)) {
      query += ` ORDER BY ${sortBy} ${sortOrder}`;
    } else {
      query += ' ORDER BY total_posts DESC';
    }

    query += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [rows] = await pool.query(query, params);
    return rows;
  },

  /**
   * Get top users by metric
   */
  getTopUsers: async (limit = 10, metric = 'total_posts', days = 30) => {
    const allowedMetrics = ['total_posts', 'published_posts', 'total_comments', 'total_views'];
    const sortBy = allowedMetrics.includes(metric) ? metric : 'total_posts';

    let query = '';
    const params = [parseInt(limit)];

    if (metric === 'total_views') {
      query = `
        SELECT 
          u.id,
          u.username,
          u.email,
          u.role,
          SUM(a.views) as total_views,
          COUNT(DISTINCT p.id) as post_count
        FROM users u
        JOIN posts p ON u.id = p.user_id
        LEFT JOIN analytics a ON p.id = a.post_id
        WHERE p.deleted_at IS NULL 
          AND p.status = 'published'
          AND p.published_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
        GROUP BY u.id
        ORDER BY total_views DESC
        LIMIT ?
      `;
      params.unshift(days);
    } else if (metric === 'total_comments') {
      query = `
        SELECT 
          u.id,
          u.username,
          u.email,
          u.role,
          COUNT(c.id) as total_comments
        FROM users u
        JOIN comments c ON u.id = c.user_id
        WHERE c.deleted_at IS NULL
          AND c.created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
        GROUP BY u.id
        ORDER BY total_comments DESC
        LIMIT ?
      `;
      params.unshift(days);
    } else {
      query = `
        SELECT 
          u.id,
          u.username,
          u.email,
          u.role,
          COUNT(DISTINCT p.id) as total_posts,
          SUM(CASE WHEN p.status = 'published' THEN 1 ELSE 0 END) as published_posts
        FROM users u
        LEFT JOIN posts p ON u.id = p.user_id
        WHERE p.deleted_at IS NULL OR p.deleted_at IS NULL
          AND (p.created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY) OR p.created_at IS NULL)
        GROUP BY u.id
        HAVING total_posts > 0
        ORDER BY ${sortBy} DESC
        LIMIT ?
      `;
      params.unshift(days);
    }

    const [rows] = await pool.query(query, params);
    return rows;
  },

  // ==================== COMMENTS ANALYTICS ====================

  /**
   * Get comprehensive comments analytics
   */
  getCommentsAnalytics: async (days = 30) => {
    const [totalComments] = await pool.query(
      'SELECT COUNT(*) as count FROM comments WHERE deleted_at IS NULL'
    );
    
    const [approvedComments] = await pool.query(
      'SELECT COUNT(*) as count FROM comments WHERE deleted_at IS NULL AND status = ?',
      ['approved']
    );
    
    const [pendingComments] = await pool.query(
      'SELECT COUNT(*) as count FROM comments WHERE deleted_at IS NULL AND status = ?',
      ['pending']
    );
    
    const [rejectedComments] = await pool.query(
      'SELECT COUNT(*) as count FROM comments WHERE deleted_at IS NULL AND status = ?',
      ['rejected']
    );

    // Get comments trend
    const [commentsTrend] = await pool.query(
      `SELECT 
        DATE(created_at) as date,
        COUNT(*) as total,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected
       FROM comments
       WHERE deleted_at IS NULL 
         AND created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
       GROUP BY DATE(created_at)
       ORDER BY date ASC`,
      [days]
    );

    // Get top commenters
    const [topCommenters] = await pool.query(
      `SELECT 
        u.id,
        u.username,
        COUNT(c.id) as comment_count
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.deleted_at IS NULL
       GROUP BY u.id
       ORDER BY comment_count DESC
       LIMIT 10`
    );

    // Get average moderation time (time from creation to approval)
    const [avgModerationTime] = await pool.query(
      `SELECT 
        AVG(TIMESTAMPDIFF(MINUTE, c.created_at, c.updated_at)) as avg_minutes
       FROM comments c
       WHERE c.status = 'approved' 
         AND c.deleted_at IS NULL
         AND c.created_at != c.updated_at`
    );

    return {
      total: totalComments[0].count,
      approved: approvedComments[0].count,
      pending: pendingComments[0].count,
      rejected: rejectedComments[0].count,
      trend: commentsTrend,
      topCommenters,
      averageModerationTime: avgModerationTime[0].avg_minutes ? Math.round(avgModerationTime[0].avg_minutes) : 0
    };
  },

  // ==================== ENGAGEMENT ANALYTICS ====================

  /**
   * Get overall engagement analytics
   */
  getEngagementAnalytics: async (days = 30) => {
    // Total engagement metrics
    const [totalEngagement] = await pool.query(
      `SELECT 
        SUM(a.views) as total_views,
        SUM((SELECT COUNT(*) FROM likes l WHERE l.post_id = a.post_id)) as total_likes,
        SUM(a.comments_count) as total_comments,
        SUM((SELECT COUNT(*) FROM likes l WHERE l.post_id = a.post_id) + a.comments_count) as total_engagement
       FROM analytics a
       JOIN posts p ON a.post_id = p.id
       WHERE p.deleted_at IS NULL`
    );

    // Engagement trend
    const [engagementTrend] = await pool.query(
      `SELECT 
        DATE(pv.created_at) as date,
        COUNT(DISTINCT pv.id) as views,
        (SELECT COUNT(*) FROM likes l WHERE DATE(l.created_at) = DATE(pv.created_at)) as likes,
        (SELECT COUNT(*) FROM comments c WHERE DATE(c.created_at) = DATE(pv.created_at) AND c.deleted_at IS NULL) as comments
       FROM post_views pv
       WHERE pv.created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
       GROUP BY DATE(pv.created_at)
       ORDER BY date ASC`,
      [days]
    );

    // Engagement by post status
    const [engagementByStatus] = await pool.query(
      `SELECT 
        p.status,
        COUNT(p.id) as post_count,
        SUM(a.views) as total_views,
        SUM((SELECT COUNT(*) FROM likes l WHERE l.post_id = a.post_id)) as total_likes,
        SUM(a.comments_count) as total_comments
       FROM posts p
       LEFT JOIN analytics a ON p.id = a.post_id
       WHERE p.deleted_at IS NULL
       GROUP BY p.status`
    );

    // Peak engagement times (hour of day)
    const [peakEngagementTimes] = await pool.query(
      `SELECT 
        HOUR(created_at) as hour,
        COUNT(*) as count
       FROM (
         SELECT created_at FROM post_views
         UNION ALL
         SELECT created_at FROM likes
         UNION ALL
         SELECT created_at FROM comments WHERE deleted_at IS NULL
       ) all_activity
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
       GROUP BY hour
       ORDER BY count DESC
       LIMIT 5`,
      [days]
    );

    return {
      total: totalEngagement[0],
      trend: engagementTrend,
      byStatus: engagementByStatus,
      peakTimes: peakEngagementTimes
    };
  },

  // ==================== DASHBOARD METRICS ====================

  /**
   * Get comprehensive dashboard metrics
   */
  getDashboardMetrics: async (timeRange = 'all') => {
    let dateFilter = '';
    if (timeRange === '7d') {
      dateFilter = 'AND created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)';
    } else if (timeRange === '30d') {
      dateFilter = 'AND created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)';
    } else if (timeRange === '90d') {
      dateFilter = 'AND created_at >= DATE_SUB(CURDATE(), INTERVAL 90 DAY)';
    }

    // Posts metrics
    const [postsMetrics] = await pool.query(
      `SELECT 
        COUNT(*) as total_posts,
        SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) as published_posts,
        SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as draft_posts
       FROM posts
       WHERE deleted_at IS NULL ${timeRange !== 'all' ? dateFilter : ''}`
    );

    // Users metrics
    const [usersMetrics] = await pool.query(
      `SELECT 
        COUNT(*) as total_users,
        SUM(CASE WHEN last_login_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) as active_users,
        SUM(CASE WHEN created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) as new_users
       FROM users`
    );

    // Comments metrics
    const [commentsMetrics] = await pool.query(
      `SELECT 
        COUNT(*) as total_comments,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_comments,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_comments
       FROM comments
       WHERE deleted_at IS NULL`
    );

    // Views and engagement
    const [engagementMetrics] = await pool.query(
      `SELECT 
        COALESCE(SUM(views), 0) as total_views,
        COALESCE(SUM(likes), 0) as total_likes,
        COALESCE(SUM(comments_count), 0) as total_comments_from_analytics
       FROM analytics`
    );

    // Get total likes from likes table (more accurate)
    const [totalLikes] = await pool.query('SELECT COUNT(*) as count FROM likes');
    const totalLikesCount = totalLikes[0].count;

    // Calculate engagement rate
    const totalViews = engagementMetrics[0].total_views || 0;
    const totalComments = commentsMetrics[0].approved_comments || 0;
    const engagementRate = totalViews > 0 
      ? ((totalLikesCount + totalComments) / totalViews * 100).toFixed(2)
      : 0;

    return {
      posts: postsMetrics[0],
      users: usersMetrics[0],
      comments: commentsMetrics[0],
      views: engagementMetrics[0].total_views || 0,
      likes: totalLikesCount,
      engagement: {
        total: totalLikesCount + totalComments,
        rate: parseFloat(engagementRate)
      }
    };
  },

  /**
   * Get trends for dashboard charts
   */
  getTrends: async (days = 30) => {
    // Posts trend
    const [postsTrend] = await pool.query(
      `SELECT 
        DATE(created_at) as date,
        COUNT(*) as posts,
        SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) as published
       FROM posts
       WHERE deleted_at IS NULL 
         AND created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
       GROUP BY DATE(created_at)
       ORDER BY date ASC`,
      [days]
    );

    // Users trend (new registrations)
    const [usersTrend] = await pool.query(
      `SELECT 
        DATE(created_at) as date,
        COUNT(*) as users
       FROM users
       WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
       GROUP BY DATE(created_at)
       ORDER BY date ASC`,
      [days]
    );

    // Comments trend
    const [commentsTrend] = await pool.query(
      `SELECT 
        DATE(created_at) as date,
        COUNT(*) as comments,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved
       FROM comments
       WHERE deleted_at IS NULL 
         AND created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
       GROUP BY DATE(created_at)
       ORDER BY date ASC`,
      [days]
    );

    return {
      posts: postsTrend,
      users: usersTrend,
      comments: commentsTrend
    };
  }
};

module.exports = AnalyticsModel;
