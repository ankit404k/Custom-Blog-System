import React from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

const PendingCommentNotice = ({ comments = [], onView }) => {
  if (comments.length === 0) return null;

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
      <div className="flex items-start space-x-3">
        <svg className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <div className="flex-1">
          <h4 className="text-yellow-800 font-medium mb-2">
            Your Pending Comment{comments.length > 1 ? 's' : ''}
          </h4>
          <p className="text-sm text-yellow-700 mb-4">
            You have {comments.length} comment{comments.length > 1 ? 's' : ''} waiting for moderation approval.
            Once approved, they will appear on the post.
          </p>

          <div className="space-y-3">
            {comments.slice(0, 3).map(comment => (
              <div key={comment.id} className="bg-white rounded border border-yellow-200 p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                  </span>
                  <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                    Pending
                  </span>
                </div>
                <p className="text-sm text-gray-600 line-clamp-2">{comment.content}</p>
                {comment.post_title && (
                  <p className="text-xs text-gray-500 mt-2">
                    On: {comment.post_title}
                  </p>
                )}
              </div>
            ))}
          </div>

          {comments.length > 3 && (
            <button
              onClick={onView}
              className="mt-3 text-sm text-yellow-800 hover:text-yellow-900 font-medium"
            >
              View all {comments.length} pending comments →
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PendingCommentNotice;
