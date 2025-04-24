// server/controllers/profileController.js
const User = require('../models/userModel');
const cloudinaryUtils = require('../utils/cloudinary');

// Get user profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
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

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    // Fields that can be updated
    const fieldsToUpdate = {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      bio: req.body.bio,
      socialLinks: req.body.socialLinks,
      jobTitle: req.body.jobTitle,
      company: req.body.company,
      location: req.body.location,
      skills: req.body.skills
    };
    
    // Remove undefined fields
    Object.keys(fieldsToUpdate).forEach(key => 
      fieldsToUpdate[key] === undefined && delete fieldsToUpdate[key]
    );
    
    const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
      new: true,
      runValidators: true
    });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
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

// Upload profile picture
exports.uploadProfilePicture = async (req, res) => {
  try {
    // Check if file exists
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a file'
      });
    }
    
    // Get current user
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // If user already has a profile picture, delete it from Cloudinary
    if (user.profilePicture && user.profilePicture.public_id) {
      await cloudinaryUtils.deleteImage(user.profilePicture.public_id);
    }
    
    // Upload to Cloudinary using the utility function
    const uploadOptions = {
      folder: 'getlisted/profiles',
      width: 500,
      height: 500,
      crop: 'fill',
      gravity: 'face'
    };
    
    const imageResult = await cloudinaryUtils.uploadImage(req.file.path, uploadOptions);
    
    // Update user profile picture
    user.profilePicture = imageResult;
    await user.save();
    
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

// Delete profile picture
exports.deleteProfilePicture = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // If user has a profile picture, delete it from Cloudinary
    if (user.profilePicture && user.profilePicture.public_id) {
      await cloudinaryUtils.deleteImage(user.profilePicture.public_id);
    }
    
    // Set profile picture to null
    user.profilePicture = null;
    await user.save();
    
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

// Get public profile by user ID
exports.getPublicProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select(
      'firstName lastName bio profilePicture socialLinks jobTitle company location skills'
    );
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
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