import React, { useState, useEffect } from 'react';
import { analyticsService } from '../../services/analyticsService';
import { useAuth } from '../../context/AuthContext';

/**
 * Post Engagement Widget Component
 * Displays engagement metrics and like button for a post
 */
const PostEngagementWidget = ({ postId, initialViews, initialLikes, initialComments }) => {
  const { user } = useAuth();
  const [views, setViews] = useState(initialViews || 0);
  const [likes, setLikes] = useState(initialLikes || 0);
  const [comments, setComments] = useState(initialComments || 0);
  const [isLiked, setIsLiked] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Track view when component mounts
    trackView();
    // Check if user has liked the post
    if (user) {
      checkLikeStatus();
    }
  }, [postId, user]);

  const trackView = async () => {
    try {
      await analyticsService.trackView(postId);
    } catch (error) {
      console.error('Error tracking view:', error);
    }
  };

  const checkLikeStatus = async () => {
    try {
      const response = await analyticsService.getSinglePostAnalytics(postId);
      if (response.data.success) {
        setIsLiked(response.data.data.isLiked);
        setLikes(response.data.data.total_likes || 0);
      }
    } catch (error) {
      console.error('Error checking like status:', error);
    }
  };

  const handleLike = async () => {
    if (!user) {
      alert('Please login to like posts');
      return;
    }

    setLoading(true);
    try {
      const response = await analyticsService.toggleLike(postId);
      if (response.data.success) {
        setIsLiked(response.data.data.liked);
        setLikes(response.data.data.like_count);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async (platform) => {
    const url = window.location.href;
    const title = document.title;

    let shareUrl;
    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
        break;
      case 'copy':
        navigator.clipboard.writeText(url);
        alert('Link copied to clipboard!');
        return;
      default:
        return;
    }

    window.open(shareUrl, '_blank', 'width=600,height=400');
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Engagement</h3>
      
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{views.toLocaleString()}</div>
          <div className="text-sm text-gray-600">Views</div>
        </div>
        <div className="text-center p-3 bg-red-50 rounded-lg">
          <div className="text-2xl font-bold text-red-600">{likes.toLocaleString()}</div>
          <div className="text-sm text-gray-600">Likes</div>
        </div>
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{comments.toLocaleString()}</div>
          <div className="text-sm text-gray-600">Comments</div>
        </div>
      </div>

      {/* Like Button */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={handleLike}
          disabled={loading}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
            isLiked
              ? 'bg-red-500 text-white hover:bg-red-600'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {isLiked ? (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 4.5 0 00-6.364 0z" />
            </svg>
          )}
          {loading ? '...' : isLiked ? 'Liked' : 'Like'}
        </button>
        <span className="text-sm text-gray-500">
          {likes.toLocaleString()} {likes === 1 ? 'person likes' : 'people like'} this
        </span>
      </div>

      {/* Share Buttons */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3">Share this post</h4>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleShare('twitter')}
            className="p-2 bg-[#1DA1F2] text-white rounded-lg hover:opacity-90 transition-opacity"
            title="Share on Twitter"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
            </svg>
          </button>
          <button
            onClick={() => handleShare('facebook')}
            className="p-2 bg-[#4267B2] text-white rounded-lg hover:opacity-90 transition-opacity"
            title="Share on Facebook"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
          </button>
          <button
            onClick={() => handleShare('linkedin')}
            className="p-2 bg-[#0077B5] text-white rounded-lg hover:opacity-90 transition-opacity"
            title="Share on LinkedIn"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
            </svg>
          </button>
          <button
            onClick={() => handleShare('copy')}
            className="p-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            title="Copy link"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PostEngagementWidget;
