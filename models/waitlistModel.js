// server/models/waitlistModel.js
const mongoose = require('mongoose');

const WaitlistSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    trim: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  firstName: {
    type: String,
    required: [true, 'Please add a first name'],
    trim: true,
    maxlength: [50, 'First name cannot be more than 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Please add a last name'],
    trim: true,
    maxlength: [50, 'Last name cannot be more than 50 characters']
  },
  role: {
    type: String,
    enum: ['founder', 'investor', 'mentor', 'service_provider', 'other'],
    required: [true, 'Please specify your role']
  },
  reason: {
    type: String,
    required: [true, 'Please add your reason for joining'],
    maxlength: [500, 'Reason cannot be more than 500 characters']
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  approvedAt: {
    type: Date
  },
  approvedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create index on email to ensure uniqueness
WaitlistSchema.index({ email: 1 });

module.exports = mongoose.model('Waitlist', WaitlistSchema);