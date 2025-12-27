import React, { useState, useEffect } from 'react';
import { analyticsService } from '../../services/analyticsService';
import AnalyticsChart from '../../components/Admin/AnalyticsChart';

/**
 * Admin Post Analytics Page
 * Detailed analytics for all posts
 */
const AdminPostAnalytics = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    sortBy: 'views',
    sortOrder: 'DESC',
    page: 1,
    limit: 20,
    search: ''
  });
  const [topPosts, setTopPosts] = useState([]);

  useEffect(() => {
    loadPostsAnalytics();
    loadTopPosts();
  }, [filters]);

  const loadPostsAnalytics = async () => {
    setLoading(true);
    try {
      const response = await analyticsService.getPostsAnalytics(filters);
      if (response.data.success) {
        setPosts(response.data.data);
      }
    } catch (error) {
      console.error('Error loading posts analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTopPosts = async () => {
    try {
      const response = await analyticsService.getTopPosts({ limit: 5, metric: 'total_engagement', days: 30 });
      if (response.data.success) {
        setTopPosts(response.data.data);
      }
    } catch (error) {
      console.error('Error loading top posts:', error);
    }
  };

  const handleSort = (sortBy) => {
    setFilters(prev => ({
      ...prev,
      sortBy,
      sortOrder: prev.sortBy === sortBy && prev.sortOrder === 'DESC' ? 'ASC' : 'DESC',
      page: 1
    }));
  };

  const handleSearch = (e) => {
    setFilters(prev => ({
      ...prev,
      search: e.target.value,
      page: 1
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Posts Analytics</h1>
        <p className="text-gray-600 mt-1">Detailed analytics for all your posts</p>
      </div>

      {/* Top Posts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">All Posts</h3>
            
            {/* Search and Filters */}
            <div className="flex items-center gap-4 mb-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search posts..."
                  value={filters.search}
                  onChange={handleSearch}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <select
                value={filters.sortBy}
                onChange={(e) => handleSort(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="views">Sort by Views</option>
                <option value="likes">Sort by Likes</option>
                <option value="comments_count">Sort by Comments</option>
                <option value="engagement_rate">Sort by Engagement Rate</option>
                <option value="published_at">Sort by Date</option>
              </select>
            </div>

            {/* Posts Table */}
            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading...</div>
            ) : posts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No posts found</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Title</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-600 cursor-pointer hover:text-blue-600" onClick={() => handleSort('views')}>
                        Views {filters.sortBy === 'views' && <span>{filters.sortOrder === 'DESC' ? '↓' : '↑'}</span>}
                      </th>
                      <th className="text-right py-3 px-4 font-medium text-gray-600 cursor-pointer hover:text-blue-600" onClick={() => handleSort('likes')}>
                        Likes {filters.sortBy === 'likes' && <span>{filters.sortOrder === 'DESC' ? '↓' : '↑'}</span>}
                      </th>
                      <th className="text-right py-3 px-4 font-medium text-gray-600 cursor-pointer hover:text-blue-600" onClick={() => handleSort('comments_count')}>
                        Comments {filters.sortBy === 'comments_count' && <span>{filters.sortOrder === 'DESC' ? '↓' : '↑'}</span>}
                      </th>
                      <th className="text-right py-3 px-4 font-medium text-gray-600 cursor-pointer hover:text-blue-600" onClick={() => handleSort('engagement_rate')}>
                        Engagement {filters.sortBy === 'engagement_rate' && <span>{filters.sortOrder === 'DESC' ? '↓' : '↑'}</span>}
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Author</th>
                    </tr>
                  </thead>
                  <tbody>
                    {posts.map((post) => (
                      <tr key={post.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="font-medium text-gray-900">{post.title}</div>
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
                        <td className="py-3 px-4 text-gray-600">{post.author_name}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Top Posts Sidebar */}
        <div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 5 Posts by Engagement</h3>
            {topPosts.length === 0 ? (
              <div className="text-center py-4 text-gray-500 text-sm">No data</div>
            ) : (
              <div className="space-y-4">
                {topPosts.map((post, index) => (
                  <div key={post.id} className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                      index === 0 ? 'bg-yellow-500' :
                      index === 1 ? 'bg-gray-400' :
                      index === 2 ? 'bg-orange-400' :
                      'bg-gray-200 text-gray-600'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">{post.title}</div>
                      <div className="text-sm text-gray-500">
                        {post.views?.toLocaleString() || 0} views • {post.likes?.toLocaleString() || 0} likes
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <AnalyticsChart
            type="bar"
            data={topPosts.map(post => ({
              name: post.title.substring(0, 20) + '...',
              views: post.views || 0
            }))}
            xKey="name"
            yKey="views"
            height={250}
            title="Top Posts Views"
          />
        </div>
      </div>
    </div>
  );
};

export default AdminPostAnalytics;
