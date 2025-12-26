import api from './api';

const commentsService = {
  createComment: async (postId, content) => {
    const response = await api.post('/comments', { post_id: postId, content });
    return response.data;
  },

  getPostComments: async (postId, page = 1, limit = 10, sort = 'DESC') => {
    const response = await api.get(`/comments/post/${postId}`, {
      params: { page, limit, sort },
    });
    return response.data;
  },

  getAllComments: async (filters = {}) => {
    const response = await api.get('/comments', { params: filters });
    return response.data;
  },

  getCommentById: async (commentId) => {
    const response = await api.get(`/comments/${commentId}`);
    return response.data;
  },

  updateComment: async (commentId, content) => {
    const response = await api.put(`/comments/${commentId}`, { content });
    return response.data;
  },

  deleteComment: async (commentId) => {
    const response = await api.delete(`/comments/${commentId}`);
    return response.data;
  },

  approveComment: async (commentId) => {
    const response = await api.post(`/comments/${commentId}/approve`);
    return response.data;
  },

  rejectComment: async (commentId, reason) => {
    const response = await api.post(`/comments/${commentId}/reject`, { reason });
    return response.data;
  },

  flagComment: async (commentId, reason) => {
    const response = await api.post(`/comments/${commentId}/flag`, { reason });
    return response.data;
  },

  getCommentStats: async () => {
    const response = await api.get('/comments/stats');
    return response.data;
  },

  bulkApprove: async (ids) => {
    const response = await api.post('/comments/bulk/approve', { ids });
    return response.data;
  },

  bulkReject: async (ids, reason) => {
    const response = await api.post('/comments/bulk/reject', { ids, reason });
    return response.data;
  },

  bulkDelete: async (ids) => {
    const response = await api.post('/comments/bulk/delete', { ids });
    return response.data;
  },
};

export default commentsService;
