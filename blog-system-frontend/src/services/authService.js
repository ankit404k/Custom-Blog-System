import api from './api';

export const authService = {
  register: async (email, password, username, firstName, lastName, userType, adminSecret = null) => {
    const data = {
      email,
      password,
      username,
      first_name: firstName,
      last_name: lastName,
      user_type: userType,
    };

    if (adminSecret) {
      data.admin_secret = adminSecret;
    }

    const response = await api.post('/auth/register', data);
    return response.data;
  },

  login: async (email, password, userType) => {
    const response = await api.post('/auth/login', {
      email,
      password,
      user_type: userType,
    });
    return response.data;
  },

  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  },

  refreshToken: async (refreshToken) => {
    const response = await api.post('/auth/refresh-token', { refreshToken });
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  checkAuth: async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return { isAuthenticated: false };
      }

      const response = await api.get('/auth/profile');
      return {
        isAuthenticated: true,
        user: response.data.data,
      };
    } catch (error) {
      return { isAuthenticated: false };
    }
  },
};

export default authService;
