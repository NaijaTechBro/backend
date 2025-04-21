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
const { authLimiter } = require('../middleware/rateLimiter'); // Import the rate limiter middleware

const router = express.Router();

router.post('/auth/register', authLimiter, register);
router.post('/auth/login', authLimiter, login);
router.get('/auth/logout', logout);
router.get('/me', protect, getMe);
router.put('/auth/update-details', protect, updateDetails);
router.put('/auth/update-password', protect, updatePassword);
router.post('/auth/forgot-password', forgotPassword);
router.put('/auth/reset-password/:resetToken', resetPassword);
router.get('/auth/verify/:token', verifyEmail);

module.exports = router;
