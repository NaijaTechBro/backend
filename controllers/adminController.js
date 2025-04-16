// server/controllers/adminController.js
const User = require('../models/userModel');
const Startup = require('../models/startupModel');

// Get all users (admin only)
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find();
    
    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// Get single user (admin only)
exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: `No user found with id of ${req.params.id}`
      });
    }
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// Update user (admin only)
exports.updateUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: `No user found with id of ${req.params.id}`
      });
    }
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// Delete user (admin only)
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: `No user found with id of ${req.params.id}`
      });
    }
    
    await user.remove();
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// Verify a startup (admin only)
exports.verifyStartup = async (req, res) => {
  try {
    const startup = await Startup.findById(req.params.id);
    
    if (!startup) {
      return res.status(404).json({
        success: false,
        message: `No startup found with id of ${req.params.id}`
      });
    }
    
    startup.isVerified = true;
    await startup.save();
    
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

// Get statistics (admin only)
exports.getStatistics = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalStartups = await Startup.countDocuments();
    const totalFounders = await User.countDocuments({ role: 'founder' });
    const totalInvestors = await User.countDocuments({ role: 'investor' });
    
    // Get total funding
    const startups = await Startup.find();
    const totalFunding = startups.reduce((acc, startup) => acc + startup.metrics.fundingTotal, 0);
    
    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalStartups,
        totalFounders,
        totalInvestors,
        totalFunding
      }
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

