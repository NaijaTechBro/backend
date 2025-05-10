// server/routes/pitch-deck/aiRoutes.js
const express = require('express');
const {createSlide, updateSlide, deleteSlide, uploadMedia, deleteMedia, getSlideById, addSlide } = require('../../controllers/pitch-deck/slideController');
const {protect }= require('../../middleware/authMiddleware');

const router = express.Router();

// Get AI suggestions for a slide
router.post('/decks/:deckId/slides', protect, createSlide);

router.post('/decks/:deckId/slides', protect, addSlide);

router.get('/slides/:slideId', protect, getSlideById)

router.put('/slides/:slideId', protect, updateSlide);

router.delete('/slides/:slideId', protect, deleteSlide);

router.post('/slides/:slideId/media', protect, uploadMedia);

router.delete('/slides/:slideId/media/:mediaIndex', protect, deleteMedia);
module.exports = router;