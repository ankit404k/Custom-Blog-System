import React, { useState } from 'react';
import { formatDistanceToNow, format } from 'date-fns';
import { Link } from 'react-router-dom';

const CommentModerationCard = ({
  comment,
  onApprove,
  onReject,
  onDelete,
  selected,
  onSelect,
}) => {
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

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

  const getAuthorName = () => {
    if (comment.first_name || comment.last_name) {
      return `${comment.first_name || ''} ${comment.last_name || ''}`.trim();
    }
    return comment.username;
  };

  const handleReject = () => {
    onReject(comment.id, rejectReason);
    setShowRejectModal(false);
    setRejectReason('');
  };

  const truncateContent = (text, maxLength = 150) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <>
      <div
        className={`bg-white rounded-lg border p-4 mb-4 ${
          selected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200 hover:border-gray-300'
        }`}
      >
        <div className="flex items-start space-x-4">
          <div className="pt-1">
            <input
              type="checkbox"
              checked={selected}
              onChange={() => onSelect(comment.id)}
              className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-3">
                {comment.profile_picture ? (
                  <img
                    src={comment.profile_picture}
                    alt={getAuthorName()}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold">
                    {getAuthorName().charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-900">{getAuthorName()}</span>
                    {comment.email && (
                      <span className="text-xs text-gray-500">({comment.email})</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">
                    {format(new Date(comment.created_at), 'MMM d, yyyy h:mm a')}
                    {' · '}
                    {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {getStatusBadge()}
                {comment.flag_count > 0 && (
                  <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium">
                    Flagged ({comment.flag_count})
                  </span>
                )}
              </div>
            </div>

            {comment.post_title && (
              <div className="mb-2">
                <Link
                  to={`/posts/${comment.post_slug}`}
                  className="text-sm text-blue-600 hover:text-blue-800"
                  target="_blank"
                >
                  On: {comment.post_title}
                </Link>
              </div>
            )}

            <div className="bg-gray-50 rounded p-3 mb-3">
              <p className="text-gray-700 whitespace-pre-wrap">
                {truncateContent(comment.content, 300)}
              </p>
            </div>

            {comment.rejection_reason && (
              <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                <strong>Rejection Reason:</strong> {comment.rejection_reason}
              </div>
            )}

            {comment.flag_reason && (
              <div className="mb-3 p-2 bg-orange-50 border border-orange-200 rounded text-sm text-orange-700">
                <strong>Flag Reason:</strong> {comment.flag_reason}
              </div>
            )}

            <div className="flex items-center space-x-2">
              {comment.status === 'pending' && (
                <>
                  <button
                    onClick={() => onApprove(comment.id)}
                    className="px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors flex items-center"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Approve
                  </button>
                  <button
                    onClick={() => setShowRejectModal(true)}
                    className="px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors flex items-center"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Reject
                  </button>
                </>
              )}

              {comment.status === 'approved' && (
                <button
                  onClick={() => onReject(comment.id, null)}
                  className="px-3 py-1.5 bg-orange-600 text-white text-sm rounded hover:bg-orange-700 transition-colors flex items-center"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                  Unapprove
                </button>
              )}

              {comment.status === 'rejected' && (
                <button
                  onClick={() => onApprove(comment.id)}
                  className="px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors flex items-center"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Re-approve
                </button>
              )}

              <button
                onClick={() => {
                  if (confirm('Are you sure you want to delete this comment?')) {
                    onDelete(comment.id);
                  }
                }}
                className="px-3 py-1.5 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 transition-colors flex items-center"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Reject Comment</h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason (optional)
              </label>
              <select
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select a reason</option>
                <option value="Spam">Spam</option>
                <option value="Offensive content">Offensive content</option>
                <option value="Irrelevant">Irrelevant</option>
                <option value="Harassment">Harassment</option>
                <option value="Violates guidelines">Violates guidelines</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Or enter custom reason
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Enter rejection reason..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                rows="3"
              />
            </div>

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason('');
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                Reject Comment
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CommentModerationCard;
