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
      'SELECT * FROM posts WHERE id = ? AND deleted_at IS NULL',
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

    query += ' ORDER BY created_at DESC';

    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(parseInt(filters.limit));
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
    const [result] = await pool.query(
      'UPDATE posts SET ? WHERE id = ? AND deleted_at IS NULL',
      [postData, id]
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
};

const Comment = {
  findById: async (id) => {
    const [rows] = await pool.query(
      'SELECT * FROM comments WHERE id = ? AND deleted_at IS NULL',
      [id]
    );
    return rows[0];
  },

  findByPostId: async (postId) => {
    const [rows] = await pool.query(
      'SELECT * FROM comments WHERE post_id = ? AND deleted_at IS NULL ORDER BY created_at DESC',
      [postId]
    );
    return rows;
  },

  create: async (commentData) => {
    const [result] = await pool.query(
      'INSERT INTO comments (post_id, user_id, content, status) VALUES (?, ?, ?, ?)',
      [commentData.post_id, commentData.user_id, commentData.content, commentData.status || 'pending']
    );
    return result.insertId;
  },

  update: async (id, commentData) => {
    const [result] = await pool.query(
      'UPDATE comments SET ? WHERE id = ? AND deleted_at IS NULL',
      [commentData, id]
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
      'UPDATE analytics SET comments_count = (SELECT COUNT(*) FROM comments WHERE post_id = ? AND deleted_at IS NULL) WHERE post_id = ?',
      [postId, postId]
    );
    return result.affectedRows;
  },
};

module.exports = { User, Post, Comment, Analytics };
