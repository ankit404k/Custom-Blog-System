import api from './api';

const postsService = {
  /**
   * Get all posts with filters and pagination
   */
  getPosts: async (filters = {}) => {
    const {
      page = 1,
      limit = 10,
      status,
      search,
      sortBy,
      sortOrder,
    } = filters;

    const params = new URLSearchParams();
    if (page) params.append('page', page);
    if (limit) params.append('limit', limit);
    if (status) params.append('status', status);
    if (search) params.append('search', search);
    if (sortBy) params.append('sortBy', sortBy);
    if (sortOrder) params.append('sortOrder', sortOrder);

    const response = await api.get(`/posts?${params.toString()}`);
    return response.data;
  },

  /**
   * Get post by ID
   */
  getPostById: async (postId) => {
    const response = await api.get(`/posts/${postId}`);
    return response.data;
  },

  /**
   * Get post by slug
   */
  getPostBySlug: async (slug) => {
    const response = await api.get(`/posts/slug/${slug}`);
    return response.data;
  },

  /**
   * Create a new post
   */
  createPost: async (postData) => {
    const response = await api.post('/posts', postData);
    return response.data;
  },

  /**
   * Update an existing post
   */
  updatePost: async (postId, postData) => {
    const response = await api.put(`/posts/${postId}`, postData);
    return response.data;
  },

  /**
   * Delete a post (soft delete)
   */
  deletePost: async (postId) => {
    const response = await api.delete(`/posts/${postId}`);
    return response.data;
  },

  /**
   * Publish a draft
   */
  publishPost: async (postId) => {
    const response = await api.post(`/posts/${postId}/publish`);
    return response.data;
  },

  /**
   * Unpublish a post
   */
  unpublishPost: async (postId) => {
    const response = await api.post(`/posts/${postId}/unpublish`);
    return response.data;
  },

  /**
   * Get current user's posts
   */
  getMyPosts: async (filters = {}) => {
    const {
      page = 1,
      limit = 10,
      status,
      includeArchived,
    } = filters;

    const params = new URLSearchParams();
    if (page) params.append('page', page);
    if (limit) params.append('limit', limit);
    if (status) params.append('status', status);
    if (includeArchived) params.append('includeArchived', includeArchived);

    const response = await api.get(`/posts/my-posts?${params.toString()}`);
    return response.data;
  },

  /**
   * Get posts by user ID
   */
  getUserPosts: async (userId, filters = {}) => {
    const {
      page = 1,
      limit = 10,
      includeArchived,
    } = filters;

    const params = new URLSearchParams();
    if (page) params.append('page', page);
    if (limit) params.append('limit', limit);
    if (includeArchived) params.append('includeArchived', includeArchived);

    const response = await api.get(`/posts/user/${userId}?${params.toString()}`);
    return response.data;
  },

  /**
   * Get deleted posts (admin only)
   */
  getDeletedPosts: async (filters = {}) => {
    const {
      page = 1,
      limit = 10,
    } = filters;

    const params = new URLSearchParams();
    if (page) params.append('page', page);
    if (limit) params.append('limit', limit);

    const response = await api.get(`/posts/deleted?${params.toString()}`);
    return response.data;
  },

  /**
   * Restore a deleted post (admin only)
   */
  restorePost: async (postId) => {
    const response = await api.post(`/posts/${postId}/restore`);
    return response.data;
  },

  /**
   * Upload featured image
   */
  uploadImage: async (file) => {
    const formData = new FormData();
    formData.append('featured_image', file);

    const response = await api.post('/posts/upload-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Search posts
   */
  searchPosts: async (query, filters = {}) => {
    const {
      page = 1,
      limit = 10,
    } = filters;

    const params = new URLSearchParams();
    params.append('search', query);
    if (page) params.append('page', page);
    if (limit) params.append('limit', limit);

    const response = await api.get(`/posts?${params.toString()}`);
    return response.data;
  },
};

export default postsService;
