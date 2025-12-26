import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import PostEditor from '../../components/Admin/PostEditor';
import FeaturedImageUpload from '../../components/Shared/FeaturedImageUpload';
import postsService from '../../services/postsService';

const CreatePost = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    featured_image: '',
    status: 'draft',
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);

  // Load post data if editing
  useEffect(() => {
    if (isEdit && id) {
      loadPost();
    }
  }, [id, isEdit]);

  // Auto-save drafts every 30 seconds
  useEffect(() => {
    if (!autoSaveEnabled || !isEdit || formData.status !== 'draft') return;

    const autoSaveInterval = setInterval(() => {
      if (formData.title && formData.content) {
        handleSave(true);
      }
    }, 30000);

    return () => clearInterval(autoSaveInterval);
  }, [formData, autoSaveEnabled, isEdit]);

  const loadPost = async () => {
    try {
      setLoading(true);
      const response = await postsService.getPostById(id);
      const post = response.data;

      setFormData({
        title: post.title,
        content: post.content,
        featured_image: post.featured_image || '',
        status: post.status,
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load post');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleContentChange = (content) => {
    setFormData((prev) => ({ ...prev, content }));
  };

  const handleImageChange = (imageUrl) => {
    setFormData((prev) => ({ ...prev, featured_image: imageUrl }));
  };

  const handleSave = async (isAutoSave = false) => {
    if (!formData.title.trim() || !formData.content.trim()) {
      if (!isAutoSave) {
        setError('Title and content are required');
      }
      return;
    }

    try {
      if (!isAutoSave) {
        setSaving(true);
        setError('');
      }

      const data = {
        title: formData.title,
        content: formData.content,
        status: formData.status,
      };

      if (formData.featured_image) {
        data.featured_image = formData.featured_image;
      }

      if (isEdit) {
        await postsService.updatePost(id, data);
      } else {
        await postsService.createPost(data);
      }

      if (!isAutoSave) {
        if (formData.status === 'published') {
          navigate('/admin/posts');
        } else {
          alert('Post saved as draft');
        }
      }
    } catch (err) {
      if (!isAutoSave) {
        setError(err.response?.data?.message || 'Failed to save post');
      }
    } finally {
      if (!isAutoSave) {
        setSaving(false);
      }
    }
  };

  const handlePublish = async () => {
    setFormData((prev) => ({ ...prev, status: 'published' }));
    await handleSave();
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      setLoading(true);
      await postsService.deletePost(id);
      navigate('/admin/posts');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete post');
    } finally {
      setLoading(false);
    }
  };

  const getWordCount = () => {
    if (!formData.content) return 0;
    const text = formData.content.replace(/<[^>]*>/g, '');
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  if (loading && isEdit) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4" />
          <div className="h-64 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {isEdit ? 'Edit Post' : 'Create New Post'}
          </h1>
          <p className="text-gray-600 mt-1">
            {isEdit ? 'Edit your blog post' : 'Write a new blog post'}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <label className="flex items-center text-sm text-gray-600">
            <input
              type="checkbox"
              checked={autoSaveEnabled}
              onChange={(e) => setAutoSaveEnabled(e.target.checked)}
              className="mr-2"
            />
            Auto-save drafts
          </label>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="space-y-6">
        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Enter post title..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        {/* Featured Image */}
        <FeaturedImageUpload
          image={formData.featured_image}
          onImageChange={handleImageChange}
          onError={(message) => setError(message)}
        />

        {/* Content Editor */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Content <span className="text-red-500">*</span>
          </label>
          <PostEditor
            value={formData.content}
            onChange={handleContentChange}
            placeholder="Write your post content..."
          />
        </div>

        {/* Status */}
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
            Status
          </label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center pt-6 border-t">
          <div className="flex space-x-3">
            <button
              onClick={() => handleSave(false)}
              disabled={saving || loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            {isEdit && (
              <>
                <button
                  onClick={handlePublish}
                  disabled={saving || loading || formData.status === 'published'}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  {formData.status === 'published' ? 'Published' : 'Publish'}
                </button>
                <button
                  onClick={handleDelete}
                  disabled={loading}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  Delete
                </button>
              </>
            )}
          </div>
          <button
            onClick={() => navigate('/admin/posts')}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreatePost;
