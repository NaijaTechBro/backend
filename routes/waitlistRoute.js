// server/routes/waitlistRoutes.js
const express = require('express');
const router = express.Router();
const { 
  joinWaitlist, 
  getWaitlist, 
  approveWaitlistEntry, 
  deleteWaitlistEntry, 
  exportWaitlist 
} = require('../controllers/waitlistController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Public route for joining waitlist
router.post('/', joinWaitlist);

// Protected routes (admin only)
router.get('/', protect, authorize('admin'), getWaitlist);
router.patch('/:id/approve', protect, authorize('admin'), approveWaitlistEntry);
router.delete('/:id', protect, authorize('admin'), deleteWaitlistEntry);
router.get('/export', protect, authorize('admin'), exportWaitlist);

module.exports = router;