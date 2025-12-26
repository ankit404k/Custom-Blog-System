const { Analytics } = require('../models');
const { pool } = require('../config/database');

const getPostAnalytics = async (req, res, next) => {
  try {
    const { postId } = req.params;

    const analytics = await Analytics.findByPostId(postId);

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

const getTopPosts = async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;

    const [topPosts] = await pool.query(`
      SELECT 
        p.*,
        a.views,
        a.likes,
        a.comments_count,
        u.username as author_username
      FROM posts p
      JOIN analytics a ON p.id = a.post_id
      JOIN users u ON p.user_id = u.id
      WHERE p.deleted_at IS NULL AND p.status = 'published'
      ORDER BY a.views DESC
      LIMIT ?
    `, [parseInt(limit)]);

    res.json({
      success: true,
      data: topPosts,
    });
  } catch (error) {
    next(error);
  }
};

const getDashboardStats = async (req, res, next) => {
  try {
    const [totalUsers] = await pool.query('SELECT COUNT(*) as count FROM users');
    const [totalPosts] = await pool.query('SELECT COUNT(*) as count FROM posts WHERE deleted_at IS NULL');
    const [totalComments] = await pool.query('SELECT COUNT(*) as count FROM comments WHERE deleted_at IS NULL');
    const [totalViews] = await pool.query('SELECT SUM(views) as total FROM analytics');
    const [totalLikes] = await pool.query('SELECT SUM(likes) as total FROM analytics');

    const stats = {
      totalUsers: totalUsers[0].count,
      totalPosts: totalPosts[0].count,
      totalComments: totalComments[0].count,
      totalViews: totalViews[0].total || 0,
      totalLikes: totalLikes[0].total || 0,
    };

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

const incrementPostLikes = async (req, res, next) => {
  try {
    const { postId } = req.params;

    await Analytics.incrementLikes(postId);

    const analytics = await Analytics.findByPostId(postId);

    res.json({
      success: true,
      message: 'Post liked successfully',
      data: analytics,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPostAnalytics,
  getAllAnalytics,
  getTopPosts,
  getDashboardStats,
  incrementPostLikes,
};
