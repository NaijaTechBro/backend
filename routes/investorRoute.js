// server/routes/investors.js
const express = require('express');
const router = express.Router();

const {
  getFounders,
  getInvestors,
  investInStartup,
  getInvestorPortfolio,
  getInvestor,
  createInvestor,
  updateInvestor,
  deleteInvestor,
  getMyInvestorProfile,
  searchInvestors,
  addPortfolioCompany,
  updatePortfolioCompany,
  removePortfolioCompany
} = require('../controllers/investorController');

const { protect, authorize } = require('../middleware/authMiddleware');
const advancedResults = require('../middleware/advancedResults');
const { ensureInvestor, syncInvestorProfile } = require('../middleware/investorMiddleware');

// Base routes that don't need profile check
router.get('/founders', protect, getFounders);
router.get('/getInvestors', protect, getInvestors);

// Current investor profile routes
router.route('/me')
  .get(protect, ensureInvestor, getMyInvestorProfile);

// Investment operations
router.post('/invest', protect, authorize('investor'), investInStartup);
router.get('/portfolio', protect, authorize('investor'), getInvestorPortfolio);

// Investor profile creation/management
router.post('/create', protect, createInvestor);

// Individual investor operations
router.get('/:id', protect, getInvestor);
router.put('/:id', protect, syncInvestorProfile, updateInvestor);
router.delete('/:id', protect, authorize('admin', 'investor'), deleteInvestor);

// Search functionality
router.post('/search', searchInvestors);

// Portfolio management
router.route('/:id/portfolio')
  .put(protect, addPortfolioCompany);

router.route('/:id/portfolio/:portfolioId')
  .put(protect, updatePortfolioCompany)
  .delete(protect, removePortfolioCompany);

module.exports = router;