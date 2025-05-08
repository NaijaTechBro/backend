// models/Slide.js
const mongoose = require('mongoose');

const SlideSchema = new mongoose.Schema({
  deckId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Deck',
    required: true
  },
  slideType: {
    type: String,
    required: true
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
  }
}, { timestamps: true });

// Create compound index for efficient querying
SlideSchema.index({ deckId: 1, position: 1 });

module.exports = mongoose.model('Slide', SlideSchema);
