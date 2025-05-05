// server/routes/investors.js
const express = require('express');
const Investor = require('../models/investorModel');

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

const router = express.Router();

router.get('/founders', protect, authorize('admin'), getFounders);
router.get('/investors', protect, authorize('admin'), getInvestors);
router.post('/invest', protect, authorize('investor'), investInStartup);
router.get('/portfolio', protect, authorize('investor'), getInvestorPortfolio);


// Routes that apply to all users
router.route('/')
  .get(
    advancedResults(Investor, {
      path: 'userId',
      select: 'firstName lastName email profilePicture'
    }),
    getInvestors
  )
  .post(protect, createInvestor);

router.route('/search')
  .post(searchInvestors);

router.route('/me')
  .get(protect, getMyInvestorProfile);

router.route('/:id')
  .get(getInvestor)
  .put(protect, updateInvestor)
  .delete(protect, authorize('admin', 'investor'), deleteInvestor);

router.route('/:id/portfolio')
  .put(protect, addPortfolioCompany);

router.route('/:id/portfolio/:portfolioId')
  .put(protect, updatePortfolioCompany)
  .delete(protect, removePortfolioCompany);

module.exports = router;