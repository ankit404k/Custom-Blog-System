import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Header from './components/Shared/Header';
import Footer from './components/Shared/Footer';

import AdminLogin from './pages/auth/AdminLogin';
import UserLogin from './pages/auth/UserLogin';
import AdminRegister from './pages/auth/AdminRegister';
import UserRegister from './pages/auth/UserRegister';

import AdminDashboard from './pages/admin/Dashboard';
import AdminPosts from './pages/admin/Posts';
import AdminUsers from './pages/admin/Users';
import AdminAnalytics from './pages/admin/Analytics';
import AdminComments from './pages/admin/Comments';

import Home from './pages/user/Home';
import Posts from './pages/user/Posts';
import Profile from './pages/user/Profile';
import PostDetail from './pages/user/PostDetail';

const PrivateRoute = ({ children, adminOnly = false }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to={adminOnly ? "/admin/login" : "/login"} />;
  }

  if (adminOnly && user?.role !== 'admin') {
    return <Navigate to="/" />;
  }

  return children;
};

const AuthRoute = ({ children, forAdmin = false }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (isAuthenticated) {
    if (user?.role === 'admin') {
      return <Navigate to="/admin/dashboard" />;
    }
    return <Navigate to="/" />;
  }

  return children;
};

const AppRoutes = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/posts" element={<Posts />} />
          <Route path="/posts/:id" element={<PostDetail />} />
          
          <Route path="/login" element={<AuthRoute><UserLogin /></AuthRoute>} />
          <Route path="/register" element={<AuthRoute><UserRegister /></AuthRoute>} />
          <Route path="/admin/login" element={<AuthRoute forAdmin={true}><AdminLogin /></AuthRoute>} />
          <Route path="/admin/register" element={<AuthRoute forAdmin={true}><AdminRegister /></AuthRoute>} />
          
          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <Profile />
              </PrivateRoute>
            }
          />

          <Route
            path="/admin/dashboard"
            element={
              <PrivateRoute adminOnly={true}>
                <AdminDashboard />
              </PrivateRoute>
            }
          />

          <Route
            path="/admin/posts"
            element={
              <PrivateRoute adminOnly={true}>
                <AdminPosts />
              </PrivateRoute>
            }
          />

          <Route
            path="/admin/users"
            element={
              <PrivateRoute adminOnly={true}>
                <AdminUsers />
              </PrivateRoute>
            }
          />

          <Route
            path="/admin/analytics"
            element={
              <PrivateRoute adminOnly={true}>
                <AdminAnalytics />
              </PrivateRoute>
            }
          />

          <Route
            path="/admin/comments"
            element={
              <PrivateRoute adminOnly={true}>
                <AdminComments />
              </PrivateRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;
