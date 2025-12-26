import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const response = await axios.post(`${API_URL}/auth/refresh-token`, {
          refreshToken,
        });

        const { token, refreshToken: newRefreshToken } = response.data.data;

        localStorage.setItem('token', token);
        localStorage.setItem('refreshToken', newRefreshToken);

        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get('/auth/profile'),
  refreshToken: (refreshToken) => api.post('/auth/refresh-token', { refreshToken }),
};

export const postsAPI = {
  getAllPosts: (params) => api.get('/posts', { params }),
  getPostById: (id) => api.get(`/posts/${id}`),
  getPostBySlug: (slug) => api.get(`/posts/slug/${slug}`),
  getUserPosts: (params) => api.get('/posts/my-posts', { params }),
  createPost: (data) => api.post('/posts', data),
  updatePost: (id, data) => api.put(`/posts/${id}`, data),
  deletePost: (id) => api.delete(`/posts/${id}`),
};

export const commentsAPI = {
  getCommentsByPostId: (postId) => api.get(`/comments/post/${postId}`),
  getCommentById: (id) => api.get(`/comments/${id}`),
  createComment: (data) => api.post('/comments', data),
  updateComment: (id, data) => api.put(`/comments/${id}`, data),
  deleteComment: (id) => api.delete(`/comments/${id}`),
  approveComment: (id) => api.patch(`/comments/${id}/approve`),
  rejectComment: (id, data) => api.patch(`/comments/${id}/reject`, data),
  flagComment: (id, data) => api.post(`/comments/${id}/flag`, data),
  getAllComments: (params) => api.get('/comments', { params }),
  bulkModerate: (data) => api.post('/comments/bulk-moderate', data),
  getCommentStats: () => api.get('/comments/stats'),
};

export const usersAPI = {
  getAllUsers: () => api.get('/users'),
  getUserById: (id) => api.get(`/users/${id}`),
  updateUser: (id, data) => api.put(`/users/${id}`, data),
  updatePassword: (id, data) => api.put(`/users/${id}/password`, data),
  deleteUser: (id) => api.delete(`/users/${id}`),
};

export const analyticsAPI = {
  getPostAnalytics: (postId) => api.get(`/analytics/post/${postId}`),
  getAllAnalytics: () => api.get('/analytics/all'),
  getTopPosts: (params) => api.get('/analytics/top-posts', { params }),
  getDashboardStats: () => api.get('/analytics/dashboard-stats'),
  incrementPostLikes: (postId) => api.post(`/analytics/post/${postId}/like`),
};

export default api;
