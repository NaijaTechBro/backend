// server/routes/startups.js
const express = require('express');
const {
  getStartups,
  getStartup,
  createStartup,
  updateStartup,
  deleteStartup,
  uploadGalleryImages,
  deleteGalleryImage,
  getStartupsByUser,
  getStartupsByUserId
} = require('../controllers/startup/startupsController');

const upload = require('../middleware/uploadMiddleware');
//y
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

//Public Routes
router.get('/getstartups', getStartups);
router.get('/getstartup/:id', getStartup);


// Protected routes - require authentication
router.post('/create', protect, upload.single('logo'), authorize('founder', 'admin'), createStartup);
router.put('/updatestartup/:id', protect, upload.single('logo'), authorize('founder', 'admin'), updateStartup);
router.delete('/deletestartup/:id', protect, authorize('founder', 'admin'), deleteStartup);


// Gallery managemessnt routes
router.post('/upload/:id/gallery', protect, authorize('founder', 'admin'), uploadGalleryImages);
router.delete('/delete/:id/gallery/:imageId', protect, authorize('founder', 'admin'), deleteGalleryImage);


// User-specific routes
router.get('/user/me', protect, getStartupsByUser);
router.get('/user/:userId', protect, authorize('founder', 'admin'), getStartupsByUserId);


module.exports = router;