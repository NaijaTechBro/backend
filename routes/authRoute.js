// server/routes/auth.js
const express = require('express');
const {
  register,
  login,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
  updateDetails,
  updatePassword,
  verifyEmail
} = require('../controllers/authController');

const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/auth/register', register);
router.post('/auth/login', login);
router.get('/auth/logout', logout);
router.get('/me', protect, getMe);
router.put('/auth/update-details', protect, updateDetails);
router.put('/auth/update-password', protect, updatePassword);
router.post('/auth/forgot-password', forgotPassword);
router.put('/auth/reset-password/:resetToken', resetPassword);
router.get('/auth/verify/:token', verifyEmail);

module.exports = router;
