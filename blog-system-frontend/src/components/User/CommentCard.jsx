import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import commentsService from '../../services/commentsService';

const CommentCard = ({ comment, onDelete, onUpdate, showModeration = false }) => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [loading, setLoading] = useState(false);
  const [showFlagModal, setShowFlagModal] = useState(false);
  const [flagReason, setFlagReason] = useState('');

  const isOwner = user && (user.id === comment.user_id || user.role === 'admin');
  const isPending = comment.status === 'pending';
  const canEdit = isOwner && isPending;
  const canDelete = isOwner;

  const getAuthorName = () => {
    if (comment.first_name || comment.last_name) {
      return `${comment.first_name || ''} ${comment.last_name || ''}`.trim();
    }
    return comment.username;
  };

  const getStatusBadge = () => {
    const badges = {
      approved: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      rejected: 'bg-red-100 text-red-800',
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badges[comment.status]}`}>
        {comment.status.charAt(0).toUpperCase() + comment.status.slice(1)}
      </span>
    );
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    if (editContent.trim().length < 5) return;

    try {
      setLoading(true);
      const updated = await commentsService.updateComment(comment.id, editContent);
      setIsEditing(false);
      if (onUpdate) {
        onUpdate(updated.data);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update comment');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      await commentsService.deleteComment(comment.id);
      if (onDelete) {
        onDelete(comment.id);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete comment');
    }
  };

  const handleFlag = async () => {
    if (!flagReason.trim()) return;

    try {
      await commentsService.flagComment(comment.id, flagReason);
      setShowFlagModal(false);
      setFlagReason('');
      alert('Comment flagged for review');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to flag comment');
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
      <div className="flex items-start space-x-4">
        {comment.profile_picture ? (
          <img
            src={comment.profile_picture}
            alt={getAuthorName()}
            className="w-10 h-10 rounded-full object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold flex-shrink-0">
            {getAuthorName().charAt(0).toUpperCase()}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <span className="font-medium text-gray-900">{getAuthorName()}</span>
              <span className="text-gray-500 text-sm">
                {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
              </span>
              {showModeration && getStatusBadge()}
              {comment.flag_count > 0 && (
                <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium">
                  Flagged ({comment.flag_count})
                </span>
              )}
            </div>

            <div className="flex items-center space-x-2">
              {canEdit && !isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-gray-500 hover:text-blue-600 transition-colors"
                  title="Edit comment"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              )}

              {canDelete && !isEditing && (
                <button
                  onClick={handleDelete}
                  className="text-gray-500 hover:text-red-600 transition-colors"
                  title="Delete comment"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}

              {user && user.id !== comment.user_id && (
                <button
                  onClick={() => setShowFlagModal(true)}
                  className="text-gray-500 hover:text-orange-600 transition-colors"
                  title="Flag as spam"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {isEditing ? (
            <form onSubmit={handleEdit}>
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                rows="3"
                maxLength={2000}
                disabled={loading}
              />
              <div className="flex justify-end space-x-2 mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setEditContent(comment.content);
                  }}
                  className="px-3 py-1 text-gray-600 hover:text-gray-800 transition-colors"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || editContent.trim().length < 5}
                  className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          ) : (
            <p className="text-gray-700 whitespace-pre-wrap">{comment.content}</p>
          )}

          {comment.rejection_reason && (
            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
              <strong>Reason:</strong> {comment.rejection_reason}
            </div>
          )}
        </div>
      </div>

      {showFlagModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Flag Comment</h3>
            <textarea
              value={flagReason}
              onChange={(e) => setFlagReason(e.target.value)}
              placeholder="Why are you flagging this comment?"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              rows="3"
            />
            <div className="flex justify-end space-x-2 mt-4">
              <button
                onClick={() => {
                  setShowFlagModal(false);
                  setFlagReason('');
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleFlag}
                disabled={!flagReason.trim()}
                className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors disabled:opacity-50"
              >
                Flag
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommentCard;
