import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import postsService from '../../services/postsService';
import CommentForm from '../../components/User/CommentForm';
import CommentList from '../../components/User/CommentList';

const PostDetail = () => {
  const { slug } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [relatedPosts, setRelatedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPost();
  }, [slug]);

  const fetchPost = async () => {
    try {
      setLoading(true);
      const response = await postsService.getPostBySlug(slug);
      setPost(response.data);

      // Fetch related posts (excluding current post)
      fetchRelatedPosts(response.data.id);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load post');
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedPosts = async (currentPostId) => {
    try {
      const response = await postsService.getPosts({
        limit: 3,
        status: 'published',
      });
      const related = (response.data || []).filter(p => p.id !== currentPostId);
      setRelatedPosts(related.slice(0, 3));
    } catch (err) {
      console.error('Error fetching related posts:', err);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      await postsService.deletePost(post.id);
      navigate('/user/my-posts');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete post');
    }
  };

  const canEdit = user && (user.id === post?.author_id || user.role === 'admin');

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-3/4" />
          <div className="h-64 bg-gray-200 rounded" />
          <div className="h-4 bg-gray-200 rounded" />
          <div className="h-4 bg-gray-200 rounded w-5/6" />
          <div className="h-4 bg-gray-200 rounded w-4/6" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-4xl mx-auto text-center">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
        <Link to="/" className="inline-block mt-4 text-blue-600 hover:text-blue-800">
          ← Back to posts
        </Link>
      </div>
    );
  }

  if (!post) return null;

  const authorName = post.first_name || post.last_name
    ? `${post.first_name || ''} ${post.last_name || ''}`.trim()
    : post.username;

  return (
    <div className="min-h-screen bg-gray-50">
      <article className="max-w-4xl mx-auto px-6 py-8">
        {/* Back button */}
        <Link
          to="/posts"
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to posts
        </Link>

        {/* Featured Image */}
        {post.featured_image && (
          <img
            src={post.featured_image}
            alt={post.title}
            className="w-full h-96 object-cover rounded-lg shadow-lg mb-8"
          />
        )}

        {/* Header */}
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{post.title}</h1>

          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center space-x-4">
              {post.profile_picture ? (
                <img
                  src={post.profile_picture}
                  alt={authorName}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                  {authorName.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <div className="font-medium text-gray-900">{authorName}</div>
                <div className="text-gray-500">
                  {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-6">
              <span className="flex items-center" title="Views">
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                {post.views || 0}
              </span>
              <span className="flex items-center" title="Likes">
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                {post.likes || 0}
              </span>
              <span className="flex items-center" title="Comments">
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                {post.comments_count || 0}
              </span>
            </div>
          </div>
        </header>

        {/* Author Bio */}
        {post.bio && (
          <div className="bg-gray-100 rounded-lg p-4 mb-8">
            <h3 className="font-semibold text-gray-900 mb-2">About the Author</h3>
            <p className="text-gray-700 text-sm">{post.bio}</p>
          </div>
        )}

        {/* Content */}
        <div
          className="prose prose-lg max-w-none bg-white rounded-lg shadow-sm p-8"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* Actions */}
        {canEdit && (
          <div className="mt-8 pt-6 border-t flex justify-end space-x-4">
            <Link
              to={`/user/posts/edit/${post.id}`}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Edit Post
            </Link>
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Delete Post
            </button>
          </div>
        )}

        {/* Share Buttons */}
        <div className="mt-8 pt-6 border-t">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Share this post</h3>
          <div className="flex space-x-3">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
              Share on Facebook
            </button>
            <button className="px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors text-sm">
              Share on Twitter
            </button>
            <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm">
              Share on WhatsApp
            </button>
          </div>
        </div>

        {/* Comments Section */}
        <div className="mt-12 pt-8 border-t">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Comments</h2>
          
          <div className="mb-8">
            <CommentForm postId={post.id} onCommentSubmitted={() => {}} />
          </div>

          <CommentList postId={post.id} />
        </div>
      </article>

      {/* Related Posts Sidebar */}
      {relatedPosts.length > 0 && (
        <aside className="max-w-4xl mx-auto px-6 pb-12">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Related Posts</h2>
            <div className="space-y-4">
              {relatedPosts.map((relatedPost) => (
                <Link
                  key={relatedPost.id}
                  to={`/posts/${relatedPost.slug}`}
                  className="flex items-start space-x-4 group"
                >
                  {relatedPost.featured_image && (
                    <img
                      src={relatedPost.featured_image}
                      alt={relatedPost.title}
                      className="w-24 h-24 object-cover rounded flex-shrink-0"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                      {relatedPost.title}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {formatDistanceToNow(new Date(relatedPost.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </aside>
      )}
    </div>
  );
};

export default PostDetail;
