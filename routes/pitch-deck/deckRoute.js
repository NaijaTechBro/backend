// server/routes/deckRoutes.js
const express = require('express');
const { 
  getDecks, 
  getDeck, 
  createDeck, 
  updateDeck, 
  deleteDeck 
} = require('../../controllers/pitch-deck/deckController');
const { protect } = require('../../middleware/authMiddleware');

const router = express.Router();

// Get all decks for a user
router.get('/getall', protect, getDecks);

// Get a single deck
router.get('/getOne/:id', protect, getDeck);

// Create a new deck
router.post('/create', protect, createDeck);

// Update a deck
router.put('/update/:id', protect, updateDeck);

// Delete a deck
router.delete('/delete/:id', protect, deleteDeck);

module.exports = router;