// server/controllers/investorController.js
const Startup = require('../models/startupModel');
const User = require('../models/userModel');

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

// Get all investors (admin only)
exports.getInvestors = async (req, res) => {
  try {
    const investors = await User.find({ role: 'investor' });
    
    res.status(200).json({
      success: true,
      count: investors.length,
      data: investors
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

