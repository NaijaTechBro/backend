// server/utils/cloudinary.js
const cloudinary = require('cloudinary').v2;
const fs = require('fs');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.GETLISTED_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.GETLISTED_CLOUDINARY_API_KEY,
  api_secret: process.env.GETLISTED_CLOUDINARY_API_SECRET
});

/**
 * Upload image to Cloudinarys
 * @param {string} filePath - Path to the file to upload
 * @param {Object} options - Cloudinary upload options
 * @returns {Promise} - Cloudinary upload result
 */
exports.uploadImage = async (filePath, options = {}) => {
  try {
    // Set default options
    const defaultOptions = {
      use_filename: true,
      unique_filename: true,
      overwrite: true,
    };
    
    // Merge default options with provided options
    const uploadOptions = { ...defaultOptions, ...options };
    
    // Upload image to Cloudinary
    const result = await cloudinary.uploader.upload(filePath, uploadOptions);
    
    // Remove file from server after upload
    fs.unlinkSync(filePath);
    
    return {
      public_id: result.public_id,
      url: result.secure_url
    };
  } catch (error) {
    // Remove file from server if upload fails
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    throw new Error(`Error uploading image: ${error.message}`);
  }
};

/**
 * Delete image from Cloudinary
 * @param {string} publicId - Public ID of the image to delete
 * @returns {Promise} - Cloudinary deletion result
 */
exports.deleteImage = async (publicId) => {
  try {
    if (!publicId) {
      throw new Error('Public ID is required');
    }
    
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    throw new Error(`Error deleting image: ${error.message}`);
  }
};

/**
 * Upload multiple images to Cloudinary
 * @param {Array} filePaths - Array of file paths to upload
 * @param {Object} options - Cloudinary upload options
 * @returns {Promise} - Array of Cloudinary upload results
 */
exports.uploadMultipleImages = async (filePaths, options = {}) => {
  try {
    const uploadPromises = filePaths.map(filePath => 
      this.uploadImage(filePath, options)
    );
    
    return await Promise.all(uploadPromises);
  } catch (error) {
    // Clean up any remaining files
    filePaths.forEach(filePath => {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    });
    
    throw new Error(`Error uploading multiple images: ${error.message}`);
  }
};

/**
 * Delete multiple images from Cloudinary
 * @param {Array} publicIds - Array of public IDs to delete
 * @returns {Promise} - Cloudinary deletion results
 */
exports.deleteMultipleImages = async (publicIds) => {
  try {
    if (!publicIds || !publicIds.length) {
      throw new Error('Public IDs array is required');
    }
    
    const result = await cloudinary.api.delete_resources(publicIds);
    return result;
  } catch (error) {
    throw new Error(`Error deleting multiple images: ${error.message}`);
  }
};