import React from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

const PostCard = ({ post }) => {
  const {
    id,
    slug,
    title,
    content,
    featured_image,
    created_at,
    username,
    first_name,
    last_name,
    views,
    likes,
    comment_count,
  } = post;

  const authorName = first_name || last_name
    ? `${first_name || ''} ${last_name || ''}`.trim()
    : username;

  // Generate excerpt from content
  const excerpt = content
    .replace(/<[^>]*>/g, '')
    .substring(0, 150)
    .trim() + (content.length > 150 ? '...' : '');

  const timeAgo = formatDistanceToNow(new Date(created_at), { addSuffix: true });

  return (
    <article className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      {featured_image && (
        <Link to={`/posts/${slug}`}>
          <img
            src={featured_image}
            alt={title}
            className="w-full h-48 object-cover hover:opacity-90 transition-opacity"
          />
        </Link>
      )}

      <div className="p-6">
        <Link to={`/posts/${slug}`} className="block">
          <h2 className="text-xl font-bold text-gray-900 mb-2 hover:text-blue-600 transition-colors">
            {title}
          </h2>
        </Link>

        <div className="flex items-center text-sm text-gray-500 mb-3">
          <span>By {authorName}</span>
          <span className="mx-2">•</span>
          <span>{timeAgo}</span>
        </div>

        <p className="text-gray-600 mb-4 line-clamp-3">{excerpt}</p>

        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center space-x-4">
            {views !== undefined && (
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                {views}
              </span>
            )}
            {likes !== undefined && (
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                {likes}
              </span>
            )}
            {comment_count !== undefined && (
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                {comment_count}
              </span>
            )}
          </div>

          <Link
            to={`/posts/${slug}`}
            className="text-blue-600 font-medium hover:text-blue-800 transition-colors"
          >
            Read more →
          </Link>
        </div>
      </div>
    </article>
  );
};

export default PostCard;
