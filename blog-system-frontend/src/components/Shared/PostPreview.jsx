import React from 'react';
import { formatDistanceToNow } from 'date-fns';

const PostPreview = ({ post, onEdit, onCancel }) => {
  const authorName = post.first_name || post.last_name
    ? `${post.first_name || ''} ${post.last_name || ''}`.trim()
    : post.username;

  return (
    <div className="bg-white rounded-lg shadow-lg p-8 max-w-4xl mx-auto">
      <div className="mb-6 flex justify-between items-start">
        <div>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            post.status === 'published'
              ? 'bg-green-100 text-green-800'
              : 'bg-yellow-100 text-yellow-800'
          }`}>
            {post.status || 'draft'}
          </span>
          {post.featured_image && (
            <span className="ml-2 text-sm text-gray-500">Has featured image</span>
          )}
        </div>
        <div className="flex space-x-2">
          <button
            onClick={onEdit}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Edit Post
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>

      {/* Featured Image */}
      {post.featured_image && (
        <img
          src={post.featured_image}
          alt={post.title}
          className="w-full h-96 object-cover rounded-lg mb-8"
        />
      )}

      {/* Title and Meta */}
      <div className="mb-8 border-b pb-6">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">{post.title}</h1>
        <div className="flex items-center text-sm text-gray-600">
          <span>By {authorName}</span>
          <span className="mx-2">•</span>
          <span>{formatDistanceToNow(new Date(), { addSuffix: true })}</span>
          <span className="mx-2">•</span>
          <span>{post.status === 'published' ? 'Published' : 'Draft'}</span>
        </div>
      </div>

      {/* Content */}
      <div
        className="prose prose-lg max-w-none"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />

      {/* Preview Note */}
      <div className="mt-8 pt-6 border-t bg-blue-50 p-4 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Preview Mode:</strong> This is how your post will appear when published.
          Click "Edit Post" to make changes.
        </p>
      </div>
    </div>
  );
};

export default PostPreview;
