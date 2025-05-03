const User = require('../models/userModel');

// Middleware to check if founder/investor is verified
exports.verifyRole = async (req, res, next) => {
  try {
    // Skip verification for admin users
    if (req.user.role === 'admin') {
      return next();
    }
    
    const user = await User.findById(req.user.id);
    
    // Only founders and investors need role verification
    if (user.role !== 'founder' && user.role !== 'investor') {
      return next();
    }
    
    // Check if role is verified
    if (!user.isRoleVerified) {
      return res.status(403).json({
        success: false,
        message: 'Your account requires verification before you can perform this action',
        verificationStatus: user.roleVerificationStatus,
        requiresVerification: true
      });
    }
    
    next();
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// Middleware to check if user is a founder
exports.founderOnly = async (req, res, next) => {
  try {
    // Allow admin users
    if (req.user.role === 'admin') {
      return next();
    }
    
    const user = await User.findById(req.user.id);
    
    // Check if user is a founder
    if (user.role !== 'founder') {
      return res.status(403).json({
        success: false,
        message: 'This action requires founder privileges'
      });
    }
    
    // Check if founder is verified
    if (!user.isRoleVerified) {
      return res.status(403).json({
        success: false,
        message: 'Your founder account requires verification before you can perform this action',
        verificationStatus: user.roleVerificationStatus,
        requiresVerification: true
      });
    }
    
    next();
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// Middleware to check if user is an investor
exports.investorOnly = async (req, res, next) => {
  try {
    // Allow admin users
    if (req.user.role === 'admin') {
      return next();
    }
    
    const user = await User.findById(req.user.id);
    
    // Check if user is an investor
    if (user.role !== 'investor') {
      return res.status(403).json({
        success: false,
        message: 'This action requires investor privileges'
      });
    }
    
    // Check if investor is verified
    if (!user.isRoleVerified) {
      return res.status(403).json({
        success: false,
        message: 'Your investor account requires verification before you can perform this action',
        verificationStatus: user.roleVerificationStatus,
        requiresVerification: true
      });
    }
    
    next();
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};