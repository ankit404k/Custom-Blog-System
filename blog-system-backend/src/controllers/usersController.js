const bcrypt = require('bcrypt');
const { User } = require('../models');

const getAllUsers = async (req, res, next) => {
  try {
    const { pool } = require('../config/database');
    const [users] = await pool.query(
      'SELECT id, email, username, first_name, last_name, role, profile_picture, bio, created_at, updated_at FROM users'
    );

    res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);

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

const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { username, first_name, last_name, profile_picture, bio } = req.body;

    if (parseInt(id) !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const updateData = {};
    if (username) {
      const existingUser = await User.findByUsername(username);
      if (existingUser && existingUser.id !== parseInt(id)) {
        return res.status(400).json({
          success: false,
          message: 'Username already exists',
        });
      }
      updateData.username = username;
    }
    if (first_name) updateData.first_name = first_name;
    if (last_name) updateData.last_name = last_name;
    if (profile_picture) updateData.profile_picture = profile_picture;
    if (bio) updateData.bio = bio;

    await User.update(id, updateData);

    res.json({
      success: true,
      message: 'User updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

const updatePassword = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;

    if (parseInt(id) !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    const { pool } = require('../config/database');
    const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
    const user = users[0];

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValidPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    const password_hash = await bcrypt.hash(newPassword, 10);
    await User.update(id, { password_hash });

    res.json({
      success: true,
      message: 'Password updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    await User.delete(id);

    res.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  updatePassword,
  deleteUser,
};
