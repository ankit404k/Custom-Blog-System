import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import postsService from '../../services/postsService';

const Posts = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [deletedPosts, setDeletedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // all, drafts, published, deleted
  const [selectedPosts, setSelectedPosts] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const filters = {
        page: pagination.page,
        limit: 10,
        ...(statusFilter && { status: statusFilter }),
        ...(searchTerm && { search: searchTerm }),
      };

      let response;
      if (activeTab === 'deleted') {
        response = await postsService.getDeletedPosts(filters);
        setDeletedPosts(response.data || []);
      } else {
        response = await postsService.getPosts(filters);
        setPosts(response.data || []);
      }

      if (response.pagination) {
        setPagination(response.pagination);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [activeTab, pagination.page, statusFilter, searchTerm]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination({ ...pagination, page: 1 });
    fetchPosts();
  };

  const handlePublish = async (postId) => {
    try {
      await postsService.publishPost(postId);
      fetchPosts();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to publish post');
    }
  };

  const handleUnpublish = async (postId) => {
    try {
      await postsService.unpublishPost(postId);
      fetchPosts();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to unpublish post');
    }
  };

  const handleDelete = async (postId) => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      await postsService.deletePost(postId);
      fetchPosts();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete post');
    }
  };

  const handleRestore = async (postId) => {
    try {
      await postsService.restorePost(postId);
      fetchPosts();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to restore post');
    }
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      const currentPosts = activeTab === 'deleted' ? deletedPosts : posts;
      setSelectedPosts(new Set(currentPosts.map((p) => p.id)));
    } else {
      setSelectedPosts(new Set());
    }
  };

  const handleSelectPost = (postId) => {
    const newSelected = new Set(selectedPosts);
    if (newSelected.has(postId)) {
      newSelected.delete(postId);
    } else {
      newSelected.add(postId);
    }
    setSelectedPosts(newSelected);
  };

  const handleBulkAction = async (action) => {
    if (selectedPosts.size === 0) return;

    const confirmMessage = {
      publish: 'Publish selected posts?',
      unpublish: 'Unpublish selected posts?',
      delete: 'Delete selected posts?',
    }[action];

    if (!confirm(confirmMessage)) return;

    try {
      for (const postId of selectedPosts) {
        if (action === 'publish') {
          await postsService.publishPost(postId);
        } else if (action === 'unpublish') {
          await postsService.unpublishPost(postId);
        } else if (action === 'delete') {
          await postsService.deletePost(postId);
        }
      }
      setSelectedPosts(new Set());
      fetchPosts();
    } catch (error) {
      alert('Failed to perform bulk action');
    }
  };

  const currentPosts = activeTab === 'deleted' ? deletedPosts : posts;

  const renderPostRow = (post) => {
    const {
      id,
      title,
      username,
      first_name,
      last_name,
      status,
      created_at,
      updated_at,
      views,
      deleted_at,
    } = post;

    const authorName = first_name || last_name
      ? `${first_name || ''} ${last_name || ''}`.trim()
      : username;

    const displayDate = deleted_at || updated_at || created_at;

    return (
      <tr key={id} className="border-b hover:bg-gray-50">
        <td className="px-4 py-4">
          <input
            type="checkbox"
            checked={selectedPosts.has(id)}
            onChange={() => handleSelectPost(id)}
            className="rounded border-gray-300"
          />
        </td>
        <td className="px-4 py-4">
          <Link to={`/admin/posts/edit/${id}`} className="font-medium text-blue-600 hover:text-blue-800">
            {title}
          </Link>
        </td>
        <td className="px-4 py-4">{authorName}</td>
        <td className="px-4 py-4">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            status === 'published'
              ? 'bg-green-100 text-green-800'
              : 'bg-yellow-100 text-yellow-800'
          }`}>
            {status || 'draft'}
          </span>
        </td>
        <td className="px-4 py-4 text-gray-600">
          {formatDistanceToNow(new Date(displayDate), { addSuffix: true })}
        </td>
        <td className="px-4 py-4">
          <div className="flex space-x-2">
            <Link
              to={`/admin/posts/edit/${id}`}
              className="text-blue-600 hover:text-blue-800"
              title="Edit"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </Link>
            {status === 'published' ? (
              <button
                onClick={() => handleUnpublish(id)}
                className="text-yellow-600 hover:text-yellow-800"
                title="Unpublish"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
              </button>
            ) : (
              <button
                onClick={() => handlePublish(id)}
                className="text-green-600 hover:text-green-800"
                title="Publish"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </button>
            )}
            {activeTab === 'deleted' ? (
              <button
                onClick={() => handleRestore(id)}
                className="text-blue-600 hover:text-blue-800"
                title="Restore"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            ) : (
              <button
                onClick={() => handleDelete(id)}
                className="text-red-600 hover:text-red-800"
                title="Delete"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manage Posts</h1>
          <p className="text-gray-600 mt-1">View, create, edit, and manage blog posts</p>
        </div>
        <button
          onClick={() => navigate('/admin/posts/new')}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Create New Post
        </button>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b">
        <nav className="flex space-x-8">
          {['all', 'published', 'drafts', 'deleted'].map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setPagination({ ...pagination, page: 1 });
                setSelectedPosts(new Set());
              }}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 flex gap-4">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search posts..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            type="submit"
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Search
          </button>
        </form>
      </div>

      {/* Bulk Actions */}
      {selectedPosts.size > 0 && (
        <div className="mb-4 bg-blue-50 border border-blue-200 p-4 rounded-lg flex items-center justify-between">
          <span className="text-sm text-blue-800">{selectedPosts.size} posts selected</span>
          <div className="flex space-x-2">
            {activeTab !== 'deleted' && (
              <>
                <button
                  onClick={() => handleBulkAction('publish')}
                  className="px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                >
                  Publish
                </button>
                <button
                  onClick={() => handleBulkAction('unpublish')}
                  className="px-4 py-2 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700"
                >
                  Unpublish
                </button>
                <button
                  onClick={() => handleBulkAction('delete')}
                  className="px-4 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                >
                  Delete
                </button>
              </>
            )}
            <button
              onClick={() => setSelectedPosts(new Set())}
              className="px-4 py-2 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Posts Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedPosts.size === currentPosts.length && currentPosts.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Author
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentPosts.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                    No posts found
                  </td>
                </tr>
              ) : (
                currentPosts.map(renderPostRow)
              )}
            </tbody>
          </table>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="px-4 py-3 border-t bg-gray-50 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {((pagination.page - 1) * 10) + 1} to {Math.min(pagination.page * 10, pagination.total)} of {pagination.total} results
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                  disabled={pagination.page === 1}
                  className="px-4 py-2 border rounded hover:bg-gray-100 disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="px-4 py-2">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                  disabled={pagination.page === pagination.totalPages}
                  className="px-4 py-2 border rounded hover:bg-gray-100 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Posts;
