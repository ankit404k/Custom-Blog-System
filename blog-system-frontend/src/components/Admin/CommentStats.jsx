import React from 'react';
import { Link } from 'react-router-dom';

const CommentStats = ({ stats }) => {
  if (!stats) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-gray-500 text-sm font-medium">Total Comments</h3>
        <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total || 0}</p>
      </div>

      <div className="bg-yellow-50 p-6 rounded-lg shadow border border-yellow-200">
        <h3 className="text-yellow-700 text-sm font-medium">Pending Approval</h3>
        <p className="text-3xl font-bold text-yellow-800 mt-2">{stats.pending || 0}</p>
        {stats.pending > 0 && (
          <Link 
            to="/admin/comments?status=pending" 
            className="text-sm text-yellow-600 hover:text-yellow-800 mt-2 inline-block"
          >
            Review Now →
          </Link>
        )}
      </div>

      <div className="bg-green-50 p-6 rounded-lg shadow border border-green-200">
        <h3 className="text-green-700 text-sm font-medium">Approved</h3>
        <p className="text-3xl font-bold text-green-800 mt-2">{stats.approved || 0}</p>
      </div>

      <div className="bg-red-50 p-6 rounded-lg shadow border border-red-200">
        <h3 className="text-red-700 text-sm font-medium">Rejected</h3>
        <p className="text-3xl font-bold text-red-800 mt-2">{stats.rejected || 0}</p>
      </div>

      <div className="bg-orange-50 p-6 rounded-lg shadow border border-orange-200">
        <h3 className="text-orange-700 text-sm font-medium">Flagged</h3>
        <p className="text-3xl font-bold text-orange-800 mt-2">{stats.flagged || 0}</p>
        {stats.flagged > 0 && (
          <span className="text-sm text-orange-600 mt-2 inline-block">
            Needs attention
          </span>
        )}
      </div>
    </div>
  );
};

export default CommentStats;
