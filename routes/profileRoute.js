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
const { ensureProfile, syncUserProfile } = require('../middleware/profileMiddleware');

const router = express.Router();

// Protected routes - require authentication and ensure profile exists
router.get('/me', protect, ensureProfile, syncUserProfile, getProfile);
router.put('/update', protect, ensureProfile, syncUserProfile, updateProfile);
router.post('/upload-picture', protect, ensureProfile, uploadProfilePicture);
router.delete('/delete-picture', protect, ensureProfile, deleteProfilePicture);

// Public route
router.get('/founder/:userId', getPublicProfile);

module.exports = router;