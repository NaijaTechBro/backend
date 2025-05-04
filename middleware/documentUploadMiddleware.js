const multer = require('multer');
const path = require('path');
const fs = require('fs');
const ErrorResponse = require('../middleware/errorResponseMiddleware');

// Make sure uploads directory exists
const uploadDir = 'uploads/documents';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage for document uploads
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function(req, file, cb) {
    // Create unique filename with user ID and original extension
    const userId = req.user ? req.user.id : 'unknown';
    const fileExt = path.extname(file.originalname);
    const sanitizedOriginalName = file.originalname
      .replace(/\s+/g, '-')
      .replace(/[^a-zA-Z0-9-_.]/g, '')
      .substring(0, 40);
    
    cb(null, `${userId}-${file.fieldname}-${Date.now()}-${sanitizedOriginalName}${fileExt}`);
  }
});

// Document file filter
const fileFilter = (req, file, cb) => {
  // Accept documents: PDF, images, and common document formats
  const allowedExtensions = /\.(jpg|jpeg|png|pdf|doc|docx|xls|xlsx)$/;
  
  if (!file.originalname.match(allowedExtensions)) {
    return cb(
      new Error('Only document files are allowed (PDF, JPG, PNG, DOC, DOCX, XLS, XLSX)'), 
      false
    );
  }
  
  cb(null, true);
};

// Initialize multer upload for documents
const documentUpload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 10 // 10MB max file size for documents
  },
  fileFilter: fileFilter
});

// Create upload middleware that handles different document types
const uploadDocuments = documentUpload.fields([
  { name: 'idDocument', maxCount: 1 },
  { name: 'proofOfAddress', maxCount: 1 },
  { name: 'businessRegistration', maxCount: 1 },
  { name: 'additionalDocuments', maxCount: 5 }
]);

module.exports = uploadDocuments;