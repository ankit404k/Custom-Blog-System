import React, { useState, useEffect } from 'react';
import CommentCard from './CommentCard';
import commentsService from '../../services/commentsService';

const CommentList = ({ postId, showModeration = false, onCommentUpdate, onCommentDelete }) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  const [sort, setSort] = useState('newest');

  useEffect(() => {
    fetchComments();
  }, [postId, pagination.page, sort]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await commentsService.getPostComments(postId, {
        page: pagination.page,
        limit: pagination.limit,
        sort,
      });

      if (showModeration) {
        // For admin moderation, fetch all comments including pending
        const allResponse = await commentsService.getAllComments({
          page: pagination.page,
          limit: pagination.limit,
          post_id: postId,
          sortBy: 'created_at',
          sortOrder: sort === 'newest' ? 'DESC' : 'ASC',
        });
        setComments(allResponse.data);
        setPagination(prev => ({
          ...prev,
          ...allResponse.pagination,
        }));
      } else {
        setComments(response.data);
        setPagination(prev => ({
          ...prev,
          ...response.pagination,
        }));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleSortChange = (newSort) => {
    setSort(newSort);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleCommentDelete = (commentId) => {
    setComments(prev => prev.filter(c => c.id !== commentId));
    if (onCommentDelete) {
      onCommentDelete(commentId);
    }
  };

  const handleCommentUpdate = (updatedComment) => {
    setComments(prev => prev.map(c => c.id === updatedComment.id ? updatedComment : c));
    if (onCommentUpdate) {
      onCommentUpdate(updatedComment);
    }
  };

  if (loading && comments.length === 0) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-gray-100 rounded-lg p-4 h-24"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Comments ({pagination.total})
        </h3>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Sort by:</span>
          <select
            value={sort}
            onChange={(e) => handleSortChange(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>
      </div>

      {comments.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <p className="mt-4 text-gray-600">No comments yet. Be the first to share your thoughts!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map(comment => (
            <CommentCard
              key={comment.id}
              comment={comment}
              showModeration={showModeration}
              onDelete={handleCommentDelete}
              onUpdate={handleCommentUpdate}
            />
          ))}
        </div>
      )}

      {pagination.pages > 1 && (
        <div className="flex justify-center items-center space-x-2 mt-8">
          <button
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <span className="text-gray-600">
            Page {pagination.page} of {pagination.pages}
          </span>
          <button
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page === pagination.pages}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default CommentList;
