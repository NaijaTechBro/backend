
// models/Template.js
const mongoose = require('mongoose');

const TemplateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  creatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isSystem: {
    type: Boolean,
    default: false
  },
  thumbnailUrl: {
    type: String,
    default: ''
  },
  slides: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Template', TemplateSchema);
