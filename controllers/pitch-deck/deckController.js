// server/controllers/deckController.js
const Deck = require('../../models/pitch-deck/deckModel');

// Get all decks for a user
const getDecks = async (req, res) => {
  try {
    const decks = await Deck.find({ userId: req.user.id })
                          .sort({ lastModified: -1 });
    res.json(decks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get a single deck
const getDeck = async (req, res) => {
  try {
    const deck = await Deck.findOne({
      _id: req.params.id,
      userId: req.user.id
    });
    
    if (!deck) {
      return res.status(404).json({ message: 'Deck not found' });
    }
    
    res.json(deck);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create a new deck
const createDeck = async (req, res) => {
  try {
    const { title, sector, slides } = req.body;
    
    const newDeck = new Deck({
      title,
      sector,
      slides,
      userId: req.user.id
    });
    
    await newDeck.save();
    res.status(201).json(newDeck);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update a deck
const updateDeck = async (req, res) => {
  try {
    const { title, sector, slides } = req.body;
    
    // Check if deck exists and belongs to user
    let deck = await Deck.findOne({
      _id: req.params.id,
      userId: req.user.id
    });
    
    if (!deck) {
      return res.status(404).json({ message: 'Deck not found' });
    }
    
    // Update fields
    deck.title = title;
    deck.sector = sector;
    deck.slides = slides;
    deck.lastModified = new Date();
    
    await deck.save();
    res.json(deck);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete a deck
const deleteDeck = async (req, res) => {
  try {
    const deck = await Deck.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    });
    
    if (!deck) {
      return res.status(404).json({ message: 'Deck not found' });
    }
    
    res.json({ message: 'Deck removed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getDecks,
  getDeck,
  createDeck,
  updateDeck,
  deleteDeck
};