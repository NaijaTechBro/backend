// controllers/deck.controller.js
const Deck = require('../../models/pitch-deck/deckModel');
const Slide = require('../../models/pitch-deck/slideModel');
const Template = require('../../models/pitch-deck/templateModel');

/**
 * @desc    Get all decks for logged in user
 * @route   GET /api/decks
 * @access  Private
 */
exports.getDecks = async (req, res) => {
  try {
    // Get decks for current user
    const decks = await Deck.find({ userId: req.user._id })
      .sort({ updatedAt: -1 });
    
    res.json(decks);
  } catch (error) {
    console.error('Get decks error:', error);
    res.status(500).json({ message: 'Server error fetching decks' });
  }
};

/**
 * @desc    Create a new deck
 * @route   POST /api/decks
 * @access  Private
 */
exports.createDeck = async (req, res) => {
  try {
    const { title, description, templateId } = req.body;

    // Validate required fields
    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }

    // Create deck
    const deck = await Deck.create({
      userId: req.user._id,
      title,
      description: description || '',
      templateId: templateId || null
    });

    // If template provided, copy template slides to new deck
    if (templateId) {
      const template = await Template.findById(templateId);
      
      if (template && template.slides) {
        // Template slides is an array of slide blueprints
        for (let i = 0; i < template.slides.length; i++) {
          const slideTemplate = template.slides[i];
          
          await Slide.create({
            deckId: deck._id,
            slideType: slideTemplate.type,
            position: i,
            content: slideTemplate.content || {},
            notes: slideTemplate.notes || ''
          });
        }
      }
    } else {
      // Create default title slide
      await Slide.create({
        deckId: deck._id,
        slideType: 'title',
        position: 0,
        content: {
          title: deck.title,
          subtitle: 'Click to edit subtitle'
        }
      });
    }

    res.status(201).json(deck);
  } catch (error) {
    console.error('Create deck error:', error);
    res.status(500).json({ message: 'Server error creating deck' });
  }
};

/**
 * @desc    Get deck by ID
 * @route   GET /api/decks/:id
 * @access  Private
 */
exports.getDeckById = async (req, res) => {
  try {
    // Deck is attached to req by checkDeckOwnership middleware
    const deck = req.deck;
    res.json(deck);
  } catch (error) {
    console.error('Get deck by ID error:', error);
    res.status(500).json({ message: 'Server error fetching deck' });
  }
};

/**
 * @desc    Update deck
 * @route   PUT /api/decks/:id
 * @access  Private
 */
exports.updateDeck = async (req, res) => {
  try {
    const { title, description, isPublic, templateId } = req.body;
    const deck = req.deck;

    // Update fields if provided
    if (title !== undefined) deck.title = title;
    if (description !== undefined) deck.description = description;
    if (isPublic !== undefined) deck.isPublic = isPublic;
    if (templateId !== undefined) deck.templateId = templateId;

    // Save updated deck
    const updatedDeck = await deck.save();
    res.json(updatedDeck);
  } catch (error) {
    console.error('Update deck error:', error);
    res.status(500).json({ message: 'Server error updating deck' });
  }
};

/**
 * @desc    Delete deck
 * @route   DELETE /api/decks/:id
 * @access  Private
 */
exports.deleteDeck = async (req, res) => {
  try {
    const deck = req.deck;

    // Delete all slides in the deck
    await Slide.deleteMany({ deckId: deck._id });

    // Delete the deck
    await deck.remove();

    res.json({ message: 'Deck deleted successfully' });
  } catch (error) {
    console.error('Delete deck error:', error);
    res.status(500).json({ message: 'Server error deleting deck' });
  }
};

/**
 * @desc    Get all slides for a deck
 * @route   GET /api/decks/:deckId/slides
 * @access  Private
 */
exports.getDeckSlides = async (req, res) => {
  try {
    const deckId = req.params.deckId;

    // Get slides for the deck, sorted by position
    const slides = await Slide.find({ deckId })
      .sort({ position: 1 });

    res.json(slides);
  } catch (error) {
    console.error('Get deck slides error:', error);
    res.status(500).json({ message: 'Server error fetching slides' });
  }
};

/**
 * @desc    Reorder slides in a deck
 * @route   PUT /api/decks/:deckId/slides/reorder
 * @access  Private
 */
exports.reorderSlides = async (req, res) => {
  try {
    const { slideIds } = req.body;
    const deckId = req.params.deckId;

    if (!slideIds || !Array.isArray(slideIds)) {
      return res.status(400).json({ message: 'Invalid slide IDs provided' });
    }

    // Update each slide's position
    const updatePromises = slideIds.map((slideId, index) => {
      return Slide.updateOne(
        { _id: slideId, deckId },
        { position: index }
      );
    });

    await Promise.all(updatePromises);

    // Get updated slides
    const slides = await Slide.find({ deckId })
      .sort({ position: 1 });

    res.json(slides);
  } catch (error) {
    console.error('Reorder slides error:', error);
    res.status(500).json({ message: 'Server error reordering slides' });
  }
};