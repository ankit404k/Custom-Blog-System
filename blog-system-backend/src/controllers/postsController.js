const { Post, Analytics } = require('../models');
const { generateSlug, ensureUniqueSlug } = require('../utils/slugify');

const getAllPosts = async (req, res, next) => {
  try {
    const { status, limit = 10, offset = 0, search, sortBy, sortOrder, page } = req.query;

    const filters = {
      status,
      limit,
      offset,
      search,
      sortBy,
      sortOrder,
    };

    // If user is authenticated and requesting drafts, include their drafts
    if (req.user && status === 'draft') {
      filters.user_id = req.user.id;
    }

    const posts = await Post.findAll(filters);
    const total = await Post.countPosts(filters);

    const currentPage = page ? parseInt(page) : Math.floor(offset / limit) + 1;
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: posts,
      pagination: {
        total,
        page: currentPage,
        limit: parseInt(limit),
        totalPages,
        hasMore: currentPage < totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getPostById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const post = await Post.getPostWithAuthor(id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    await Analytics.incrementViews(id);

    res.json({
      success: true,
      data: post,
    });
  } catch (error) {
    next(error);
  }
};

const getPostBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;

    const post = await Post.findBySlug(slug);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    await Analytics.incrementViews(post.id);

    const postWithAuthor = await Post.getPostWithAuthor(post.id);

    res.json({
      success: true,
      data: postWithAuthor,
    });
  } catch (error) {
    next(error);
  }
};

const createPost = async (req, res, next) => {
  try {
    const { title, content, status, featured_image } = req.body;
    const user_id = req.user.id;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Title and content are required',
      });
    }

    // Auto-generate slug from title
    const baseSlug = generateSlug(title);
    const slug = await ensureUniqueSlug(baseSlug);

    const postId = await Post.create({
      user_id,
      title,
      content,
      slug,
      status: status || 'draft',
      featured_image,
    });

    await Analytics.create(postId);

    const post = await Post.getPostWithAuthor(postId);

    res.status(201).json({
      success: true,
      message: 'Post created successfully',
      data: post,
    });
  } catch (error) {
    next(error);
  }
};

const updatePost = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, content, status, featured_image } = req.body;

    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    if (post.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    const updateData = {};

    if (title) {
      updateData.title = title;
      // Regenerate slug if title changed
      if (title !== post.title) {
        const baseSlug = generateSlug(title);
        const uniqueSlug = await ensureUniqueSlug(baseSlug, id);
        updateData.slug = uniqueSlug;
      }
    }

    if (content !== undefined) updateData.content = content;
    if (status !== undefined) updateData.status = status;
    if (featured_image !== undefined) updateData.featured_image = featured_image;

    await Post.update(id, updateData);

    const updatedPost = await Post.getPostWithAuthor(id);

    res.json({
      success: true,
      message: 'Post updated successfully',
      data: updatedPost,
    });
  } catch (error) {
    next(error);
  }
};

const deletePost = async (req, res, next) => {
  try {
    const { id } = req.params;

    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    if (post.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    await Post.softDelete(id);

    res.json({
      success: true,
      message: 'Post deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

const getUserPosts = async (req, res, next) => {
  try {
    const { limit = 10, offset = 0, status, includeArchived } = req.query;

    // Admins can request archived posts
    const showArchived = includeArchived === 'true' && req.user.role === 'admin';

    const options = {
      publishedOnly: showArchived ? false : true,
      page: Math.floor(offset / limit) + 1,
      limit: parseInt(limit),
      status,
    };

    const posts = await Post.getUserPosts(req.user.id, options);

    res.json({
      success: true,
      data: posts,
    });
  } catch (error) {
    next(error);
  }
};

const publishPost = async (req, res, next) => {
  try {
    const { id } = req.params;

    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    if (post.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    await Post.update(id, {
      status: 'published',
      published_at: new Date(),
    });

    const updatedPost = await Post.getPostWithAuthor(id);

    res.json({
      success: true,
      message: 'Post published successfully',
      data: updatedPost,
    });
  } catch (error) {
    next(error);
  }
};

const unpublishPost = async (req, res, next) => {
  try {
    const { id } = req.params;

    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    if (post.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    await Post.update(id, {
      status: 'draft',
    });

    const updatedPost = await Post.getPostWithAuthor(id);

    res.json({
      success: true,
      message: 'Post unpublished successfully',
      data: updatedPost,
    });
  } catch (error) {
    next(error);
  }
};

const getPostsByUserId = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { limit = 10, offset = 0, includeArchived } = req.query;

    const options = {
      publishedOnly: true,
      page: Math.floor(offset / limit) + 1,
      limit: parseInt(limit),
    };

    const posts = await Post.getUserPosts(userId, options);

    res.json({
      success: true,
      data: posts,
    });
  } catch (error) {
    next(error);
  }
};

const getDeletedPosts = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required',
      });
    }

    const { limit = 10, offset = 0 } = req.query;

    const posts = await Post.getDeletedPosts({
      page: Math.floor(offset / limit) + 1,
      limit: parseInt(limit),
    });

    res.json({
      success: true,
      data: posts,
    });
  } catch (error) {
    next(error);
  }
};

const restorePost = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required',
      });
    }

    const { id } = req.params;

    await Post.restorePost(id);

    const post = await Post.getPostWithAuthor(id);

    res.json({
      success: true,
      message: 'Post restored successfully',
      data: post,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllPosts,
  getPostById,
  getPostBySlug,
  createPost,
  updatePost,
  deletePost,
  getUserPosts,
  publishPost,
  unpublishPost,
  getPostsByUserId,
  getDeletedPosts,
  restorePost,
};
