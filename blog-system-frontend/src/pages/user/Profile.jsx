import React from 'react';
import { useAuth } from '../../context/AuthContext';

const Profile = () => {
  const { user } = useAuth();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">My Profile</h1>
      
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2">Username</label>
          <p className="text-gray-900">{user?.username}</p>
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2">Email</label>
          <p className="text-gray-900">{user?.email}</p>
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2">Role</label>
          <p className="text-gray-900 capitalize">{user?.role}</p>
        </div>
      </div>
    </div>
  );
};

export default Profile;
