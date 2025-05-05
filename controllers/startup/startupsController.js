// server/controllers/startupController.js
const Startup = require('../../models/startup/startupModel');
const cloudinaryUtils = require('../../utils/cloudinary');

// Create new startup (founder only)
exports.createStartup = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'User authentication failed or user ID not available'
      });
    }

    // Add user to req.body
    req.body.createdBy = req.user.id;
    
    // Check if the user already has 5 startups
    const publishedStartups = await Startup.find({ createdBy: req.user.id });
    
    // If user is not an admin, they can only create 5 startups
    if (publishedStartups.length >= 5 && req.user.role !== 'admin') {
      return res.status(400).json({
        success: false,
        message: 'You have reached the limit of 5 startups'
      });
    }
    
    // Handle logo upload if file is provided
    if (req.file) {
      const uploadOptions = {
        folder: 'getlisted/startups/logos',
        width: 500, 
        height: 500,
        crop: 'fill',
        quality: 'auto'
      };
      
      const imageResult = await cloudinaryUtils.uploadImage(req.file.path, uploadOptions);
      
      // Add the logo information to the request body
      req.body.logo = imageResult;
    } else if (req.body.logoUrl) {
      // Handle case where a URL is provided instead of a file
      req.body.logo = { url: req.body.logoUrl };
      delete req.body.logoUrl; // Remove the temporary field
    }

    // Parse JSON strings back to objects
    if (req.body.founders && typeof req.body.founders === 'string') {
      req.body.founders = JSON.parse(req.body.founders);
    }
    
    if (req.body.fundingRounds && typeof req.body.fundingRounds === 'string') {
      req.body.fundingRounds = JSON.parse(req.body.fundingRounds);
    }
    
    if (req.body.metrics && typeof req.body.metrics === 'string') {
      req.body.metrics = JSON.parse(req.body.metrics);
    }
    
    if (req.body.socialProfiles && typeof req.body.socialProfiles === 'string') {
      req.body.socialProfiles = JSON.parse(req.body.socialProfiles);
    }
    
    const startup = await Startup.create(req.body);
    
    res.status(201).json({
      success: true,
      data: startup
    });
  } catch (err) {
    console.error('Startup creation error:', err); // Add detailed logging
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};
// Get all startups (public)
exports.getStartups = async (req, res) => {
  try {
    // Build query
    let query;
    
    // Copy req.query
    const reqQuery = { ...req.query };

    // Handle search parameter separately
    const searchTerm = reqQuery.search;
    if (searchTerm) {
      delete reqQuery.search; // Remove it from the standard query
    }
    
    // Fields to exclude
    const removeFields = ['select', 'sort', 'page', 'limit'];
    
    // Loop over removeFields and delete them from reqQuery
    removeFields.forEach(param => delete reqQuery[param]);
    
    // Create query string
    let queryStr = JSON.stringify(reqQuery);
    
    // Create operators ($gt, $gte, etc)
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);
    
    // Create base query
    let parsedQuery = JSON.parse(queryStr);
   
    // Add search functionality
    if (searchTerm) {
      // Add case-insensitive search on name and description
      parsedQuery = {
        ...parsedQuery,
        $or: [
          { name: { $regex: searchTerm, $options: 'i' } },
          { description: { $regex: searchTerm, $options: 'i' } }
        ]
      };
    }
    
    // Finding resource with parsedQuery that includes search
    query = Startup.find(parsedQuery);
    
    // Select fields
    if (req.query.select) {
      const fields = req.query.select.split(',').join(' ');
      query = query.select(fields);
    }
    
    // Sort
    if (req.query.sort) {
      const sortBy = req.query.sort.split(',').join(' ');
      query = query.sort(sortBy);
    } else {
      query = query.sort('-createdAt');
    }
    
    // Count total documents with search applied for pagination
    const total = await Startup.countDocuments(parsedQuery);
    
    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    
    query = query.skip(startIndex).limit(limit);
    
    // Execute query
    const startups = await query;
    
    // Pagination result
    const pagination = {};
    
    if (endIndex < total) {
      pagination.next = {
        page: page + 1,
        limit
      };
    }
    
    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit
      };
    }
    
    res.status(200).json({
      success: true,
      count: total,
      pagination,
      data: startups
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// Get single startup (public)
exports.getStartup = async (req, res) => {
  try {
    const startup = await Startup.findById(req.params.id);
    
    if (!startup) {
      return res.status(404).json({
        success: false,
        message: `No startup found with id of ${req.params.id}`
      });
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

// Update startup (founder of startup or admin)
exports.updateStartup = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'User authentication failed or user ID not available'
      });
    }

    let startup = await Startup.findById(req.params.id);
    
    if (!startup) {
      return res.status(404).json({
        success: false,
        message: `No startup found with id of ${req.params.id}`
      });
    }
    
    // Make sure user is startup owner or admin
    if (startup.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to update this startup'
      });
    }
    
    // Handle logo upload if file is provided
    if (req.file) {
      // Delete old logo if it exists
      if (startup.logo && startup.logo.public_id) {
        await cloudinaryUtils.deleteImage(startup.logo.public_id);
      }
      
      const uploadOptions = {
        folder: 'getlisted/startups/logos',
        width: 500,
        height: 500,
        crop: 'fill',
        quality: 'auto'
      };
      
      const imageResult = await cloudinaryUtils.uploadImage(req.file.path, uploadOptions);
      
      // Add the logo information to the request body
      req.body.logo = imageResult;
    } else if (req.body.logoUrl) {
      // Handle case where a URL is provided instead of a file
      req.body.logo = { url: req.body.logoUrl };
      delete req.body.logoUrl; // Remove the temporary field
    }
    
    // Parse JSON strings back to objects
    if (req.body.founders && typeof req.body.founders === 'string') {
      req.body.founders = JSON.parse(req.body.founders);
    }
    
    if (req.body.fundingRounds && typeof req.body.fundingRounds === 'string') {
      req.body.fundingRounds = JSON.parse(req.body.fundingRounds);
    }
    
    if (req.body.metrics && typeof req.body.metrics === 'string') {
      req.body.metrics = JSON.parse(req.body.metrics);
    }
    
    if (req.body.socialProfiles && typeof req.body.socialProfiles === 'string') {
      req.body.socialProfiles = JSON.parse(req.body.socialProfiles);
    }
    
    startup = await Startup.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    
    res.status(200).json({
      success: true,
      data: startup
    });
  } catch (err) {
    console.error('Startup update error:', err); // Added detailed logging like in createStartup
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

exports.deleteStartup = async (req, res) => {
  try {
    const startup = await Startup.findById(req.params.id);

    if (!startup) {
      return res.status(404).json({
        success: false,
        message: `No startup found with id of ${req.params.id}`
      });
    }

    // Check permissions
    if (startup.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to delete this startup'
      });
    }

    // Delete logo from Cloudinary if it exists
    if (startup.logo && startup.logo.public_id) {
      try {
        await cloudinaryUtils.deleteImage(startup.logo.public_id);
      } catch (cloudErr) {
        return res.status(500).json({
          success: false,
          message: `Failed to delete logo from Cloudinary: ${cloudErr.message}`
        });
      }
    }

    // Delete startup from DB
    try {
      await startup.deleteOne(); // more robust than .remove()
    } catch (dbErr) {
      // Optional: log or handle Cloudinary image restoration here (if you can)
      return res.status(500).json({
        success: false,
        message: `Startup deletion failed: ${dbErr.message}`
      });
    }

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


// Upload startup gallery images
exports.uploadGalleryImages = async (req, res) => {
  try {
    const startup = await Startup.findById(req.params.id);
    
    if (!startup) {
      return res.status(404).json({
        success: false,
        message: `No startup found with id of ${req.params.id}`
      });
    }
    
    // Make sure user is startup owner or admin
    if (startup.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to update this startup'
      });
    }
    
    // Check if files are provided
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please upload at least one image'
      });
    }
    
    // Check if gallery would exceed limit (e.g., max 10 images)
    const currentGallerySize = startup.gallery ? startup.gallery.length : 0;
    if (currentGallerySize + req.files.length > 10) {
      return res.status(400).json({
        success: false,
        message: 'Maximum gallery size is 10 images'
      });
    }
    
    // Upload all files to Cloudinary
    const uploadOptions = {
      folder: `getlisted/startups/${startup._id}/gallery`,
      quality: 'auto'
    };
    
    const uploadPromises = req.files.map(file => cloudinaryUtils.uploadImage(file.path, uploadOptions));
    const uploadedImages = await Promise.all(uploadPromises);
    
    // Add new images to gallery
    if (!startup.gallery) {
      startup.gallery = [];
    }
    
    startup.gallery = [...startup.gallery, ...uploadedImages];
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

