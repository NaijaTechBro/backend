
// models/Example.js
const mongoose = require('mongoose');

const ExampleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  deckStructure: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  industry: {
    type: String,
    trim: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Example', ExampleSchema);