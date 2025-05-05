// server/routes/aiRoutes.js
const express = require('express');
const { getSuggestions, generateDeck } = require('../../controllers/pitch-deck/aiController');
const protect = require('../../middleware/authMiddleware');

const router = express.Router();

// Get AI suggestions for a slide
router.post('/suggest', protect, getSuggestions);

// Generate complete pitch deck with AI
router.post('/generate-deck', protect, generateDeck);

module.exports = router;