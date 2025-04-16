// server/routes/investors.js
const express = require('express');
const {
  getFounders,
  getInvestors,
  investInStartup,
  getInvestorPortfolio
} = require('../controllers/investorController');

const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/founders', protect, authorize('admin'), getFounders);
router.get('/investors', protect, authorize('admin'), getInvestors);
router.post('/invest', protect, authorize('investor'), investInStartup);
router.get('/portfolio', protect, authorize('investor'), getInvestorPortfolio);

module.exports = router;