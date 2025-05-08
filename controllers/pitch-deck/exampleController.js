// controllers/example.controller.js
const Example = require('../../models/pitch-deck/exampleModel');

/**
 * @desc    Get all example decks
 * @route   GET /api/examples
 * @access  Private
 */
exports.getExamples = async (req, res) => {
  try {
    const examples = await Example.find()
      .sort({ createdAt: -1 });
    
    res.json(examples);
  } catch (error) {
    console.error('Get examples error:', error);
    res.status(500).json({ message: 'Server error fetching examples' });
  }
};

/**
 * @desc    Get example by ID
 * @route   GET /api/examples/:id
 * @access  Private
 */
exports.getExampleById = async (req, res) => {
  try {
    const example = await Example.findById(req.params.id);
    
    if (!example) {
      return res.status(404).json({ message: 'Example not found' });
    }
    
    res.json(example);
  } catch (error) {
    console.error('Get example by ID error:', error);
    res.status(500).json({ message: 'Server error fetching example' });
  }
};

/**
 * @desc    Create a new example deck
 * @route   POST /api/examples
 * @access  Private/Admin
 */
exports.createExample = async (req, res) => {
  try {
    const { title, description, deckStructure, industry } = req.body;

    // Validate required fields
    if (!title || !deckStructure) {
      return res.status(400).json({ message: 'Title and deck structure are required' });
    }

    // Create example
    const example = await Example.create({
      title,
      description: description || '',
      createdBy: req.user._id,
      deckStructure,
      industry: industry || ''
    });

    res.status(201).json(example);
  } catch (error) {
    console.error('Create example error:', error);
    res.status(500).json({ message: 'Server error creating example' });
  }
};

/**
 * @desc    Update example
 * @route   PUT /api/examples/:id
 * @access  Private/Admin
 */
exports.updateExample = async (req, res) => {
  try {
    const exampleId = req.params.id;
    const { title, description, deckStructure, industry } = req.body;

    const example = await Example.findById(exampleId);
    
    if (!example) {
      return res.status(404).json({ message: 'Example not found' });
    }

    // Update fields if provided
    if (title !== undefined) example.title = title;
    if (description !== undefined) example.description = description;
    if (deckStructure !== undefined) example.deckStructure = deckStructure;
    if (industry !== undefined) example.industry = industry;

    // Save updated example
    const updatedExample = await example.save();
    res.json(updatedExample);
  } catch (error) {
    console.error('Update example error:', error);
    res.status(500).json({ message: 'Server error updating example' });
  }
};

/**
 * @desc    Delete example
 * @route   DELETE /api/examples/:id
 * @access  Private/Admin
 */
exports.deleteExample = async (req, res) => {
  try {
    const exampleId = req.params.id;
    
    const example = await Example.findById(exampleId);
    
    if (!example) {
      return res.status(404).json({ message: 'Example not found' });
    }

    // Delete the example
    await example.remove();

    res.json({ message: 'Example deleted successfully' });
  } catch (error) {
    console.error('Delete example error:', error);
    res.status(500).json({ message: 'Server error deleting example' });
  }
};

/**
 * @desc    Create deck from example
 * @route   POST /api/examples/:id/create-deck
 * @access  Private
 */
exports.createDeckFromExample = async (req, res) => {
  try {
    const exampleId = req.params.id;
    const { title, description } = req.body;
    
    const example = await Example.findById(exampleId);
    
    if (!example) {
      return res.status(404).json({ message: 'Example not found' });
    }
    
    // Create a new deck
    const Deck = require('../models/Deck');
    const Slide = require('../models/Slide');
    
    const deck = await Deck.create({
      userId: req.user._id,
      title: title || example.title,
      description: description || example.description
    });
    
    // Create slides from example structure
    if (example.deckStructure && example.deckStructure.slides) {
      for (let i = 0; i < example.deckStructure.slides.length; i++) {
        const slideTemplate = example.deckStructure.slides[i];
        
        await Slide.create({
          deckId: deck._id,
          slideType: slideTemplate.type,
          position: i,
          content: slideTemplate.content || {},
          notes: slideTemplate.notes || ''
        });
      }
    }
    
    res.status(201).json({
      message: 'Deck created successfully from example',
      deck
    });
  } catch (error) {
    console.error('Create deck from example error:', error);
    res.status(500).json({ message: 'Server error creating deck from example' });
  }
};