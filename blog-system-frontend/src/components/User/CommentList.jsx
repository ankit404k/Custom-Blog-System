import React, { useState, useEffect } from 'react';
import CommentCard from './CommentCard';
import commentsService from '../../services/commentsService';

const CommentList = ({ postId }) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [sortOrder, setSortOrder] = useState('DESC');

  const fetchComments = async (currentPage = 1, sort = 'DESC') => {
    setLoading(true);
    setError('');

    try {
      const response = await commentsService.getPostComments(postId, currentPage, 10, sort);
      setComments(response.data.comments);
      setPagination(response.data.pagination);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (postId) {
      fetchComments(page, sortOrder);
    }
  }, [postId, page, sortOrder]);

  const handleCommentDeleted = (commentId) => {
    setComments(comments.filter(c => c.id !== commentId));
  };

  const handleCommentFlagged = (commentId) => {
    console.log('Comment flagged:', commentId);
  };

  const handleSortChange = (newSort) => {
    setSortOrder(newSort);
    setPage(1);
  };

  if (loading && comments.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="text-gray-600 mt-2">Loading comments...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold">
          Comments {pagination && `(${pagination.total})`}
        </h3>
        
        <div className="flex items-center space-x-2">
          <label className="text-sm text-gray-600">Sort by:</label>
          <select
            value={sortOrder}
            onChange={(e) => handleSortChange(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded text-sm"
          >
            <option value="DESC">Newest First</option>
            <option value="ASC">Oldest First</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {comments.length === 0 && !loading && (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-gray-600">No comments yet. Be the first to comment!</p>
        </div>
      )}

      <div className="space-y-4">
        {comments.map((comment) => (
          <CommentCard
            key={comment.id}
            comment={comment}
            onCommentDeleted={handleCommentDeleted}
            onCommentFlagged={handleCommentFlagged}
          />
        ))}
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="mt-6 flex justify-center items-center space-x-2">
          <button
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
            className="px-4 py-2 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Previous
          </button>
          
          <span className="text-gray-700">
            Page {page} of {pagination.totalPages}
          </span>
          
          <button
            onClick={() => setPage(page + 1)}
            disabled={page === pagination.totalPages}
            className="px-4 py-2 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default CommentList;
