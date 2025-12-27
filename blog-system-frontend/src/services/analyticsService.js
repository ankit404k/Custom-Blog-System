import api from './api';

/**
 * Analytics Service
 * Handles all analytics-related API calls
 */

// ==================== DASHBOARD ====================

/**
 * Get dashboard metrics
 * @param {string} timeRange - Time range filter (7d, 30d, 90d, all)
 * @returns {Promise} Dashboard metrics
 */
export const getDashboardMetrics = (timeRange = 'all') => {
  return api.get(`/analytics/dashboard?timeRange=${timeRange}`);
};

// ==================== POSTS ANALYTICS ====================

/**
 * Get all posts analytics
 * @param {Object} filters - Filters for posts analytics
 * @returns {Promise} Posts analytics data
 */
export const getPostsAnalytics = (filters = {}) => {
  const params = new URLSearchParams();
  
  if (filters.sortBy) params.append('sortBy', filters.sortBy);
  if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);
  if (filters.page) params.append('page', filters.page);
  if (filters.limit) params.append('limit', filters.limit);
  if (filters.search) params.append('search', filters.search);
  if (filters.startDate) params.append('startDate', filters.startDate);
  if (filters.endDate) params.append('endDate', filters.endDate);
  
  return api.get(`/analytics/posts?${params}`);
};

/**
 * Get single post analytics
 * @param {number} postId - Post ID
 * @returns {Promise} Single post analytics
 */
export const getSinglePostAnalytics = (postId) => {
  return api.get(`/analytics/posts/${postId}`);
};

/**
 * Track post view
 * @param {number} postId - Post ID
 * @returns {Promise} View tracking result
 */
export const trackView = (postId) => {
  return api.post('/analytics/track-view', { post_id: postId });
};

/**
 * Like a post
 * @param {number} postId - Post ID
 * @returns {Promise} Like result
 */
export const likePost = (postId) => {
  return api.post('/analytics/like', { post_id: postId });
};

/**
 * Unlike a post
 * @param {number} postId - Post ID
 * @returns {Promise} Unlike result
 */
export const unlikePost = (postId) => {
  return api.post('/analytics/unlike', { post_id: postId });
};

/**
 * Toggle like (like or unlike based on current state)
 * @param {number} postId - Post ID
 * @returns {Promise} Toggle like result
 */
export const toggleLike = (postId) => {
  return api.post(`/analytics/posts/${postId}/toggle-like`);
};

/**
 * Get top posts
 * @param {Object} options - Options for top posts
 * @returns {Promise} Top posts data
 */
export const getTopPosts = (options = {}) => {
  const params = new URLSearchParams();
  
  if (options.limit) params.append('limit', options.limit);
  if (options.metric) params.append('metric', options.metric);
  if (options.days) params.append('days', options.days);
  
  return api.get(`/analytics/top-posts?${params}`);
};

// ==================== USERS ANALYTICS ====================

/**
 * Get all users analytics
 * @param {Object} filters - Filters for users analytics
 * @returns {Promise} Users analytics data
 */
export const getUsersAnalytics = (filters = {}) => {
  const params = new URLSearchParams();
  
  if (filters.sortBy) params.append('sortBy', filters.sortBy);
  if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);
  if (filters.page) params.append('page', filters.page);
  if (filters.limit) params.append('limit', filters.limit);
  if (filters.search) params.append('search', filters.search);
  if (filters.activityLevel) params.append('activityLevel', filters.activityLevel);
  
  return api.get(`/analytics/users?${params}`);
};

/**
 * Get single user analytics
 * @param {number} userId - User ID
 * @returns {Promise} Single user analytics
 */
export const getSingleUserAnalytics = (userId) => {
  return api.get(`/analytics/users/${userId}`);
};

/**
 * Get top users
 * @param {Object} options - Options for top users
 * @returns {Promise} Top users data
 */
export const getTopUsers = (options = {}) => {
  const params = new URLSearchParams();
  
  if (options.limit) params.append('limit', options.limit);
  if (options.metric) params.append('metric', options.metric);
  if (options.days) params.append('days', options.days);
  
  return api.get(`/analytics/top-users?${params}`);
};

// ==================== COMMENTS ANALYTICS ====================

/**
 * Get comments analytics
 * @param {number} days - Number of days to analyze
 * @returns {Promise} Comments analytics data
 */
export const getCommentsAnalytics = (days = 30) => {
  return api.get(`/analytics/comments?days=${days}`);
};

// ==================== ENGAGEMENT ANALYTICS ====================

/**
 * Get engagement analytics
 * @param {number} days - Number of days to analyze
 * @returns {Promise} Engagement analytics data
 */
export const getEngagementAnalytics = (days = 30) => {
  return api.get(`/analytics/engagement?days=${days}`);
};

// ==================== LEGACY ENDPOINTS ====================

/**
 * Legacy: Get post analytics
 * @deprecated Use getSinglePostAnalytics instead
 */
export const getPostAnalytics = (postId) => {
  return api.get(`/analytics/post/${postId}`);
};

/**
 * Legacy: Get all analytics
 * @deprecated Use getPostsAnalytics instead
 */
export const getAllAnalytics = () => {
  return api.get('/analytics/all');
};

/**
 * Legacy: Increment post likes
 * @deprecated Use likePost or toggleLike instead
 */
export const incrementPostLikes = (postId) => {
  return api.post(`/analytics/post/${postId}/like`);
};

/**
 * Legacy: Get dashboard stats
 * @deprecated Use getDashboardMetrics instead
 */
export const getDashboardStats = () => {
  return api.get('/analytics/dashboard-stats');
};

export default {
  getDashboardMetrics,
  getPostsAnalytics,
  getSinglePostAnalytics,
  trackView,
  likePost,
  unlikePost,
  toggleLike,
  getTopPosts,
  getUsersAnalytics,
  getSingleUserAnalytics,
  getTopUsers,
  getCommentsAnalytics,
  getEngagementAnalytics
};
