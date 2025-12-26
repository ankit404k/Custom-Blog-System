const { pool } = require('../config/database');

const User = {
  findById: async (id) => {
    const [rows] = await pool.query(
      'SELECT id, email, username, first_name, last_name, role, profile_picture, bio, created_at, updated_at FROM users WHERE id = ?',
      [id]
    );
    return rows[0];
  },

  findByEmail: async (email) => {
    const [rows] = await pool.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    return rows[0];
  },

  findByUsername: async (username) => {
    const [rows] = await pool.query(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );
    return rows[0];
  },

  create: async (userData) => {
    const [result] = await pool.query(
      'INSERT INTO users (email, password_hash, username, first_name, last_name, role) VALUES (?, ?, ?, ?, ?, ?)',
      [userData.email, userData.password_hash, userData.username, userData.first_name, userData.last_name, userData.role || 'user']
    );
    return result.insertId;
  },

  update: async (id, userData) => {
    const [result] = await pool.query(
      'UPDATE users SET ? WHERE id = ?',
      [userData, id]
    );
    return result.affectedRows;
  },

  delete: async (id) => {
    const [result] = await pool.query('DELETE FROM users WHERE id = ?', [id]);
    return result.affectedRows;
  },
};

const Post = {
  findById: async (id) => {
    const [rows] = await pool.query(
      'SELECT * FROM posts WHERE id = ?',
      [id]
    );
    return rows[0];
  },

  findBySlug: async (slug) => {
    const [rows] = await pool.query(
      'SELECT * FROM posts WHERE slug = ? AND deleted_at IS NULL',
      [slug]
    );
    return rows[0];
  },

  findAll: async (filters = {}) => {
    let query = 'SELECT * FROM posts WHERE deleted_at IS NULL';
    const params = [];

    if (filters.status) {
      query += ' AND status = ?';
      params.push(filters.status);
    }

    if (filters.user_id) {
      query += ' AND user_id = ?';
      params.push(filters.user_id);
    }

    if (filters.search) {
      query += ' AND (title LIKE ? OR content LIKE ?)';
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm);
    }

    // Sorting
    const sortBy = filters.sortBy || 'created_at';
    const sortOrder = filters.sortOrder || 'DESC';
    const allowedSortFields = ['created_at', 'updated_at', 'title', 'views', 'likes'];
    const allowedSortOrders = ['ASC', 'DESC'];

    if (allowedSortFields.includes(sortBy) && allowedSortOrders.includes(sortOrder)) {
      if (sortBy === 'views' || sortBy === 'likes') {
        query += ` ORDER BY (SELECT ${sortBy} FROM analytics WHERE post_id = posts.id) ${sortOrder}`;
      } else {
        query += ` ORDER BY ${sortBy} ${sortOrder}`;
      }
    } else {
      query += ' ORDER BY created_at DESC';
    }

    // Pagination
    if (filters.limit) {
      const limit = Math.min(parseInt(filters.limit), 50);
      query += ' LIMIT ?';
      params.push(limit);
    }

    if (filters.offset) {
      query += ' OFFSET ?';
      params.push(parseInt(filters.offset));
    }

    const [rows] = await pool.query(query, params);
    return rows;
  },

  create: async (postData) => {
    const [result] = await pool.query(
      'INSERT INTO posts (user_id, title, content, slug, status, featured_image) VALUES (?, ?, ?, ?, ?, ?)',
      [postData.user_id, postData.title, postData.content, postData.slug, postData.status || 'draft', postData.featured_image]
    );
    return result.insertId;
  },

  update: async (id, postData) => {
    const fields = [];
    const values = [];

    Object.keys(postData).forEach(key => {
      if (postData[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(postData[key]);
      }
    });

    values.push(id);

    const [result] = await pool.query(
      `UPDATE posts SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    return result.affectedRows;
  },

  softDelete: async (id) => {
    const [result] = await pool.query(
      'UPDATE posts SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?',
      [id]
    );
    return result.affectedRows;
  },

  restorePost: async (id) => {
    const [result] = await pool.query(
      'UPDATE posts SET deleted_at = NULL WHERE id = ?',
      [id]
    );
    return result.affectedRows;
  },

  getUserPosts: async (userId, options = {}) => {
    const { publishedOnly = true, page = 1, limit = 10, status } = options;
    const offset = (page - 1) * limit;

    let query = `
      SELECT p.*, 
             (SELECT COUNT(*) FROM comments WHERE post_id = p.id AND deleted_at IS NULL AND status = 'approved') as comment_count,
             a.views, a.likes
      FROM posts p
      LEFT JOIN analytics a ON a.post_id = p.id
      WHERE p.user_id = ?
    `;
    const params = [userId];

    if (publishedOnly) {
      query += ' AND p.status = ? AND p.deleted_at IS NULL';
      params.push('published');
    } else {
      query += ' AND p.deleted_at IS NULL';
      if (status) {
        query += ' AND p.status = ?';
        params.push(status);
      }
    }

    query += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [rows] = await pool.query(query, params);
    return rows;
  },

  getDeletedPosts: async (options = {}) => {
    const { page = 1, limit = 10 } = options;
    const offset = (page - 1) * limit;

    const query = `
      SELECT p.*, u.username, u.first_name, u.last_name,
             a.views, a.likes
      FROM posts p
      JOIN users u ON u.id = p.user_id
      LEFT JOIN analytics a ON a.post_id = p.id
      WHERE p.deleted_at IS NOT NULL
      ORDER BY p.deleted_at DESC
      LIMIT ? OFFSET ?
    `;

    const [rows] = await pool.query(query, [limit, offset]);
    return rows;
  },

  searchPosts: async (searchTerm, options = {}) => {
    const { page = 1, limit = 10, status = 'published' } = options;
    const offset = (page - 1) * limit;

    const query = `
      SELECT p.*, u.username, u.first_name, u.last_name,
             a.views, a.likes
      FROM posts p
      JOIN users u ON u.id = p.user_id
      LEFT JOIN analytics a ON a.post_id = p.id
      WHERE p.deleted_at IS NULL
        AND p.status = ?
        AND (p.title LIKE ? OR p.content LIKE ?)
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const searchPattern = `%${searchTerm}%`;
    const [rows] = await pool.query(query, [status, searchPattern, searchPattern, limit, offset]);
    return rows;
  },

  getPostWithAuthor: async (postId) => {
    const [rows] = await pool.query(
      `SELECT p.*, 
              u.id as author_id, u.username, u.first_name, u.last_name, u.email, u.profile_picture, u.bio,
              a.views, a.likes, a.comments_count
       FROM posts p
       JOIN users u ON u.id = p.user_id
       LEFT JOIN analytics a ON a.post_id = p.id
       WHERE p.id = ? AND p.deleted_at IS NULL`,
      [postId]
    );
    return rows[0];
  },

  countPosts: async (filters = {}) => {
    let query = 'SELECT COUNT(*) as total FROM posts WHERE deleted_at IS NULL';
    const params = [];

    if (filters.status) {
      query += ' AND status = ?';
      params.push(filters.status);
    }

    if (filters.user_id) {
      query += ' AND user_id = ?';
      params.push(filters.user_id);
    }

    if (filters.search) {
      query += ' AND (title LIKE ? OR content LIKE ?)';
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm);
    }

    const [rows] = await pool.query(query, params);
    return rows[0].total;
  },
};

