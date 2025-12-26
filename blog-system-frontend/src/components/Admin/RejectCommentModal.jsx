import React, { useState } from 'react';

const REJECT_REASONS = [
  'Spam',
  'Offensive content',
  'Irrelevant',
  'Harassment',
  'Violates guidelines',
  'Other',
];

const RejectCommentModal = ({ isOpen, onClose, onReject, commentId }) => {
  const [reason, setReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    const finalReason = reason === 'Other' ? customReason : reason;
    if (!finalReason.trim()) return;

    setLoading(true);
    try {
      await onReject(commentId, finalReason);
      onClose();
      setReason('');
      setCustomReason('');
    } catch (error) {
      console.error('Failed to reject comment:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h3 className="text-lg font-semibold mb-4">Reject Comment</h3>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Reason for rejection
          </label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select a reason</option>
            {REJECT_REASONS.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        {reason === 'Other' && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Custom reason
            </label>
            <textarea
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder="Enter rejection reason..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              rows="3"
            />
          </div>
        )}

        <div className="flex justify-end space-x-2">
          <button
            onClick={() => {
              onClose();
              setReason('');
              setCustomReason('');
            }}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || (reason === 'Other' && !customReason.trim()) || !reason}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Rejecting...' : 'Reject Comment'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RejectCommentModal;
