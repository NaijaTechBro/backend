// server/routes/pitch-deck/aiRoutes.js
const express = require('express');
const { generateContent, optimizeSlide, suggestImprovements} = require('../../controllers/pitch-deck/aiController');
const {protect }= require('../../middleware/authMiddleware');

const router = express.Router();

// Get AI suggestions for a slide
router.post('/ai/generate-content/:slideId', protect, generateContent);

// Generate complete pitch deck with AI
router.post('/ai/optimize-slide/:slideId', protect, optimizeSlide);

// Generate complete pitch deck with AI
router.post('/ai/suggest-improvements/:deckId', protect, suggestImprovements);


module.exports = router;