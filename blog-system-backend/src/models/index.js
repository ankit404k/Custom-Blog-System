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
