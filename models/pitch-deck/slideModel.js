// models/pitch-deck/slideModel.js
const mongoose = require('mongoose');

const SlideSchema = new mongoose.Schema({
  deckId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Deck',
    required: true
  },
  slideType: {
    type: String,
    required: true,
    enum: [
      'intro', 'problem', 'solution', 'market', 'competition', 
      'business_model', 'traction', 'team', 'financials', 
      'call_to_action', 'custom'
    ]
  },
  position: {
    type: Number,
    required: true
  },
  content: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  mediaUrls: [{
    type: String
  }],
  notes: {
    type: String,
    default: ''
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
  optimizedAt: {
    type: Date,
    default: null
  }
}, { timestamps: true });

// Create compound index for efficient querying
SlideSchema.index({ deckId: 1, position: 1 });

module.exports = mongoose.model('Slide', SlideSchema);