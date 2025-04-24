// server/models/connectionModel.js
const mongoose = require('mongoose');

const ConnectionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  startup: {
    type: mongoose.Schema.ObjectId,
    ref: 'Startup',
    required: true
  },
  founderUser: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  message: {
    type: String,
    required: [true, 'Please provide a connection message'],
    maxlength: [500, 'Message cannot be more than 500 characters']
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending'
  },
  respondedAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Prevent duplicate connection requests
ConnectionSchema.index({ user: 1, startup: 1 }, { unique: true });

module.exports = mongoose.model('Connection', ConnectionSchema);