// server/routes/deckRoutes.js
const express = require('express');
const { 
  getDecks,
  createDeck,
  getDeckById,
  updateDeck,
  deleteDeck,
  getDeckSlides,
  reorderSlides,
} = require('../../controllers/pitch-deck/deckController');
const { protect } = require('../../middleware/authMiddleware');

const router = express.Router();

router.get('/decks', protect, getDecks);

router.post('/decks', protect, createDeck);

router.get('/decks/:id', protect, getDeckById);

router.put('/decks/:deckId/slides/reorder', protect, reorderSlides)

router.put('/decks/:id'. protect, updateDeck);
// Delete a deck
router.delete('/decks/:id', protect, deleteDeck);

router.get('/decks/:deckId/slides', protect, getDeckSlides)

module.exports = router;