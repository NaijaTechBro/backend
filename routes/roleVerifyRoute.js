const express = require('express');
const {
  submitVerification,
  getVerificationStatus,
  reviewVerification,
  getAllVerifications,
  getVerificationById,
  deleteVerification
} = require('../controllers/verificationController');

const router = express.Router();

// Import middleware
const { protect, authorize } = require('../middleware/authMiddleware');

// Protected routes - any authenticated user
router.post('/submit', protect, submitVerification);
router.get('/status', protect, getVerificationStatus);
router.get('/:id', protect, getVerificationById);

// Admin only routes
router.get('/', protect, authorize('admin'), getAllVerifications);
router.put('/:id/review', protect, authorize('admin'), reviewVerification);
router.delete('/:id', protect, authorize('admin'), deleteVerification);

module.exports = router;