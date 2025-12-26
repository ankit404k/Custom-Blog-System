import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import commentsService from '../../services/commentsService';

const CommentForm = ({ postId, onCommentCreated }) => {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!content.trim()) {
      setError('Please enter a comment');
      return;
    }

    if (content.trim().length < 5) {
      setError('Comment must be at least 5 characters');
      return;
    }

    try {
      setLoading(true);
      await commentsService.createComment(postId, content);
      setSuccess('Your comment has been submitted and is pending moderation.');
      setContent('');
      if (onCommentCreated) {
        onCommentCreated();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit comment');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 text-center">
        <p className="text-gray-600 mb-4">You must be logged in to leave a comment.</p>
        <div className="flex justify-center gap-4">
          <Link
            to="/login"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Log In
          </Link>
          <Link
            to="/register"
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Sign Up
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Leave a Comment</h3>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share your thoughts... (minimum 5 characters)"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            rows="4"
            maxLength={2000}
            disabled={loading}
          />
          <div className="flex justify-between mt-2">
            <span className={`text-sm ${content.length < 5 ? 'text-red-500' : 'text-gray-500'}`}>
              {content.length} / 2000 characters (minimum 5)
            </span>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || content.trim().length < 5}
          className={`px-6 py-2 rounded-lg font-medium transition-colors ${
            loading
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {loading ? 'Submitting...' : 'Submit Comment'}
        </button>
      </form>

      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-sm text-yellow-800">
          <strong>Note:</strong> Your comment will be reviewed by a moderator before it appears on
          this page. Comments are limited to 5 submissions per hour.
        </p>
      </div>
    </div>
  );
};

export default CommentForm;
