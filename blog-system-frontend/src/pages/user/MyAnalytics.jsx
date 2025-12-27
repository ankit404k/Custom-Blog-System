import React, { useState, useEffect } from 'react';
import { analyticsService } from '../../services/analyticsService';
import { useAuth } from '../../context/AuthContext';
import AnalyticsChart from '../../components/Admin/AnalyticsChart';
import { Link } from 'react-router-dom';

/**
 * User My Analytics Page
 * Shows user's own analytics and performance metrics
 */
const MyAnalytics = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    if (user) {
      loadUserAnalytics();
    }
  }, [user]);

  const loadUserAnalytics = async () => {
    setLoading(true);
    try {
      const response = await analyticsService.getSingleUserAnalytics(user.id);
      if (response.data.success) {
        setAnalytics(response.data.data);
      }
    } catch (error) {
      console.error('Error loading user analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-500">Loading your analytics...</div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-500">No analytics data available</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Analytics</h1>
        <p className="text-gray-600 mt-1">Track your blog performance and engagement</p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-sm">Total Posts</span>
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900">{analytics.total_posts}</div>
          <div className="text-sm text-gray-500 mt-1">
            {analytics.published_posts} published, {analytics.draft_posts} drafts
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-sm">Total Views</span>
            <div className="p-2 bg-orange-100 rounded-lg">
              <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {analytics.total_views_on_posts?.toLocaleString() || 0}
          </div>
          <div className="text-sm text-gray-500 mt-1">
            Avg: {analytics.average_views_per_post} per post
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-sm">Total Comments</span>
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900">{analytics.total_comments}</div>
          <div className="text-sm text-gray-500 mt-1">
            {analytics.approved_comments} approved
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-sm">Total Likes Received</span>
            <div className="p-2 bg-red-100 rounded-lg">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {analytics.total_likes_on_posts?.toLocaleString() || 0}
          </div>
          <div className="text-sm text-gray-500 mt-1">
            Across all posts
          </div>
        </div>
      </div>

      {/* Most Popular Post */}
      {analytics.most_popular_post && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Most Popular Post</h3>
          <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
            <div className="p-3 bg-blue-600 rounded-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div className="flex-1">
              <Link 
                to={`/posts/${analytics.most_popular_post.slug}`}
                className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors"
              >
                {analytics.most_popular_post.title}
              </Link>
              <div className="text-sm text-gray-500 mt-1">
                {analytics.most_popular_post.views?.toLocaleString() || 0} views
              </div>
            </div>
          </div>
        </div>
      )}

      {/* My Posts Stats */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">My Posts Performance</h3>
        {analytics.posts && analytics.posts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Post Title</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">Views</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">Likes</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">Comments</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">Engagement</th>
                </tr>
              </thead>
              <tbody>
                {analytics.posts.map((post) => (
                  <tr key={post.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <Link 
                        to={`/posts/${post.slug}`}
                        className="font-medium text-gray-900 hover:text-blue-600 transition-colors"
                      >
                        {post.title}
                      </Link>
                      <div className="text-sm text-gray-500">{post.formattedDate}</div>
                    </td>
                    <td className="text-right py-3 px-4 text-gray-900">{post.views?.toLocaleString() || 0}</td>
                    <td className="text-right py-3 px-4 text-gray-900">{post.likes?.toLocaleString() || 0}</td>
                    <td className="text-right py-3 px-4 text-gray-900">{post.comments_count?.toLocaleString() || 0}</td>
                    <td className="text-right py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        post.engagement_rate > 5 ? 'bg-green-100 text-green-800' :
                        post.engagement_rate > 2 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {post.engagement_rate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            You haven't published any posts yet.{' '}
            <Link to="/user/create-post" className="text-blue-600 hover:text-blue-700">
              Create your first post
            </Link>
          </div>
        )}
      </div>

      {/* Charts */}
      {analytics.posts && analytics.posts.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AnalyticsChart
            type="bar"
            data={analytics.posts.slice(0, 10).map(post => ({
              name: post.title.substring(0, 20) + '...',
              views: post.views || 0
            }))}
            xKey="name"
            yKey="views"
            height={300}
            title="Top Posts by Views"
          />

          <AnalyticsChart
            type="bar"
            data={analytics.posts.slice(0, 10).map(post => ({
              name: post.title.substring(0, 20) + '...',
              engagement: parseFloat(post.engagement_rate) || 0
            }))}
            xKey="name"
            yKey="engagement"
            height={300}
            title="Engagement Rate by Post"
          />
        </div>
      )}
    </div>
  );
};

export default MyAnalytics;
