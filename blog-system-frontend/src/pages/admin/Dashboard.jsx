import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { analyticsAPI } from '../../services/api';
import commentsService from '../../services/commentsService';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [commentStats, setCommentStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardStats();
    fetchCommentStats();
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

  const fetchCommentStats = async () => {
    try {
      const response = await commentsService.getCommentStats();
      setCommentStats(response.data);
    } catch (err) {
      console.error('Failed to fetch comment stats:', err);
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm font-medium">Total Users</h3>
          <p className="text-3xl font-bold mt-2">{stats?.totalUsers || 0}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm font-medium">Total Posts</h3>
          <p className="text-3xl font-bold mt-2">{stats?.totalPosts || 0}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm font-medium">Total Comments</h3>
          <p className="text-3xl font-bold mt-2">{stats?.totalComments || 0}</p>
        </div>

        <Link to="/admin/comments" className="bg-yellow-50 p-6 rounded-lg shadow hover:shadow-md transition-shadow block">
          <h3 className="text-yellow-700 text-sm font-medium">Pending Comments</h3>
          <p className="text-3xl font-bold mt-2 text-yellow-600">{commentStats?.pending || 0}</p>
          <p className="text-sm text-yellow-600 mt-1">Click to moderate →</p>
        </Link>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm font-medium">Total Views</h3>
          <p className="text-3xl font-bold mt-2">{stats?.totalViews || 0}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm font-medium">Total Likes</h3>
          <p className="text-3xl font-bold mt-2">{stats?.totalLikes || 0}</p>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link to="/admin/posts" className="bg-blue-50 p-6 rounded-lg hover:shadow-md transition-shadow block">
          <h3 className="text-blue-700 text-lg font-semibold">Manage Posts →</h3>
          <p className="text-blue-600 mt-1">Create, edit, and delete blog posts</p>
        </Link>

        <Link to="/admin/comments" className="bg-green-50 p-6 rounded-lg hover:shadow-md transition-shadow block">
          <h3 className="text-green-700 text-lg font-semibold">Moderate Comments →</h3>
          <p className="text-green-600 mt-1">Review and approve user comments</p>
        </Link>

        <Link to="/admin/users" className="bg-purple-50 p-6 rounded-lg hover:shadow-md transition-shadow block">
          <h3 className="text-purple-700 text-lg font-semibold">Manage Users →</h3>
          <p className="text-purple-600 mt-1">View and manage user accounts</p>
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;
