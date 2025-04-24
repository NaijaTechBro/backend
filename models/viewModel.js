// server/models/viewModel.js
const mongoose = require('mongoose');

const ViewSchema = new mongoose.Schema({
  startup: {
    type: mongoose.Schema.ObjectId,
    ref: 'Startup',
    required: true
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    default: null
  },
  ip: {
    type: String,
    default: null
  },
  userAgent: {
    type: String,
    default: 'Unknown'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create index on startup and timestamp for performance
ViewSchema.index({ startup: 1, createdAt: -1 });
// Create index on ip and startup for performance
ViewSchema.index({ ip: 1, startup: 1 });
// Create index on user and startup for performance
ViewSchema.index({ user: 1, startup: 1 });

module.exports = mongoose.model('View', ViewSchema);