// Delete a gallery image
exports.deleteGalleryImage = async (req, res) => {
  try {
    const { id, imageId } = req.params;
    
    const startup = await Startup.findById(id);
    
    if (!startup) {
      return res.status(404).json({
        success: false,
        message: `No startup found with id of ${id}`
      });
    }
    
    // Make sure user is startup owner or admin
    if (startup.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to update this startup'
      });
    }
    
    // Find the image in the gallery
    const image = startup.gallery.find(img => img.public_id === imageId);
    
    if (!image) {
      return res.status(404).json({
        success: false,
        message: 'Gallery image not found'
      });
    }
    
    // Delete from Cloudinary
    await cloudinaryUtils.deleteImage(image.public_id);
    
    // Remove from gallery array
    startup.gallery = startup.gallery.filter(img => img.public_id !== imageId);
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

// Get all startups created by the logged-in user
exports.getStartupsByUser = async (req, res) => {
  try {
    // Find startups created by the current user
    const startups = await Startup.find({ createdBy: req.user.id });
    
    res.status(200).json({
      success: true,
      count: startups.length,
      data: startups
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};


// Get all startups created by a specific user (for admin or public profiles)
exports.getStartupsByUserId = async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Find startups created by the specified user
    const startups = await Startup.find({ createdBy: userId });
    
    res.status(200).json({
      success: true,
      count: startups.length,
      data: startups
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};