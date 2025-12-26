const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const config = require('../config/env');
const { User } = require('../models');

const generateToken = (userId, role, email) => {
  return jwt.sign({ userId, role, email }, config.jwt.secret, {
    expiresIn: '15m',
  });
};

const generateRefreshToken = (userId) => {
  return jwt.sign({ userId }, config.jwt.refreshSecret, {
    expiresIn: '7d',
  });
};

const register = async (req, res, next) => {
  try {
    const { email, password, username, first_name, last_name, user_type, admin_secret } = req.body;

    if (!email || !password || !username || !first_name || !last_name) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long',
      });
    }

    const userRole = user_type === 'admin' ? 'admin' : 'user';

    if (userRole === 'admin') {
      const expectedAdminSecret = process.env.ADMIN_SECRET_KEY || 'admin_secret_2024';
      if (admin_secret !== expectedAdminSecret) {
        return res.status(403).json({
          success: false,
          message: 'Invalid admin secret key',
        });
      }
    }

    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists',
      });
    }

    const existingUsername = await User.findByUsername(username);
    if (existingUsername) {
      return res.status(400).json({
        success: false,
        message: 'Username already exists',
      });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const userId = await User.create({
      email,
      password_hash,
      username,
      first_name,
      last_name,
      role: userRole,
    });

    const token = generateToken(userId, userRole, email);
    const refreshToken = generateRefreshToken(userId);

    const user = await User.findById(userId);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        userId,
        username: user.username,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        token,
        refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password, user_type } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    if (user_type && user.role !== user_type) {
      return res.status(403).json({
        success: false,
        message: `Access denied. ${user_type === 'admin' ? 'Admin' : 'User'} credentials required.`,
      });
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    const token = generateToken(user.id, user.role, user.email);
    const refreshToken = generateRefreshToken(user.id);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        userId: user.id,
        username: user.username,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        token,
        refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token required',
      });
    }

    const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret);

    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found',
      });
    }

    const newToken = generateToken(user.id, user.role, user.email);
    const newRefreshToken = generateRefreshToken(user.id);

    res.json({
      success: true,
      data: {
        token: newToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token',
      });
    }
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    res.json({
      success: true,
      message: 'Logout successful',
    });
  } catch (error) {
    next(error);
  }
};

const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, refreshToken, logout, getProfile };
