const { Comment, Analytics, Post } = require('../models');
const { validateComment, sanitizeContent, detectSpam } = require('../utils/commentValidation');

const createComment = async (req, res, next) => {
  try {
    const { post_id, content } = req.body;
    const user_id = req.user.id;

    if (!post_id || !content) {
      return res.status(400).json({
        success: false,
        message: 'Post ID and content are required',
      });
    }

    const post = await Post.findById(post_id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    const validation = validateComment(content);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.message,
      });
    }

    const sanitizedContent = sanitizeContent(validation.content);

    const rateLimit = await Comment.checkRateLimit(user_id);
    if (!rateLimit.allowed) {
      return res.status(429).json({
        success: false,
        message: 'Rate limit exceeded. You can post maximum 5 comments per hour.',
      });
    }

    const isDuplicate = await Comment.checkDuplicate(user_id, sanitizedContent, post_id);
    if (isDuplicate) {
      return res.status(400).json({
        success: false,
        message: 'You have already posted this comment recently',
      });
    }

    const spamCheck = detectSpam(sanitizedContent);
    const status = spamCheck.isSpam ? 'rejected' : 'pending';

    const commentId = await Comment.create({
      post_id,
      user_id,
      content: sanitizedContent,
      status,
    });

    const comment = await Comment.findById(commentId);

    res.status(201).json({
      success: true,
      message: spamCheck.isSpam 
        ? 'Comment rejected due to spam detection' 
        : 'Comment submitted for moderation',
      data: comment,
    });
  } catch (error) {
    next(error);
  }
};

const getPostComments = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const { page = 1, limit = 10, sort = 'DESC' } = req.query;

    const status = req.user && req.user.role === 'admin' ? 'all' : 'approved';

    const comments = await Comment.findByPostId(
      postId, 
      status, 
      { 
        page: parseInt(page), 
        limit: parseInt(limit), 
        sortBy: 'created_at', 
        sortOrder: sort 
      }
    );

    const total = await Comment.countComments({ post_id: postId, status: status === 'all' ? undefined : status });

    res.json({
      success: true,
      data: {
        comments,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

const getAllComments = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, post_id, user_id, search } = req.query;

    const filters = {
      page: parseInt(page),
      limit: parseInt(limit),
      status,
      post_id,
      user_id,
      search,
    };

    const comments = await Comment.findAll(filters);
    const total = await Comment.countComments({ status, post_id, user_id });

    res.json({
      success: true,
      data: {
        comments,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

const getCommentById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const comment = await Comment.findById(id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found',
      });
    }

    if (comment.status !== 'approved' && 
        (!req.user || (comment.user_id !== req.user.id && req.user.role !== 'admin'))) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    res.json({
      success: true,
      data: comment,
    });
  } catch (error) {
    next(error);
  }
};

const updateComment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    const comment = await Comment.findById(id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found',
      });
    }

    if (comment.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only edit your own comments',
      });
    }

    if (comment.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'You can only edit pending comments',
      });
    }

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Content is required',
      });
    }

    const validation = validateComment(content);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.message,
      });
    }

    const sanitizedContent = sanitizeContent(validation.content);

    await Comment.update(id, { content: sanitizedContent });

    const updatedComment = await Comment.findById(id);

    res.json({
      success: true,
      message: 'Comment updated successfully',
      data: updatedComment,
    });
  } catch (error) {
    next(error);
  }
};

const deleteComment = async (req, res, next) => {
  try {
    const { id } = req.params;

    const comment = await Comment.findById(id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found',
      });
    }

    if (comment.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    await Comment.softDelete(id);
    
    if (comment.status === 'approved') {
      await Analytics.updateCommentsCount(comment.post_id);
    }

    res.json({
      success: true,
      message: 'Comment deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

const approveComment = async (req, res, next) => {
  try {
    const { id } = req.params;

    const comment = await Comment.findById(id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found',
      });
    }

    await Comment.approve(id);
    await Analytics.updateCommentsCount(comment.post_id);

    const updatedComment = await Comment.findById(id);

    res.json({
      success: true,
      message: 'Comment approved successfully',
      data: updatedComment,
    });
  } catch (error) {
    next(error);
  }
};

const rejectComment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const comment = await Comment.findById(id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found',
      });
    }

    await Comment.reject(id, reason);
    
    if (comment.status === 'approved') {
      await Analytics.updateCommentsCount(comment.post_id);
    }

    const updatedComment = await Comment.findById(id);

    res.json({
      success: true,
      message: 'Comment rejected successfully',
      data: updatedComment,
    });
  } catch (error) {
    next(error);
  }
};

const flagComment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const user_id = req.user.id;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Reason is required',
      });
    }

    const comment = await Comment.findById(id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found',
      });
    }

    try {
      await Comment.flag(id, user_id, reason);

      res.json({
        success: true,
        message: 'Comment flagged successfully',
      });
    } catch (error) {
      if (error.message === 'You have already flagged this comment') {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }
      throw error;
    }
  } catch (error) {
    next(error);
  }
};

const getCommentStats = async (req, res, next) => {
  try {
    const stats = await Comment.getStats();

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

const bulkApprove = async (req, res, next) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Comment IDs array is required',
      });
    }

    const affectedRows = await Comment.bulkApprove(ids);

    for (const id of ids) {
      const comment = await Comment.findById(id);
      if (comment) {
        await Analytics.updateCommentsCount(comment.post_id);
      }
    }

    res.json({
      success: true,
      message: `${affectedRows} comment(s) approved successfully`,
      data: { affectedRows },
    });
  } catch (error) {
    next(error);
  }
};

const bulkReject = async (req, res, next) => {
  try {
    const { ids, reason } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Comment IDs array is required',
      });
    }

    const affectedRows = await Comment.bulkReject(ids, reason);

    for (const id of ids) {
      const comment = await Comment.findById(id);
      if (comment) {
        await Analytics.updateCommentsCount(comment.post_id);
      }
    }

    res.json({
      success: true,
      message: `${affectedRows} comment(s) rejected successfully`,
      data: { affectedRows },
    });
  } catch (error) {
    next(error);
  }
};

const bulkDelete = async (req, res, next) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Comment IDs array is required',
      });
    }

    const affectedRows = await Comment.bulkDelete(ids);

    for (const id of ids) {
      const comment = await Comment.findById(id);
      if (comment && comment.status === 'approved') {
        await Analytics.updateCommentsCount(comment.post_id);
      }
    }

    res.json({
      success: true,
      message: `${affectedRows} comment(s) deleted successfully`,
      data: { affectedRows },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createComment,
  getPostComments,
  getAllComments,
  getCommentById,
  updateComment,
  deleteComment,
  approveComment,
  rejectComment,
  flagComment,
  getCommentStats,
  bulkApprove,
  bulkReject,
  bulkDelete,
};
