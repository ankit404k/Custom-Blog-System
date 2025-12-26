import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import commentsService from '../../services/commentsService';

const CommentCard = ({ comment, onCommentDeleted, onCommentFlagged }) => {
  const { user } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isFlagging, setIsFlagging] = useState(false);
  const [showFlagForm, setShowFlagForm] = useState(false);
  const [flagReason, setFlagReason] = useState('');
  const [error, setError] = useState('');

  const isOwner = user && user.id === comment.user_id;
  const isPending = comment.status === 'pending';

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this comment?')) {
      return;
    }

    setIsDeleting(true);
    setError('');

    try {
      await commentsService.deleteComment(comment.id);
      if (onCommentDeleted) {
        onCommentDeleted(comment.id);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete comment');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleFlag = async (e) => {
    e.preventDefault();
    
    if (!flagReason.trim()) {
      setError('Please provide a reason for flagging');
      return;
    }

    setIsFlagging(true);
    setError('');

    try {
      await commentsService.flagComment(comment.id, flagReason);
      setShowFlagForm(false);
      setFlagReason('');
      if (onCommentFlagged) {
        onCommentFlagged(comment.id);
      }
      alert('Comment flagged successfully. Thank you for helping us maintain quality.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to flag comment');
    } finally {
      setIsFlagging(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {comment.profile_picture ? (
            <img
              src={comment.profile_picture}
              alt={comment.username}
              className="w-10 h-10 rounded-full"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
              {comment.username?.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        <div className="ml-4 flex-1">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-gray-900">
                {comment.first_name && comment.last_name
                  ? `${comment.first_name} ${comment.last_name}`
                  : comment.username}
              </h4>
              <p className="text-sm text-gray-500">
                {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
              </p>
            </div>

            {isPending && isOwner && (
              <span className="px-3 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                Pending Approval
              </span>
            )}
          </div>

          <p className="mt-2 text-gray-700 whitespace-pre-wrap">{comment.content}</p>

          {error && (
            <div className="mt-2 text-sm text-red-600">{error}</div>
          )}

          <div className="mt-3 flex items-center space-x-4">
            {isOwner && (
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="text-sm text-red-600 hover:text-red-800 disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            )}

            {user && !isOwner && !showFlagForm && (
              <button
                onClick={() => setShowFlagForm(true)}
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                Flag as inappropriate
              </button>
            )}
          </div>

          {showFlagForm && (
            <form onSubmit={handleFlag} className="mt-3 bg-gray-50 p-3 rounded">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Why are you flagging this comment?
              </label>
              <select
                value={flagReason}
                onChange={(e) => setFlagReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded mb-2"
                disabled={isFlagging}
              >
                <option value="">Select a reason...</option>
                <option value="spam">Spam</option>
                <option value="harassment">Harassment or hate speech</option>
                <option value="inappropriate">Inappropriate content</option>
                <option value="off-topic">Off-topic</option>
                <option value="other">Other</option>
              </select>
              <div className="flex space-x-2">
                <button
                  type="submit"
                  disabled={isFlagging || !flagReason}
                  className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                >
                  {isFlagging ? 'Flagging...' : 'Submit Flag'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowFlagForm(false);
                    setFlagReason('');
                    setError('');
                  }}
                  className="px-3 py-1 text-sm bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommentCard;
