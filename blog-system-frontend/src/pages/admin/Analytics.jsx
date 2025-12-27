import React, { useState, useEffect } from 'react';
import { analyticsService } from '../../services/analyticsService';
import AnalyticsCard from '../../components/Admin/AnalyticsCard';
import AnalyticsChart from '../../components/Admin/AnalyticsChart';
import MetricsTrend from '../../components/Admin/MetricsTrend';

/**
 * Admin Analytics Dashboard Page
 * Main analytics dashboard with key metrics and charts
 */
const AdminAnalytics = () => {
  const [timeRange, setTimeRange] = useState('all');
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [trendsData, setTrendsData] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, [timeRange]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const response = await analyticsService.getDashboardMetrics(timeRange);
      if (response.data.success) {
        setDashboardData(response.data.data.metrics);
        setTrendsData(response.data.data.trends);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const prepareTrendData = (trendArray) => {
    if (!trendArray || trendArray.length === 0) return [];
    
    return trendArray.map(item => ({
      date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      posts: item.posts || 0,
      published: item.published || 0,
      users: item.users || 0,
      comments: item.comments || 0,
      approved: item.approved || 0
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-500">Loading analytics...</div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-500">No analytics data available</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-1">Track your blog's performance and engagement</p>
        </div>
        
        {/* Time Range Selector */}
        <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
          {[
            { value: '7d', label: '7 Days' },
            { value: '30d', label: '30 Days' },
            { value: '90d', label: '90 Days' },
            { value: 'all', label: 'All Time' }
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setTimeRange(option.value)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                timeRange === option.value
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <AnalyticsCard
          title="Total Posts"
          value={dashboardData.posts.total_posts}
          icon="posts"
          color="blue"
          tooltip="Total number of posts including drafts"
        />
        <AnalyticsCard
          title="Published Posts"
          value={dashboardData.posts.published_posts}
          icon="posts"
          color="green"
          tooltip="Number of published posts"
        />
        <AnalyticsCard
          title="Total Users"
          value={dashboardData.users.total_users}
          icon="users"
          color="purple"
          tooltip="Total registered users"
        />
        <AnalyticsCard
          title="Total Views"
          value={dashboardData.views}
          icon="views"
          color="orange"
          tooltip="Total views across all posts"
        />
        <AnalyticsCard
          title="Engagement Rate"
          value={`${dashboardData.engagement.rate}%`}
          icon="engagement"
          color="red"
          tooltip="Percentage of users who engaged (liked or commented)"
        />
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Metrics */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">User Metrics</h3>
          <MetricsTrend
            label="Total Users"
            current={dashboardData.users.total_users}
          />
          <MetricsTrend
            label="Active Users (Last 7 days)"
            current={dashboardData.users.active_users}
          />
          <MetricsTrend
            label="New Users (Last 30 days)"
            current={dashboardData.users.new_users}
          />
        </div>

        {/* Engagement Metrics */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Engagement Metrics</h3>
          <MetricsTrend
            label="Total Views"
            current={dashboardData.views}
          />
          <MetricsTrend
            label="Total Likes"
            current={dashboardData.likes}
          />
          <MetricsTrend
            label="Total Comments"
            current={dashboardData.comments.total_comments}
          />
          <MetricsTrend
            label="Pending Comments"
            current={dashboardData.comments.pending_comments}
          />
        </div>
      </div>

      {/* Charts */}
      {trendsData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Posts Trend */}
          <AnalyticsChart
            type="multi-line"
            data={prepareTrendData(trendsData.posts)}
            xKey="date"
            yKey={['posts', 'published']}
            height={300}
            title="Posts Trend"
            colors={['#3b82f6', '#10b981']}
          />

          {/* Users Growth */}
          <AnalyticsChart
            type="line"
            data={prepareTrendData(trendsData.users)}
            xKey="date"
            yKey="users"
            height={300}
            title="User Growth"
            colors={['#8b5cf6']}
          />

          {/* Comments Trend */}
          <AnalyticsChart
            type="multi-line"
            data={prepareTrendData(trendsData.comments)}
            xKey="date"
            yKey={['comments', 'approved']}
            height={300}
            title="Comments Trend"
            colors={['#f59e0b', '#10b981']}
          />

          {/* Engagement Distribution */}
          <AnalyticsChart
            type="pie"
            data={[
              { name: 'Published Posts', value: dashboardData.posts.published_posts },
              { name: 'Draft Posts', value: dashboardData.posts.draft_posts },
              { name: 'Approved Comments', value: dashboardData.comments.approved_comments },
              { name: 'Pending Comments', value: dashboardData.comments.pending_comments }
            ]}
            xKey="name"
            yKey="value"
            height={300}
            title="Content Distribution"
          />
        </div>
      )}

      {/* Quick Actions */}
      <div className="flex items-center gap-3">
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          View Detailed Analytics
        </button>
        <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
          Export Report
        </button>
      </div>
    </div>
  );
};

export default AdminAnalytics;
