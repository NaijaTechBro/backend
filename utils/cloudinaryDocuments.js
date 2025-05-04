const cloudinary = require('cloudinary').v2;
const fs = require('fs');

// Configuration is already set up in the main cloudinary.js file

/**
 * Upload a document to Cloudinary
 * @param {string} filePath - Path to the document file to upload
 * @param {string} folder - Folder name in Cloudinary (e.g., 'verifications')
 * @param {Object} options - Additional Cloudinary upload options
 * @returns {Promise} - Cloudinary upload result with relevant metadata
 */
exports.uploadDocument = async (filePath, folder = 'verifications', options = {}) => {
  try {
    // Set default options
    const defaultOptions = {
      resource_type: 'auto', // Automatically determine resource type (image/pdf/etc)
      folder: folder,
      use_filename: true,
      unique_filename: true,
      overwrite: true,
    };
    
    // Merge default options with provided options
    const uploadOptions = { ...defaultOptions, ...options };
    
    // Upload document to Cloudinary
    const result = await cloudinary.uploader.upload(filePath, uploadOptions);
    
    // Remove file from server after upload
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    return {
      public_id: result.public_id,
      url: result.secure_url,
      format: result.format,
      resource_type: result.resource_type,
      original_filename: result.original_filename,
      bytes: result.bytes,
      created_at: result.created_at
    };
  } catch (error) {
    // Remove file from server if upload fails
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    throw new Error(`Error uploading document: ${error.message}`);
  }
};

/**
 * Process and upload a verification document from multer file object
 * @param {Object} file - Multer file object 
 * @param {string} userId - User ID to associate with the document
 * @param {string} docType - Document type (idDocument, businessRegistration, etc.)
 * @returns {Promise} - Document metadata for database storage
 */
exports.processVerificationDocument = async (file, userId, docType) => {
  if (!file) return null;
  
  try {
    // Upload to Cloudinary with appropriate folder structure
    const folder = `verifications/${userId}/${docType}`;
    const result = await this.uploadDocument(file.path, folder);
    
    // Return document metadata for storage in database
    return {
      path: result.url,
      publicId: result.public_id,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      format: result.format,
      uploadedAt: new Date()
    };
  } catch (error) {
    throw new Error(`Error processing verification document: ${error.message}`);
  }
};

/**
 * Process multiple verification documents (for additionalDocuments)
 * @param {Array} files - Array of multer file objects
 * @param {string} userId - User ID to associate with the documents
 * @returns {Promise} - Array of document metadata for database storage
 */
exports.processMultipleVerificationDocuments = async (files, userId) => {
  if (!files || !files.length) return [];
  
  try {
    const processPromises = files.map(file => 
      this.processVerificationDocument(file, userId, 'additionalDocuments')
    );
    
    return await Promise.all(processPromises);
  } catch (error) {
    throw new Error(`Error processing multiple verification documents: ${error.message}`);
  }
};

/**
 * Delete a document from Cloudinary by public ID
 * @param {string} publicId - Public ID of the document to delete
 * @returns {Promise} - Cloudinary deletion result
 */
exports.deleteDocument = async (publicId) => {
  try {
    if (!publicId) {
      throw new Error('Public ID is required');
    }
    
    const result = await cloudinary.uploader.destroy(publicId, { resource_type: 'auto' });
    return result;
  } catch (error) {
    throw new Error(`Error deleting document: ${error.message}`);
  }
};