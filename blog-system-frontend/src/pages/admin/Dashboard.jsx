import React, { useState, useEffect } from 'react';
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm font-medium">Total Views</h3>
          <p className="text-3xl font-bold mt-2">{stats?.totalViews || 0}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm font-medium">Total Likes</h3>
          <p className="text-3xl font-bold mt-2">{stats?.totalLikes || 0}</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
