// models/pitch-deck/deckModel.js
const mongoose = require('mongoose');

const DeckSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: '',
    trim: true
  },
  industry: {
    type: String,
    trim: true,
    default: 'Technology'
  },
  target: {
    type: String,
    trim: true,
    default: 'Investors'
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  templateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Template',
    default: null
  },
  aiSuggestions: [{
    suggestion: String,
    applied: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  lastAnalyzed: {
    type: Date,
    default: null
  }
}, { timestamps: true });

module.exports = mongoose.model('Deck', DeckSchema);