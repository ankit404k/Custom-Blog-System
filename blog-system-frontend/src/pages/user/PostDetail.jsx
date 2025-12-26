import React from 'react';
import { useParams } from 'react-router-dom';

const PostDetail = () => {
  const { id } = useParams();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Post Detail</h1>
      <p className="text-gray-600">Post detail view will be implemented here. Post ID: {id}</p>
    </div>
  );
};

export default PostDetail;
