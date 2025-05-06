// server/controllers/profileController.js
const Profile = require('../../models/profileModel');
const cloudinaryUtils = require('../../utils/cloudinary');

// Get user profile
exports.getProfile = async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });
    
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: profile
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
    
    let profile = await Profile.findOne({ user: req.user.id });
    
    if (!profile) {
      // If profile doesn't exist yet, create one
      fieldsToUpdate.user = req.user.id;
      profile = await Profile.create(fieldsToUpdate);
    } else {
      // Update existing profile
      profile = await Profile.findOneAndUpdate(
        { user: req.user.id },
        fieldsToUpdate,
        {
          new: true,
          runValidators: true
        }
      );
    }
    
    res.status(200).json({
      success: true,
      data: profile
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
    
    // Get current profile
    let profile = await Profile.findOne({ user: req.user.id });
    
    if (!profile) {
      // Create profile if it doesn't exist
      profile = await Profile.create({ 
        user: req.user.id,
        firstName: '',  // Add mandatory fields with placeholders
        lastName: ''    // These should be updated later
      });
    }
    
    // If profile already has a profile picture, delete it from Cloudinary
    if (profile.profilePicture && profile.profilePicture.public_id) {
      await cloudinaryUtils.deleteImage(profile.profilePicture.public_id);
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
    
    // Update profile picture
    profile.profilePicture = imageResult;
    await profile.save();
    
    res.status(200).json({
      success: true,
      data: profile
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
    const profile = await Profile.findOne({ user: req.user.id });
    
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }
    
    // If profile has a profile picture, delete it from Cloudinary
    if (profile.profilePicture && profile.profilePicture.public_id) {
      await cloudinaryUtils.deleteImage(profile.profilePicture.public_id);
    }
    
    // Set profile picture to null
    profile.profilePicture = null;
    await profile.save();
    
    res.status(200).json({
      success: true,
      data: profile
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
    const profile = await Profile.findOne({ user: req.params.userId }).select(
      'firstName lastName bio profilePicture socialLinks jobTitle company location skills'
    );
    
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: profile
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};