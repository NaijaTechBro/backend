// server/routes/exportRoutes.js
const express = require('express');
const { exportPDF, exportPPTX, exportGoogleSlides, checkGoogleAuth } = require('../../controllers/pitch-deck/exportController');
const { protect } = require('../../middleware/authMiddleware');

const router = express.Router();

// Export a deck to a specific format
router.post('/export/pdf/:deckId', protect, exportPDF);

router.post('/export/pptx/:deckId', protect, exportPPTX);

router.post('/export/google-slides/:deckId', protect, exportGoogleSlides);

router.get('/export/check-google-auth', protect, checkGoogleAuth);


module.exports = router;