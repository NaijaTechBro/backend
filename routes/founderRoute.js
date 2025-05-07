// server/routes/founder.js
const express = require('express');
const {
  getPublicProfile
} = require('../controllers/startup/profileController');

const {
  getFounders,
} = require('../controllers/investorController');

const { protect } = require('../middleware/authMiddleware');


const router = express.Router();


// Public route
router.get('/founder/:userId', getPublicProfile);
router.get('/founders', protect, getFounders);

module.exports = router;