const Comment = {
  findById: async (id) => {
    const [rows] = await pool.query(
      `SELECT c.*, u.username, u.first_name, u.last_name, u.email, u.profile_picture
       FROM comments c
       JOIN users u ON u.id = c.user_id
       WHERE c.id = ? AND c.deleted_at IS NULL`,
      [id]
    );
    return rows[0];
  },

  findByPostId: async (postId, status = 'approved', options = {}) => {
    const { page = 1, limit = 10, sortBy = 'created_at', sortOrder = 'DESC' } = options;
    const offset = (page - 1) * limit;

    let query = `
      SELECT c.*, u.username, u.first_name, u.last_name, u.profile_picture
      FROM comments c
      JOIN users u ON u.id = c.user_id
      WHERE c.post_id = ? AND c.deleted_at IS NULL
    `;
    const params = [postId];

    if (status && status !== 'all') {
      query += ' AND c.status = ?';
      params.push(status);
    }

    const allowedSort = ['created_at', 'updated_at'];
    const allowedOrder = ['ASC', 'DESC'];
    const sort = allowedSort.includes(sortBy) ? sortBy : 'created_at';
    const order = allowedOrder.includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';

    query += ` ORDER BY c.${sort} ${order} LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const [rows] = await pool.query(query, params);
    return rows;
  },

  findAll: async (filters = {}) => {
    const { page = 1, limit = 10, status, post_id, user_id, search } = filters;
    const offset = (page - 1) * limit;

    let query = `
      SELECT c.*, u.username, u.first_name, u.last_name, u.email, u.profile_picture,
             p.title as post_title
      FROM comments c
      JOIN users u ON u.id = c.user_id
      JOIN posts p ON p.id = c.post_id
      WHERE c.deleted_at IS NULL
    `;
    const params = [];

    if (status && status !== 'all') {
      query += ' AND c.status = ?';
      params.push(status);
    }

    if (post_id) {
      query += ' AND c.post_id = ?';
      params.push(post_id);
    }

    if (user_id) {
      query += ' AND c.user_id = ?';
      params.push(user_id);
    }

    if (search) {
      query += ' AND (c.content LIKE ? OR u.username LIKE ?)';
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern);
    }

    query += ' ORDER BY c.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [rows] = await pool.query(query, params);
    return rows;
  },

  countComments: async (filters = {}) => {
    const { status, post_id, user_id } = filters;

    let query = 'SELECT COUNT(*) as total FROM comments WHERE deleted_at IS NULL';
    const params = [];

    if (status && status !== 'all') {
      query += ' AND status = ?';
      params.push(status);
    }

    if (post_id) {
      query += ' AND post_id = ?';
      params.push(post_id);
    }

    if (user_id) {
      query += ' AND user_id = ?';
      params.push(user_id);
    }

    const [rows] = await pool.query(query, params);
    return rows[0].total;
  },

  create: async (commentData) => {
    const [result] = await pool.query(
      'INSERT INTO comments (post_id, user_id, content, status) VALUES (?, ?, ?, ?)',
      [commentData.post_id, commentData.user_id, commentData.content, commentData.status || 'pending']
    );
    return result.insertId;
  },

  update: async (id, commentData) => {
    const fields = [];
    const values = [];

    Object.keys(commentData).forEach(key => {
      if (commentData[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(commentData[key]);
      }
    });

    values.push(id);

    const [result] = await pool.query(
      `UPDATE comments SET ${fields.join(', ')} WHERE id = ? AND deleted_at IS NULL`,
      values
    );
    return result.affectedRows;
  },

  softDelete: async (id) => {
    const [result] = await pool.query(
      'UPDATE comments SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?',
      [id]
    );
    return result.affectedRows;
  },

  approve: async (id) => {
    const [result] = await pool.query(
      'UPDATE comments SET status = ? WHERE id = ? AND deleted_at IS NULL',
      ['approved', id]
    );
    return result.affectedRows;
  },

  reject: async (id, reason = null) => {
    const [result] = await pool.query(
      'UPDATE comments SET status = ?, rejection_reason = ? WHERE id = ? AND deleted_at IS NULL',
      ['rejected', reason, id]
    );
    return result.affectedRows;
  },

  flag: async (commentId, userId, reason) => {
    try {
      await pool.query(
        'INSERT INTO comment_flags (comment_id, user_id, reason) VALUES (?, ?, ?)',
        [commentId, userId, reason]
      );
      
      const [result] = await pool.query(
        'UPDATE comments SET flag_count = flag_count + 1 WHERE id = ?',
        [commentId]
      );
      
      return result.affectedRows;
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw new Error('You have already flagged this comment');
      }
      throw error;
    }
  },

  getFlags: async (commentId) => {
    const [rows] = await pool.query(
      `SELECT cf.*, u.username, u.email
       FROM comment_flags cf
       JOIN users u ON u.id = cf.user_id
       WHERE cf.comment_id = ?
       ORDER BY cf.created_at DESC`,
      [commentId]
    );
    return rows;
  },

  checkRateLimit: async (userId) => {
    const [rows] = await pool.query(
      `SELECT * FROM comment_rate_limit 
       WHERE user_id = ? AND window_start > DATE_SUB(NOW(), INTERVAL 1 HOUR)`,
      [userId]
    );

    if (rows.length === 0) {
      await pool.query(
        'INSERT INTO comment_rate_limit (user_id, comment_count, window_start) VALUES (?, 1, NOW()) ON DUPLICATE KEY UPDATE comment_count = 1, window_start = NOW()',
        [userId]
      );
      return { allowed: true, count: 1 };
    }

    const rateLimit = rows[0];
    if (rateLimit.comment_count >= 5) {
      return { allowed: false, count: rateLimit.comment_count };
    }

    await pool.query(
      'UPDATE comment_rate_limit SET comment_count = comment_count + 1 WHERE user_id = ?',
      [userId]
    );

    return { allowed: true, count: rateLimit.comment_count + 1 };
  },

  checkDuplicate: async (userId, content, postId) => {
    const [rows] = await pool.query(
      `SELECT * FROM comments 
       WHERE user_id = ? AND content = ? AND post_id = ? 
       AND created_at > DATE_SUB(NOW(), INTERVAL 10 MINUTE)
       AND deleted_at IS NULL`,
      [userId, content, postId]
    );
    return rows.length > 0;
  },

  getStats: async () => {
    const [rows] = await pool.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected,
        SUM(CASE WHEN flag_count > 0 THEN 1 ELSE 0 END) as flagged
      FROM comments
      WHERE deleted_at IS NULL
    `);
    return rows[0];
  },

  bulkApprove: async (ids) => {
    if (!ids || ids.length === 0) return 0;
    const placeholders = ids.map(() => '?').join(',');
    const [result] = await pool.query(
      `UPDATE comments SET status = 'approved' WHERE id IN (${placeholders}) AND deleted_at IS NULL`,
      ids
    );
    return result.affectedRows;
  },

  bulkReject: async (ids, reason = null) => {
    if (!ids || ids.length === 0) return 0;
    const placeholders = ids.map(() => '?').join(',');
    const [result] = await pool.query(
      `UPDATE comments SET status = 'rejected', rejection_reason = ? WHERE id IN (${placeholders}) AND deleted_at IS NULL`,
      [reason, ...ids]
    );
    return result.affectedRows;
  },

  bulkDelete: async (ids) => {
    if (!ids || ids.length === 0) return 0;
    const placeholders = ids.map(() => '?').join(',');
    const [result] = await pool.query(
      `UPDATE comments SET deleted_at = CURRENT_TIMESTAMP WHERE id IN (${placeholders})`,
      ids
    );
    return result.affectedRows;
  },
};

const Analytics = {
  findByPostId: async (postId) => {
    const [rows] = await pool.query(
      'SELECT * FROM analytics WHERE post_id = ?',
      [postId]
    );
    return rows[0];
  },

  create: async (postId) => {
    const [result] = await pool.query(
      'INSERT INTO analytics (post_id) VALUES (?)',
      [postId]
    );
    return result.insertId;
  },

  incrementViews: async (postId) => {
    const [result] = await pool.query(
      'UPDATE analytics SET views = views + 1 WHERE post_id = ?',
      [postId]
    );
    return result.affectedRows;
  },

  incrementLikes: async (postId) => {
    const [result] = await pool.query(
      'UPDATE analytics SET likes = likes + 1 WHERE post_id = ?',
      [postId]
    );
    return result.affectedRows;
  },

  updateCommentsCount: async (postId) => {
    const [result] = await pool.query(
      'UPDATE analytics SET comments_count = (SELECT COUNT(*) FROM comments WHERE post_id = ? AND deleted_at IS NULL AND status = ?) WHERE post_id = ?',
      [postId, 'approved', postId]
    );
    return result.affectedRows;
  },
};

module.exports = { User, Post, Comment, Analytics };
