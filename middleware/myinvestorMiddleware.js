// server/middleware/investorMiddleware.js
const Investor = require('../models/investor/investorModel');
const User = require('../models/userModel');

/**
 * Middleware to ensure an investor profile exists for the authenticated user,
 * creating one if it doesn't exist
 */
exports.ensureInvestor = async (req, res, next) => {
  try {
    // Try to find the user's profile
    let investor = await Investor.findOne({ userId: req.user.id });
    
    // If profile doesn't exist, create it with data from user models
    if (!investor) {
      // Get full user data
      const user = await User.findById(req.user.id);
      
      investor = await Investor.create({
        userId: req.user.id,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        position: 'Investor', // Default value
        organization: 'Independent', // Default value
        bio: user.bio || 'No bio available',
        contactDetails: {
          email: user.email || '',
          phone: user.phone || '',
          website: ''
        },
        preferredStages: ['All Stages'],
        preferredSectors: ['Technology'],
        preferredCountries: ['Global']
        // Add other fields as needed
      });
      
      // Add profile to the request object
      req.investor = investor;
    } else {
      // Add existing profile to the request object
      req.investor = investor;
    }
    
    next();
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Error ensuring investor profile exists: ' + err.message
    });
  }
};

/**
 * Middleware to synchronize essential data between user and investor profile models
 * Can be used after updates to either model
 */
exports.syncInvestorProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    const investor = await Investor.findOne({ userId: req.user.id });
    
    if (user && investor) {
      // Sync user data to investor profile
      const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
      if (fullName !== investor.name) {
        investor.name = fullName;
      }
      
      if (user.email !== investor.contactDetails.email) {
        investor.contactDetails.email = user.email;
      }
      
      if (user.phone !== investor.contactDetails.phone) {
        investor.contactDetails.phone = user.phone;
      }
      
      // Save investor if changes were made
      if (investor.isModified()) {
        await investor.save();
      }
    }
    
    next();
  } catch (err) {
    // Log the error but don't block the request
    console.error('Error syncing investor-profile data:', err);
    next();
  }
};