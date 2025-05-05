// controllers/investorController.js
const Investor = require('../models/investorModel');
const User = require('../models/userModel');
const ErrorResponse = require('../middleware/errorResponseMiddleware');
const asyncHandler = require('express-async-handler');
const Startup = require('../models/startupModel');



// Get all founders (admin only)
exports.getFounders = async (req, res) => {
  try {
    const founders = await User.find({ role: 'founder' });
    
    res.status(200).json({
      success: true,
      count: founders.length,
      data: founders
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};


// Invest in a startup (investor only)
exports.investInStartup = async (req, res) => {
  try {
    const { startupId, amount } = req.body;
    
    if (!startupId || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Please provide startup ID and investment amount'
      });
    }
    
    const startup = await Startup.findById(startupId);
    
    if (!startup) {
      return res.status(404).json({
        success: false,
        message: 'Startup not found'
      });
    }
    
    // Add new funding round
    const newFundingRound = {
      date: Date.now(),
      amount: amount,
      investors: [req.user.id],
      stage: startup.stage
    };
    
    startup.fundingRounds.push(newFundingRound);
    
    // Update total funding
    startup.metrics.fundingTotal += amount;
    
    await startup.save();
    
    // Add startup to investor's portfolio
    const investor = await User.findById(req.user.id);
    
    if (!investor.investorProfile.portfolioCompanies.includes(startupId)) {
      investor.investorProfile.portfolioCompanies.push(startupId);
      await investor.save();
    }
    
    res.status(200).json({
      success: true,
      data: startup
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// Get investor portfolio (investor only)
exports.getInvestorPortfolio = async (req, res) => {
  try {
    const investor = await User.findById(req.user.id).populate('investorProfile.portfolioCompanies');
    
    res.status(200).json({
      success: true,
      data: investor.investorProfile.portfolioCompanies
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};










// @desc    Create investor profile
// @route   POST /api/v1/investors
// @access  Private
exports.createInvestor = asyncHandler(async (req, res, next) => {
  // Add user ID to request body
  req.body.userId = req.user.id;

  // Check if user already has an investor profile
  const existingInvestor = await Investor.findOne({ userId: req.user.id });

  if (existingInvestor) {
    return next(new ErrorResponse('User already has an investor profile', 400));
  }

  // Create investor profile
  const investor = await Investor.create(req.body);

  // Update user role to investor if not already
  if (req.user.role !== 'investor') {
    await User.findByIdAndUpdate(req.user.id, { 
      role: 'investor',
      verificationStatus: 'pending',
      verificationSubmittedAt: Date.now()
    });
  }

  res.status(201).json({
    success: true,
    data: investor
  });
});

// @desc    Get all investors
// @route   GET /api/v1/investors
// @access  Public
exports.getInvestors = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

// @desc    Get single investor
// @route   GET /api/v1/investors/:id
// @access  Public
exports.getInvestor = asyncHandler(async (req, res, next) => {
  const investor = await Investor.findById(req.params.id).populate({
    path: 'userId',
    select: 'firstName lastName email profilePicture'
  });

  if (!investor) {
    return next(new ErrorResponse(`Investor not found with id of ${req.params.id}`, 404));
  }

  res.status(200).json({
    success: true,
    data: investor
  });
});

// @desc    Get current user's investor profile
// @route   GET /api/v1/investors/me
// @access  Private
exports.getMyInvestorProfile = asyncHandler(async (req, res, next) => {
  const investor = await Investor.findOne({ userId: req.user.id });

  if (!investor) {
    return next(new ErrorResponse('Investor profile not found for this user', 404));
  }

  res.status(200).json({
    success: true,
    data: investor
  });
});

// @desc    Update investor
// @route   PUT /api/v1/investors/:id
// @access  Private
exports.updateInvestor = asyncHandler(async (req, res, next) => {
  let investor = await Investor.findById(req.params.id);

  if (!investor) {
    return next(new ErrorResponse(`Investor not found with id of ${req.params.id}`, 404));
  }

  // Make sure user is the investor owner or an admin
  if (investor.userId.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse(`User ${req.user.id} is not authorized to update this investor profile`, 401));
  }

  investor = await Investor.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: investor
  });
});

// @desc    Delete investor
// @route   DELETE /api/v1/investors/:id
// @access  Private
exports.deleteInvestor = asyncHandler(async (req, res, next) => {
  const investor = await Investor.findById(req.params.id);

  if (!investor) {
    return next(new ErrorResponse(`Investor not found with id of ${req.params.id}`, 404));
  }

  // Make sure user is the investor owner or an admin
  if (investor.userId.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse(`User ${req.user.id} is not authorized to delete this investor profile`, 401));
  }

  await investor.remove();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Search investors by criteria
// @route   POST /api/v1/investors/search
// @access  Public
exports.searchInvestors = asyncHandler(async (req, res, next) => {
  const { sectors, stages, countries, investmentMin, investmentMax, query } = req.body;
  
  let searchCriteria = {};
  
  // Add search filters
  if (sectors && sectors.length > 0) {
    searchCriteria.preferredSectors = { $in: sectors };
  }
  
  if (stages && stages.length > 0) {
    searchCriteria.preferredStages = { $in: stages };
  }
  
  if (countries && countries.length > 0) {
    searchCriteria.preferredCountries = { $in: countries };
  }
  
  if (investmentMin) {
    searchCriteria.maxInvestmentRange = { $gte: parseInt(investmentMin) };
  }
  
  if (investmentMax) {
    searchCriteria.minInvestmentRange = { $lte: parseInt(investmentMax) };
  }
  
  // Text search across multiple fields
  if (query) {
    searchCriteria.$or = [
      { name: { $regex: query, $options: 'i' } },
      { organization: { $regex: query, $options: 'i' } },
      { bio: { $regex: query, $options: 'i' } },
      { investmentFocus: { $regex: query, $options: 'i' } }
    ];
  }
  
  const investors = await Investor.find(searchCriteria).sort({ createdAt: -1 });
  
  res.status(200).json({
    success: true,
    count: investors.length,
    data: investors
  });
});

// @desc    Add portfolio company
// @route   PUT /api/v1/investors/:id/portfolio
// @access  Private
exports.addPortfolioCompany = asyncHandler(async (req, res, next) => {
  const investor = await Investor.findById(req.params.id);

  if (!investor) {
    return next(new ErrorResponse(`Investor not found with id of ${req.params.id}`, 404));
  }

  // Make sure user is the investor owner or an admin
  if (investor.userId.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse(`User ${req.user.id} is not authorized to update this investor profile`, 401));
  }

  investor.portfolio.push(req.body);
  await investor.save();

  res.status(200).json({
    success: true,
    data: investor
  });
});

// @desc    Update portfolio company
// @route   PUT /api/v1/investors/:id/portfolio/:portfolioId
// @access  Private
exports.updatePortfolioCompany = asyncHandler(async (req, res, next) => {
  const investor = await Investor.findById(req.params.id);

  if (!investor) {
    return next(new ErrorResponse(`Investor not found with id of ${req.params.id}`, 404));
  }

  // Make sure user is the investor owner or an admin
  if (investor.userId.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse(`User ${req.user.id} is not authorized to update this investor profile`, 401));
  }

  // Find the portfolio company
  const portfolioCompany = investor.portfolio.id(req.params.portfolioId);
  
  if (!portfolioCompany) {
    return next(new ErrorResponse(`Portfolio company not found with id of ${req.params.portfolioId}`, 404));
  }

  // Update fields
  for (const key in req.body) {
    portfolioCompany[key] = req.body[key];
  }

  await investor.save();

  res.status(200).json({
    success: true,
    data: investor
  });
});

// @desc    Remove portfolio company
// @route   DELETE /api/v1/investors/:id/portfolio/:portfolioId
// @access  Private
exports.removePortfolioCompany = asyncHandler(async (req, res, next) => {
  const investor = await Investor.findById(req.params.id);

  if (!investor) {
    return next(new ErrorResponse(`Investor not found with id of ${req.params.id}`, 404));
  }

  // Make sure user is the investor owner or an admin
  if (investor.userId.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse(`User ${req.user.id} is not authorized to update this investor profile`, 401));
  }

  // Remove the portfolio company
  investor.portfolio = investor.portfolio.filter(
    item => item._id.toString() !== req.params.portfolioId
  );

  await investor.save();

  res.status(200).json({
    success: true,
    data: investor
  });
});
