// server/middleware/profileMiddleware.js
const Profile = require('../models/profileModel');
const User = require('../models/userModel');

/**
 * Middleware to ensure a profile exists for the authenticated user,
 * creating one if it doesn't exist
 */
exports.ensureProfile = async (req, res, next) => {
  try {
    // Try to find the user's profile
    let profile = await Profile.findOne({ user: req.user.id });
    
    // If profile doesn't exist, create it with data from user model
    if (!profile) {
      // Get full user data
      const user = await User.findById(req.user.id);
      
      profile = await Profile.create({
        user: req.user.id,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        bio: user.bio || '',
        email: user.email || '',
        phone: user.phone || '',

        // Add other fields as needed
      });
      
      // Add profile to the request object
      req.profile = profile;
    } else {
      // Add existing profile to the request object
      req.profile = profile;
    }
    
    next();
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Error ensuring profile exists: ' + err.message
    });
  }
};

/**
 * Middleware to synchronize essential data between user and profile models
 * Can be used after updates to either model
 */
exports.syncUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    const profile = await Profile.findOne({ user: req.user.id });
    
    if (user && profile) {
      // Check if essential data needs to be synced
      if (user.firstName !== profile.firstName || user.lastName !== profile.lastName) {
        profile.firstName = user.firstName;
        profile.lastName = user.lastName;
        await profile.save();
      }
    }
    
    next();
  } catch (err) {
    // Log the error but don't block the request
    console.error('Error syncing user-profile data:', err);
    next();
  }
};