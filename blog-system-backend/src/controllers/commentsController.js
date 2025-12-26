const { Comment, Analytics, Post } = require('../models');
const { validateComment, sanitizeComment, isDuplicateComment } = require('../utils/comments');

const RATE_LIMIT_COMMENTS = 5;
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour

// In-memory rate limiting (use Redis in production)
const rateLimitMap = new Map();

/**
 * Check rate limit for comments
 */
const checkRateLimit = (userId) => {
  const now = Date.now();
  const userHistory = rateLimitMap.get(userId) || [];

  // Filter out old entries
  const recentComments = userHistory.filter(timestamp => now - timestamp < RATE_LIMIT_WINDOW);

  if (recentComments.length >= RATE_LIMIT_COMMENTS) {
    return { allowed: false, remaining: 0, resetTime: Math.min(...recentComments) + RATE_LIMIT_WINDOW - now };
  }

  return { allowed: true, remaining: RATE_LIMIT_COMMENTS - recentComments.length };
};

/**
 * Record a comment submission
 */
const recordComment = (userId) => {
  const now = Date.now();
  const userHistory = rateLimitMap.get(userId) || [];
  userHistory.push(now);
  rateLimitMap.set(userId, userHistory);
};

const getCommentsByPostId = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const { page = 1, limit = 10, sort = 'newest' } = req.query;

    const comments = await Comment.findByPostIdForPublic(postId, {
      page: parseInt(page),
      limit: parseInt(limit),
      sort,
    });

    const total = await Comment.countComments({ post_id: postId, status: 'approved' });

    res.json({
      success: true,
      data: comments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

const createComment = async (req, res, next) => {
  try {
    const { post_id, content } = req.body;
    const user_id = req.user.id;

    // Check rate limit
    const rateLimit = checkRateLimit(user_id);
    if (!rateLimit.allowed) {
      return res.status(429).json({
        success: false,
        message: 'Rate limit exceeded. You can only submit 5 comments per hour.',
        retryAfter: Math.ceil(rateLimit.resetTime / 1000),
      });
    }

    // Validate post exists
    const post = await Post.findById(post_id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    // Sanitize content
    const sanitizedContent = sanitizeComment(content);

    // Validate comment
    const validation = validateComment(sanitizedContent);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.error,
      });
    }

    // Check for duplicates
    const isDuplicate = await isDuplicateComment({ Comment }, user_id, sanitizedContent, post_id);
    if (isDuplicate) {
      return res.status(400).json({
        success: false,
        message: 'You have already posted a similar comment recently.',
      });
    }

    const commentId = await Comment.create({
      post_id,
      user_id,
      content: sanitizedContent,
      status: 'pending',
    });

    // Record for rate limiting
    recordComment(user_id);

    // Get the created comment with user info
    const comment = await Comment.findByIdWithUser(commentId);

    res.status(201).json({
      success: true,
      message: 'Comment submitted successfully and is pending moderation.',
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
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';

    const comment = await Comment.findById(id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found',
      });
    }

    // Check ownership
    if (comment.user_id !== userId && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only edit your own comments.',
      });
    }

    // Can only edit pending comments (unless admin)
    if (comment.status !== 'pending' && !isAdmin) {
      return res.status(400).json({
        success: false,
        message: 'Cannot edit comments that have already been approved or rejected.',
      });
    }

    // Validate content
    const sanitizedContent = sanitizeComment(content);
    const validation = validateComment(sanitizedContent);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.error,
      });
    }

    await Comment.update(id, { content: sanitizedContent });

    const updatedComment = await Comment.findByIdWithUser(id);

    res.json({
      success: true,
      message: 'Comment updated successfully.',
      data: updatedComment,
    });
  } catch (error) {
    next(error);
  }
};

