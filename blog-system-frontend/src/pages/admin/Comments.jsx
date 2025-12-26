import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import CommentStats from '../../components/Admin/CommentStats';
import CommentModerationCard from '../../components/Admin/CommentModerationCard';
import commentsService from '../../services/commentsService';

const Comments = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [comments, setComments] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedComments, setSelectedComments] = useState([]);
  
  const statusFilter = searchParams.get('status') || 'all';
  const page = parseInt(searchParams.get('page') || '1');
  const searchQuery = searchParams.get('search') || '';

  const [pagination, setPagination] = useState(null);
  const [localSearch, setLocalSearch] = useState(searchQuery);

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchComments();
  }, [statusFilter, page, searchQuery]);

  const fetchStats = async () => {
    try {
      const response = await commentsService.getCommentStats();
      setStats(response.data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const fetchComments = async () => {
    setLoading(true);
    setError('');

    try {
      const filters = {
        page,
        limit: 20,
        status: statusFilter === 'all' ? undefined : statusFilter,
        search: searchQuery || undefined,
      };

      const response = await commentsService.getAllComments(filters);
      setComments(response.data.comments);
      setPagination(response.data.pagination);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (status) => {
    setSearchParams({ status, page: '1' });
    setSelectedComments([]);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchParams({ status: statusFilter, search: localSearch, page: '1' });
  };

  const handlePageChange = (newPage) => {
    const params = { status: statusFilter, page: newPage.toString() };
    if (searchQuery) params.search = searchQuery;
    setSearchParams(params);
    setSelectedComments([]);
  };

  const handleApprove = async (commentId) => {
    try {
      await commentsService.approveComment(commentId);
      setSuccess('Comment approved successfully');
      fetchComments();
      fetchStats();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to approve comment');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleReject = async (commentId, reason) => {
    try {
      await commentsService.rejectComment(commentId, reason);
      setSuccess('Comment rejected successfully');
      fetchComments();
      fetchStats();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject comment');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleDelete = async (commentId) => {
    try {
      await commentsService.deleteComment(commentId);
      setSuccess('Comment deleted successfully');
      fetchComments();
      fetchStats();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete comment');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleSelectComment = (commentId) => {
    setSelectedComments(prev => 
      prev.includes(commentId)
        ? prev.filter(id => id !== commentId)
        : [...prev, commentId]
    );
  };

  const handleSelectAll = () => {
    if (selectedComments.length === comments.length) {
      setSelectedComments([]);
    } else {
      setSelectedComments(comments.map(c => c.id));
    }
  };

  const handleBulkApprove = async () => {
    if (selectedComments.length === 0) return;

    try {
      await commentsService.bulkApprove(selectedComments);
      setSuccess(`${selectedComments.length} comment(s) approved successfully`);
      setSelectedComments([]);
      fetchComments();
      fetchStats();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to approve comments');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleBulkReject = async () => {
    if (selectedComments.length === 0) return;

    const reason = window.prompt('Enter rejection reason (optional):');
    if (reason === null) return;

    try {
      await commentsService.bulkReject(selectedComments, reason);
      setSuccess(`${selectedComments.length} comment(s) rejected successfully`);
      setSelectedComments([]);
      fetchComments();
      fetchStats();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject comments');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedComments.length === 0) return;

    if (!window.confirm(`Are you sure you want to delete ${selectedComments.length} comment(s)?`)) {
      return;
    }

    try {
      await commentsService.bulkDelete(selectedComments);
      setSuccess(`${selectedComments.length} comment(s) deleted successfully`);
      setSelectedComments([]);
      fetchComments();
      fetchStats();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete comments');
      setTimeout(() => setError(''), 3000);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Comment Moderation</h1>

      <CommentStats stats={stats} />

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}

      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleStatusChange('all')}
                className={`px-4 py-2 rounded ${
                  statusFilter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                All
              </button>
              <button
                onClick={() => handleStatusChange('pending')}
                className={`px-4 py-2 rounded ${
                  statusFilter === 'pending'
                    ? 'bg-yellow-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Pending
              </button>
              <button
                onClick={() => handleStatusChange('approved')}
                className={`px-4 py-2 rounded ${
                  statusFilter === 'approved'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Approved
              </button>
              <button
                onClick={() => handleStatusChange('rejected')}
                className={`px-4 py-2 rounded ${
                  statusFilter === 'rejected'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Rejected
              </button>
            </div>

            <form onSubmit={handleSearch} className="flex space-x-2">
              <input
                type="text"
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                placeholder="Search comments..."
                className="px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Search
              </button>
            </form>
          </div>

          {selectedComments.length > 0 && (
            <div className="mt-4 p-3 bg-blue-50 rounded flex items-center justify-between">
              <span className="text-sm text-blue-800">
                {selectedComments.length} comment(s) selected
              </span>
              <div className="flex space-x-2">
                <button
                  onClick={handleBulkApprove}
                  className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Approve Selected
                </button>
                <button
                  onClick={handleBulkReject}
                  className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Reject Selected
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  Delete Selected
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="p-4">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="text-gray-600 mt-2">Loading comments...</p>
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">No comments found</p>
            </div>
          ) : (
            <>
              <div className="mb-4">
                <label className="flex items-center space-x-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={selectedComments.length === comments.length}
                    onChange={handleSelectAll}
                    className="rounded"
                  />
                  <span>Select all</span>
                </label>
              </div>

              <div className="space-y-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      checked={selectedComments.includes(comment.id)}
                      onChange={() => handleSelectComment(comment.id)}
                      className="mt-6 rounded"
                    />
                    <div className="flex-1">
                      <CommentModerationCard
                        comment={comment}
                        onApprove={handleApprove}
                        onReject={handleReject}
                        onDelete={handleDelete}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {pagination && pagination.totalPages > 1 && (
                <div className="mt-6 flex justify-center items-center space-x-2">
                  <button
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page === 1}
                    className="px-4 py-2 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  
                  <span className="text-gray-700">
                    Page {page} of {pagination.totalPages}
                  </span>
                  
                  <button
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page === pagination.totalPages}
                    className="px-4 py-2 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Comments;
