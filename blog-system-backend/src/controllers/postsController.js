const { Post, Analytics } = require('../models');

const getAllPosts = async (req, res, next) => {
  try {
    const { status, limit, offset } = req.query;
    const filters = { status, limit, offset };

    const posts = await Post.findAll(filters);

    res.json({
      success: true,
      data: posts,
    });
  } catch (error) {
    next(error);
  }
};

const getPostById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    await Analytics.incrementViews(id);

    const analytics = await Analytics.findByPostId(id);

    res.json({
      success: true,
      data: {
        ...post,
        analytics,
      },
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

    const analytics = await Analytics.findByPostId(post.id);

    res.json({
      success: true,
      data: {
        ...post,
        analytics,
      },
    });
  } catch (error) {
    next(error);
  }
};

const createPost = async (req, res, next) => {
  try {
    const { title, content, slug, status, featured_image } = req.body;
    const user_id = req.user.id;

    const existingPost = await Post.findBySlug(slug);
    if (existingPost) {
      return res.status(400).json({
        success: false,
        message: 'Slug already exists',
      });
    }

    const postId = await Post.create({
      user_id,
      title,
      content,
      slug,
      status: status || 'draft',
      featured_image,
    });

    await Analytics.create(postId);

    res.status(201).json({
      success: true,
      message: 'Post created successfully',
      data: { postId },
    });
  } catch (error) {
    next(error);
  }
};

const updatePost = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, content, slug, status, featured_image } = req.body;

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

    if (slug && slug !== post.slug) {
      const existingPost = await Post.findBySlug(slug);
      if (existingPost) {
        return res.status(400).json({
          success: false,
          message: 'Slug already exists',
        });
      }
    }

    const updateData = {};
    if (title) updateData.title = title;
    if (content) updateData.content = content;
    if (slug) updateData.slug = slug;
    if (status) updateData.status = status;
    if (featured_image) updateData.featured_image = featured_image;

    await Post.update(id, updateData);

    res.json({
      success: true,
      message: 'Post updated successfully',
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
    const { limit, offset } = req.query;
    const filters = {
      user_id: req.user.id,
      limit,
      offset,
    };

    const posts = await Post.findAll(filters);

    res.json({
      success: true,
      data: posts,
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
};
