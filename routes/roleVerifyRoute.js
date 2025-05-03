const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  submitRoleVerification,
  checkVerificationStatus,
  getPendingVerifications,
  approveVerification,
  rejectVerification
} = require('../controllers/roleVerifyController');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max file size
  fileFilter: function (req, file, cb) {
    // Accept only PDF, JPG, JPEG, and PNG files
    if (
      file.mimetype === 'application/pdf' ||
      file.mimetype === 'image/jpeg' ||
      file.mimetype === 'image/jpg' ||
      file.mimetype === 'image/png'
    ) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, JPG, JPEG, and PNG files are allowed!'), false);
    }
  }
});

// Configure fields for document upload
const uploadFields = upload.fields([
  { name: 'idDocument', maxCount: 1 },
  { name: 'businessRegistration', maxCount: 1 },
  { name: 'proofOfAddress', maxCount: 1 },
  { name: 'additionalDocuments', maxCount: 5 }
]);

// Routes for user verification
router.post('/submit', protect, uploadFields, submitRoleVerification);
router.get('/status', protect, checkVerificationStatus);

// Admin routes for managing verification
router.get('/pending', protect, authorize('admin'), getPendingVerifications);
router.put('/approve/:userId', protect, authorize('admin'), approveVerification);
router.put('/reject/:userId', protect, authorize('admin'), rejectVerification);

module.exports = router;