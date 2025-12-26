import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import commentsService from '../../services/commentsService';

const CommentForm = ({ postId, onCommentSubmitted }) => {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const maxLength = 2000;
  const minLength = 5;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (content.trim().length < minLength) {
      setError(`Comment must be at least ${minLength} characters long`);
      return;
    }

    if (content.trim().length > maxLength) {
      setError(`Comment must not exceed ${maxLength} characters`);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await commentsService.createComment(postId, content.trim());
      setSuccess(response.message);
      setContent('');
      
      if (onCommentSubmitted) {
        onCommentSubmitted(response.data);
      }

      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit comment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <p className="text-gray-700 mb-3">You must be logged in to comment.</p>
        <Link 
          to="/user/login" 
          className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Login to Comment
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-xl font-semibold mb-4">Leave a Comment</h3>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your comment here..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows="5"
            disabled={isSubmitting}
          />
          <div className="flex justify-between items-center mt-2">
            <span className={`text-sm ${
              content.length > maxLength ? 'text-red-600' : 'text-gray-500'
            }`}>
              {content.length} / {maxLength} characters
            </span>
            {content.length > 0 && content.length < minLength && (
              <span className="text-sm text-amber-600">
                {minLength - content.length} more characters required
              </span>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting || content.trim().length < minLength}
          className={`px-6 py-2 rounded-lg font-medium ${
            isSubmitting || content.trim().length < minLength
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Comment'}
        </button>

        <p className="text-sm text-gray-500 mt-3">
          Your comment will be reviewed before being published.
        </p>
      </form>
    </div>
  );
};

export default CommentForm;
