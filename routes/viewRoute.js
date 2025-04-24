// server/routes/views.js
const express = require('express');
const {
  recordView,
  getStartupViewStats,
  getAllStartupsViewStats
} = require('../controllers/viewController');

const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Record a view - available to both authenticated and anonymous users
router.post('/startup/:startupId', recordView);

// Get view stats for a specific startup - founder only
router.get('/startup/:startupId/stats', protect, getStartupViewStats);

// Get view stats for all startups owned by the current user
router.get('/all-startups', protect, getAllStartupsViewStats);

module.exports = router;