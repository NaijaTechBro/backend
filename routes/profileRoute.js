// server/routes/profile.js
const express = require('express');
const {
  getProfile,
  updateProfile,
  uploadProfilePicture,
  deleteProfilePicture,
  getPublicProfile
} = require('../controllers/startup/profileController');

const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Protected routes - require authentication
router.get('/me', protect, getProfile);
router.put('/update', protect, updateProfile);
router.post('/upload-picture', protect, uploadProfilePicture);
router.delete('/delete-picture', protect, deleteProfilePicture);

// Public route
router.get('/user/:userId', getPublicProfile);

module.exports = router;