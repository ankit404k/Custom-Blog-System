const { Comment, Analytics } = require('../models');

const getCommentsByPostId = async (req, res, next) => {
  try {
    const { postId } = req.params;

    const comments = await Comment.findByPostId(postId);

    res.json({
      success: true,
      data: comments,
    });
  } catch (error) {
    next(error);
  }
};

const createComment = async (req, res, next) => {
  try {
    const { post_id, content } = req.body;
    const user_id = req.user.id;

    const commentId = await Comment.create({
      post_id,
      user_id,
      content,
      status: 'pending',
    });

    await Analytics.updateCommentsCount(post_id);

    res.status(201).json({
      success: true,
      message: 'Comment created successfully',
      data: { commentId },
    });
  } catch (error) {
    next(error);
  }
};

const updateComment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { content, status } = req.body;

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

    const updateData = {};
    if (content) updateData.content = content;
    if (status && req.user.role === 'admin') updateData.status = status;

    await Comment.update(id, updateData);

    res.json({
      success: true,
      message: 'Comment updated successfully',
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
    await Analytics.updateCommentsCount(comment.post_id);

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

    await Comment.update(id, { status: 'approved' });

    res.json({
      success: true,
      message: 'Comment approved successfully',
    });
  } catch (error) {
    next(error);
  }
};

const rejectComment = async (req, res, next) => {
  try {
    const { id } = req.params;

    const comment = await Comment.findById(id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found',
      });
    }

    await Comment.update(id, { status: 'rejected' });

    res.json({
      success: true,
      message: 'Comment rejected successfully',
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
};
