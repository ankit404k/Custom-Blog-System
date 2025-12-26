import api from './api';

const commentsService = {
  /**
   * Get comments for a post
   */
  getPostComments: async (postId, options = {}) => {
    const { page = 1, limit = 10, sort = 'newest' } = options;
    const params = new URLSearchParams();
    params.append('page', page);
    params.append('limit', limit);
    params.append('sort', sort);

    const response = await api.get(`/comments/post/${postId}?${params.toString()}`);
    return response.data;
  },

  /**
   * Get a single comment by ID
   */
  getCommentById: async (commentId) => {
    const response = await api.get(`/comments/${commentId}`);
    return response.data;
  },

  /**
   * Create a new comment
   */
  createComment: async (postId, content) => {
    const response = await api.post('/comments', {
      post_id: postId,
      content,
    });
    return response.data;
  },

  /**
   * Update a comment
   */
  updateComment: async (commentId, content) => {
    const response = await api.put(`/comments/${commentId}`, { content });
    return response.data;
  },

  /**
   * Delete a comment (soft delete)
   */
  deleteComment: async (commentId) => {
    const response = await api.delete(`/comments/${commentId}`);
    return response.data;
  },

  /**
   * Flag a comment as spam
   */
  flagComment: async (commentId, reason) => {
    const response = await api.post(`/comments/${commentId}/flag`, { reason });
    return response.data;
  },

  /**
   * Get all comments (admin only)
   */
  getAllComments: async (filters = {}) => {
    const {
      page = 1,
      limit = 10,
      status,
      post_id,
      user_id,
      search,
      sortBy = 'created_at',
      sortOrder = 'DESC',
    } = filters;

    const params = new URLSearchParams();
    params.append('page', page);
    params.append('limit', limit);
    if (status) params.append('status', status);
    if (post_id) params.append('post_id', post_id);
    if (user_id) params.append('user_id', user_id);
    if (search) params.append('search', search);
    params.append('sortBy', sortBy);
    params.append('sortOrder', sortOrder);

    const response = await api.get(`/comments?${params.toString()}`);
    return response.data;
  },

  /**
   * Approve a comment (admin only)
   */
  approveComment: async (commentId) => {
    const response = await api.patch(`/comments/${commentId}/approve`);
    return response.data;
  },

  /**
   * Reject a comment (admin only)
   */
  rejectComment: async (commentId, reason = null) => {
    const response = await api.patch(`/comments/${commentId}/reject`, { reason });
    return response.data;
  },

  /**
   * Bulk moderate comments (admin only)
   */
  bulkModerate: async (action, commentIds) => {
    const response = await api.post('/comments/bulk-moderate', {
      action,
      commentIds,
    });
    return response.data;
  },

  /**
   * Get comment statistics (admin only)
   */
  getCommentStats: async () => {
    const response = await api.get('/comments/stats');
    return response.data;
  },
};

export default commentsService;
