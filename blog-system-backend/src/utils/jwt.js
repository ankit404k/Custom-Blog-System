const jwt = require('jsonwebtoken');
const config = require('../config/env');

const generateAccessToken = (userId, role, email) => {
  return jwt.sign(
    { userId, role, email },
    config.jwt.secret,
    { expiresIn: '15m' }
  );
};

const generateRefreshToken = (userId) => {
  return jwt.sign(
    { userId },
    config.jwt.refreshSecret,
    { expiresIn: '7d' }
  );
};

const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, config.jwt.secret);
  } catch (error) {
    throw error;
  }
};

const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, config.jwt.refreshSecret);
  } catch (error) {
    throw error;
  }
};

const TOKEN_EXPIRATION = {
  ACCESS_TOKEN: '15m',
  REFRESH_TOKEN: '7d',
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  TOKEN_EXPIRATION,
};
