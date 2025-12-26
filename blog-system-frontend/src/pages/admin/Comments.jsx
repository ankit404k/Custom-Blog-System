import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import CommentModerationCard from '../../components/Admin/CommentModerationCard';
import CommentStats from '../../components/Admin/CommentStats';
import commentsService from '../../services/commentsService';

const Comments = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [comments, setComments] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedComments, setSelectedComments] = useState([]);
  const [bulkAction, setBulkAction] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });

  const statusFilter = searchParams.get('status') || 'all';
  const searchQuery = searchParams.get('search') || '';

  useEffect(() => {
    fetchStats();
    fetchComments();
  }, [statusFilter, searchParams.toString(), pagination.page]);

  const fetchStats = async () => {
    try {
      const response = await commentsService.getCommentStats();
      setStats(response.data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const fetchComments = async () => {
    try {
      setLoading(true);
      setError('');

      const filters = {
        page: pagination.page,
        limit: pagination.limit,
        sortBy: 'created_at',
        sortOrder: 'DESC',
      };

      if (statusFilter !== 'all') {
        filters.status = statusFilter;
      }

      if (searchQuery) {
        filters.search = searchQuery;
      }

      const response = await commentsService.getAllComments(filters);
      setComments(response.data);
      setPagination(prev => ({
        ...prev,
        ...response.pagination,
      }));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (commentId) => {
    try {
      await commentsService.approveComment(commentId);
      fetchComments();
      fetchStats();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to approve comment');
    }
  };

  const handleReject = async (commentId, reason) => {
    try {
      await commentsService.rejectComment(commentId, reason);
      fetchComments();
      fetchStats();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reject comment');
    }
  };

  const handleDelete = async (commentId) => {
    try {
      await commentsService.deleteComment(commentId);
      fetchComments();
      fetchStats();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete comment');
    }
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selectedComments.length === 0) return;

    if (!confirm(`Are you sure you want to ${bulkAction} ${selectedComments.length} comment(s)?`)) {
      return;
    }

    try {
      await commentsService.bulkModerate(bulkAction, selectedComments);
      setSelectedComments([]);
      setBulkAction('');
      fetchComments();
      fetchStats();
    } catch (err) {
      alert(err.response?.data?.message || 'Bulk action failed');
    }
  };

  const handleSelectAll = () => {
    if (selectedComments.length === comments.length) {
      setSelectedComments([]);
    } else {
      setSelectedComments(comments.map(c => c.id));
    }
  };

  const handleSelectComment = (commentId) => {
    setSelectedComments(prev =>
      prev.includes(commentId)
        ? prev.filter(id => id !== commentId)
        : [...prev, commentId]
    );
  };

  const handleStatusChange = (status) => {
    setSearchParams(prev => {
      if (status === 'all') {
        prev.delete('status');
      } else {
        prev.set('status', status);
      }
      return prev;
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const query = formData.get('search');
    setSearchParams(prev => {
      if (query) {
        prev.set('search', query);
      } else {
        prev.delete('search');
      }
      return prev;
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleViewPending = () => {
    handleStatusChange('pending');
  };

  const statusTabs = [
    { id: 'all', label: 'All', count: stats?.total },
    { id: 'pending', label: 'Pending', count: stats?.pending },
    { id: 'approved', label: 'Approved', count: stats?.approved },
    { id: 'rejected', label: 'Rejected', count: stats?.rejected },
  ];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Comments Moderation</h1>
      </div>

      <CommentStats stats={stats} onViewPending={handleViewPending} />

      <div className="bg-white rounded-lg border border-gray-200 mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {statusTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => handleStatusChange(tab.id)}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  statusFilter === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
                {tab.count !== undefined && (
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                    tab.id === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    tab.id === 'approved' ? 'bg-green-100 text-green-800' :
                    tab.id === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-4 border-b border-gray-200">
          <form onSubmit={handleSearch} className="flex items-center space-x-4">
            <div className="flex-1">
              <input
                type="text"
                name="search"
                defaultValue={searchQuery}
                placeholder="Search comments by content, author name, or email..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Search
            </button>
            {searchQuery && (
              <Link
                to="/admin/comments"
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Clear
              </Link>
            )}
          </form>
        </div>

        {selectedComments.length > 0 && (
          <div className="p-4 bg-blue-50 border-b border-blue-200">
            <div className="flex items-center justify-between">
              <span className="text-blue-800">
                {selectedComments.length} comment(s) selected
              </span>
              <div className="flex items-center space-x-2">
                <select
                  value={bulkAction}
                  onChange={(e) => setBulkAction(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select action...</option>
                  <option value="approve">Approve Selected</option>
                  <option value="reject">Reject Selected</option>
                  <option value="delete">Delete Selected</option>
                </select>
                <button
                  onClick={handleBulkAction}
                  disabled={!bulkAction}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border-b border-red-200">
            <div className="text-red-700">{error}</div>
          </div>
        )}

        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
            <p className="mt-2 text-gray-600">Loading comments...</p>
          </div>
        ) : comments.length === 0 ? (
          <div className="p-12 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="mt-4 text-gray-600">
              {searchQuery ? 'No comments match your search.' : 'No comments found.'}
            </p>
          </div>
        ) : (
          <>
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedComments.length === comments.length && comments.length > 0}
                  onChange={handleSelectAll}
                  className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <span className="ml-3 text-sm text-gray-600">
                  Select all ({comments.length} comments on this page)
                </span>
              </div>
            </div>

            <div className="p-4">
              {comments.map(comment => (
                <CommentModerationCard
                  key={comment.id}
                  comment={comment}
                  selected={selectedComments.includes(comment.id)}
                  onSelect={handleSelectComment}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  onDelete={handleDelete}
                />
              ))}
            </div>

            {pagination.pages > 1 && (
              <div className="flex justify-center items-center space-x-2 py-4 border-t border-gray-200">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <span className="text-gray-600">
                  Page {pagination.page} of {pagination.pages}
                </span>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page === pagination.pages}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Comments;
