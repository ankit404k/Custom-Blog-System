const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  getUserById,
  updateUser,
  updatePassword,
  deleteUser,
} = require('../controllers/usersController');
const { verifyToken, checkRole } = require('../middleware/auth');

router.get('/', verifyToken, checkRole('admin'), getAllUsers);
router.get('/:id', verifyToken, getUserById);
router.put('/:id', verifyToken, updateUser);
router.put('/:id/password', verifyToken, updatePassword);
router.delete('/:id', verifyToken, checkRole('admin'), deleteUser);

module.exports = router;
