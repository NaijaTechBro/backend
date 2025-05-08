// server/middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

// Middleware to protect routes
exports.protect = async (req, res, next) => {
  let token;
  
  // Check for token in headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }
  
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }
  
  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Attach user to request
    req.user = await User.findById(decoded.id);
    
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }
};

// Role-based authorization middleware
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route`
      });
    }
    next();
  };
};






/**
 * Middleware to check ownership of a deck
 * Used for deck-related operations
 */
exports.checkDeckOwnership = async (req, res, next) => {
  try {
    const deck = await require('../models/Deck').findById(req.params.id || req.params.deckId);
    
    if (!deck) {
      return res.status(404).json({ message: 'Deck not found' });
    }
    
    // Check if user is owner or admin
    if (deck.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to access this deck' });
    }
    
    req.deck = deck;
    next();
  } catch (error) {
    return res.status(500).json({ message: 'Server error checking deck ownership' });
  }
};

/**
 * Middleware to check ownership of a slide
 * Used for slide-related operations
 */
exports.checkSlideOwnership = async (req, res, next) => {
  try {
    const Slide = require('../models/pitch-deck/slideModel');
    const Deck = require('../models/pitch-deck/deckModel');
    
    const slide = await Slide.findById(req.params.slideId);
    
    if (!slide) {
      return res.status(404).json({ message: 'Slide not found' });
    }
    
    const deck = await Deck.findById(slide.deckId);
    
    if (!deck) {
      return res.status(404).json({ message: 'Associated deck not found' });
    }
    
    // Check if user is owner or admin
    if (deck.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to access this slide' });
    }
    
    req.slide = slide;
    req.deck = deck;
    next();
  } catch (error) {
    return res.status(500).json({ message: 'Server error checking slide ownership' });
  }
};

/**
 * Middleware to check ownership of a template
 * Used for template-related operations
 */
exports.checkTemplateOwnership = async (req, res, next) => {
  try {
    const template = await require('../models/pitch-deck/templateModel').findById(req.params.id || req.params.templateId);
    
    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }
    
    // Check if template is system template, user is creator, or user is admin
    if (
      !template.isSystem && 
      template.creatorId.toString() !== req.user._id.toString() && 
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ message: 'Not authorized to access this template' });
    }
    
    req.template = template;
    next();
  } catch (error) {
    return res.status(500).json({ message: 'Server error checking template ownership' });
  }
};