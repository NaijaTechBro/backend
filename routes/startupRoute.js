// server/routes/startups.js
const express = require('express');
const {
  getStartups,
  getStartup,
  createStartup,
  updateStartup,
  deleteStartup
} = require('../controllers/StartupController');

const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/')
  .get(getStartups)
  .post(protect, authorize('founder', 'admin'), createStartup);

router.route('/:id')
  .get(getStartup)
  .put(protect, authorize('founder', 'admin'), updateStartup)
  .delete(protect, authorize('founder', 'admin'), deleteStartup);

module.exports = router;