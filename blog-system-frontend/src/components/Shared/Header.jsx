import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Header = () => {
  const { user, isAuthenticated, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <header className="bg-white shadow">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold text-blue-600">
            Custom Blog System
          </Link>

          <nav className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <span className="text-gray-700">Welcome, {user?.username}</span>
                {user?.role === 'admin' && (
                  <Link to="/admin/dashboard" className="text-blue-600 hover:text-blue-800">
                    Admin Dashboard
                  </Link>
                )}
                <Link to="/profile" className="text-blue-600 hover:text-blue-800">
                  Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-red-600 hover:text-red-800"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-blue-600 hover:text-blue-800">
                  Login
                </Link>
                <Link to="/admin/login" className="text-blue-600 hover:text-blue-800">
                  Admin Login
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