const deleteComment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';

    const comment = await Comment.findById(id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found',
      });
    }

    // Check ownership
    if (comment.user_id !== userId && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only delete your own comments.',
      });
    }

    await Comment.softDelete(id);
    await Analytics.updateCommentsCount(comment.post_id);

    res.json({
      success: true,
      message: 'Comment deleted successfully.',
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

    if (comment.status === 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Comment is already approved.',
      });
    }

    await Comment.approve(id);
    await Analytics.updateCommentsCount(comment.post_id);

    const updatedComment = await Comment.findByIdWithUser(id);

    res.json({
      success: true,
      message: 'Comment approved successfully.',
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

    if (comment.status === 'rejected') {
      return res.status(400).json({
        success: false,
        message: 'Comment is already rejected.',
      });
    }

    await Comment.reject(id, reason || null);

    const updatedComment = await Comment.findByIdWithUser(id);

    res.json({
      success: true,
      message: 'Comment rejected.',
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
    const userId = req.user.id;

    const comment = await Comment.findById(id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found',
      });
    }

    // Can't flag own comment
    if (comment.user_id === userId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot flag your own comment.',
      });
    }

    await Comment.flag(id, reason);

    res.json({
      success: true,
      message: 'Comment flagged for review.',
    });
  } catch (error) {
    next(error);
  }
};

// Admin-only endpoints

const getAllComments = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      post_id,
      user_id,
      search,
      sortBy = 'created_at',
      sortOrder = 'DESC',
    } = req.query;

    const comments = await Comment.getAllComments({
      page: parseInt(page),
      limit: parseInt(limit),
      status,
      post_id: post_id ? parseInt(post_id) : undefined,
      user_id: user_id ? parseInt(user_id) : undefined,
      search,
      sortBy,
      sortOrder,
    });

    const total = await Comment.countComments({
      status,
      post_id: post_id ? parseInt(post_id) : undefined,
      user_id: user_id ? parseInt(user_id) : undefined,
    });

    res.json({
      success: true,
      data: comments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

const getCommentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const isAdmin = req.user?.role === 'admin';

    const comment = await Comment.findByIdWithUser(id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found',
      });
    }

    // Check if user can view this comment
    // - Admins can view all
    // - Users can view their own comments (even if pending)
    // - Public can only view approved comments
    if (!isAdmin && userId && comment.user_id !== userId && comment.status !== 'approved') {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    if (!isAdmin && !userId && comment.status !== 'approved') {
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

const bulkModerateComments = async (req, res, next) => {
  try {
    const { action, commentIds } = req.body;

    if (!Array.isArray(commentIds) || commentIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'commentIds must be a non-empty array',
      });
    }

    const results = {
      success: [],
      failed: [],
    };

    for (const id of commentIds) {
      try {
        const comment = await Comment.findById(id);
        if (!comment) {
          results.failed.push({ id, reason: 'Comment not found' });
          continue;
        }

        switch (action) {
          case 'approve':
            await Comment.approve(id);
            await Analytics.updateCommentsCount(comment.post_id);
            results.success.push(id);
            break;
          case 'reject':
            await Comment.reject(id, null);
            results.success.push(id);
            break;
          case 'delete':
            await Comment.softDelete(id);
            await Analytics.updateCommentsCount(comment.post_id);
            results.success.push(id);
            break;
          default:
            results.failed.push({ id, reason: 'Invalid action' });
        }
      } catch (err) {
        results.failed.push({ id, reason: err.message });
      }
    }

    res.json({
      success: true,
      message: `Processed ${results.success.length} comments successfully.`,
      data: results,
    });
  } catch (error) {
    next(error);
  }
};

const getCommentStats = async (req, res, next) => {
  try {
    const statusCounts = await Comment.countByStatus();
    const pendingCount = await Comment.countPending();
    const spamCount = await Comment.countSpamFlags();

    const stats = {
      total: 0,
      approved: 0,
      pending: 0,
      rejected: 0,
      pendingCount,
      spamCount,
    };

    statusCounts.forEach(({ status, count }) => {
      stats[status] = count;
      stats.total += count;
    });

    const approvalRate = stats.total > 0
      ? ((stats.approved / (stats.approved + stats.rejected)) * 100).toFixed(1)
      : 0;

    res.json({
      success: true,
      data: {
        ...stats,
        approvalRate: `${approvalRate}%`,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCommentsByPostId,
  createComment,
  updateComment,
  deleteComment,
  approveComment,
  rejectComment,
  flagComment,
  getAllComments,
  getCommentById,
  bulkModerateComments,
  getCommentStats,
};
