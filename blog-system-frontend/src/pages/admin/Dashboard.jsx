import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { analyticsAPI } from '../../services/api';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await analyticsAPI.getDashboardStats();
      setStats(response.data.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load dashboard statistics');
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-600">{error}</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Link to="/admin/users" className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
          <h3 className="text-gray-500 text-sm font-medium">Total Users</h3>
          <p className="text-3xl font-bold mt-2">{stats?.totalUsers || 0}</p>
        </Link>

        <Link to="/admin/posts" className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
          <h3 className="text-gray-500 text-sm font-medium">Total Posts</h3>
          <p className="text-3xl font-bold mt-2">{stats?.totalPosts || 0}</p>
        </Link>

        <Link to="/admin/comments" className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
          <h3 className="text-gray-500 text-sm font-medium">Total Comments</h3>
          <p className="text-3xl font-bold mt-2">{stats?.totalComments || 0}</p>
        </Link>

        <Link to="/admin/analytics" className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
          <h3 className="text-gray-500 text-sm font-medium">Total Views</h3>
          <p className="text-3xl font-bold mt-2">{stats?.totalViews || 0}</p>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-lg shadow">
          <h3 className="text-blue-100 text-sm font-medium">Quick Actions</h3>
          <div className="mt-4 space-y-2">
            <Link to="/admin/posts/new" className="block bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded transition-colors">
              Create New Post
            </Link>
            <Link to="/admin/comments?status=pending" className="block bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded transition-colors">
              Review Pending Comments
            </Link>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-lg shadow">
          <h3 className="text-green-100 text-sm font-medium">Analytics</h3>
          <div className="mt-4">
            <p className="text-2xl font-bold">{stats?.totalLikes || 0}</p>
            <p className="text-green-100 text-sm">Total Likes</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-lg shadow">
          <h3 className="text-purple-100 text-sm font-medium">Management</h3>
          <div className="mt-4 space-y-2">
            <Link to="/admin/users" className="block bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded transition-colors">
              Manage Users
            </Link>
            <Link to="/admin/posts" className="block bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded transition-colors">
              Manage Posts
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
