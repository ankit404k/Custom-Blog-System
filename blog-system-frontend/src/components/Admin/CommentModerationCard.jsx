import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';

const CommentModerationCard = ({ comment, onApprove, onReject, onDelete }) => {
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const getStatusBadge = () => {
    const statusStyles = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    };

    return (
      <span className={`px-3 py-1 text-xs font-medium rounded-full ${statusStyles[comment.status]}`}>
        {comment.status.charAt(0).toUpperCase() + comment.status.slice(1)}
      </span>
    );
  };

  const handleApprove = async () => {
    setIsProcessing(true);
    try {
      await onApprove(comment.id);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    setIsProcessing(true);
    try {
      await onReject(comment.id, rejectReason);
      setShowRejectModal(false);
      setRejectReason('');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this comment? This action cannot be undone.')) {
      return;
    }

    setIsProcessing(true);
    try {
      await onDelete(comment.id);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start flex-1">
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

            <div className="ml-3 flex-1">
              <div className="flex items-center space-x-2">
                <h4 className="font-semibold text-gray-900">
                  {comment.first_name && comment.last_name
                    ? `${comment.first_name} ${comment.last_name}`
                    : comment.username}
                </h4>
                {getStatusBadge()}
                {comment.flag_count > 0 && (
                  <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded">
                    🚩 {comment.flag_count} flag{comment.flag_count > 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500">
                {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>
        </div>

        <div className="mb-3">
          <p className="text-gray-700 whitespace-pre-wrap">{comment.content}</p>
        </div>

        <div className="flex items-center justify-between border-t border-gray-200 pt-3">
          <div className="text-sm text-gray-600">
            On post:{' '}
            <Link 
              to={`/user/posts/${comment.post_id}`} 
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              {comment.post_title}
            </Link>
          </div>

          <div className="flex items-center space-x-2">
            {comment.status === 'pending' && (
              <>
                <button
                  onClick={handleApprove}
                  disabled={isProcessing}
                  className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                >
                  Approve
                </button>
                <button
                  onClick={() => setShowRejectModal(true)}
                  disabled={isProcessing}
                  className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                >
                  Reject
                </button>
              </>
            )}

            {comment.status === 'approved' && (
              <button
                onClick={() => setShowRejectModal(true)}
                disabled={isProcessing}
                className="px-3 py-1 text-sm bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50"
              >
                Unapprove
              </button>
            )}

            {comment.status === 'rejected' && (
              <button
                onClick={handleApprove}
                disabled={isProcessing}
                className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
              >
                Approve
              </button>
            )}

            <button
              onClick={handleDelete}
              disabled={isProcessing}
              className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
            >
              Delete
            </button>
          </div>
        </div>

        {comment.rejection_reason && (
          <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-sm">
            <span className="font-medium text-red-700">Rejection reason:</span>{' '}
            <span className="text-red-600">{comment.rejection_reason}</span>
          </div>
        )}
      </div>

      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Reject Comment</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for rejection (optional)
              </label>
              <select
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2"
                disabled={isProcessing}
              >
                <option value="">Select a reason...</option>
                <option value="Spam or promotional content">Spam or promotional content</option>
                <option value="Harassment or hate speech">Harassment or hate speech</option>
                <option value="Inappropriate or offensive content">Inappropriate or offensive content</option>
                <option value="Off-topic or irrelevant">Off-topic or irrelevant</option>
                <option value="Violates community guidelines">Violates community guidelines</option>
              </select>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason('');
                }}
                disabled={isProcessing}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={isProcessing}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
              >
                {isProcessing ? 'Rejecting...' : 'Reject Comment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CommentModerationCard;
