const mongoose = require('mongoose');
const startupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  logo: {
    type: String
  },
  tagline: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  website: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    required: true
  },
  subCategory: {
    type: String
  },
  country: {
    type: String,
    required: true
  },
  city: {
    type: String
  },
  foundingDate: {
    type: Date
  },
  stage: {
    type: String,
    enum: ['Idea', 'Pre-seed', 'Seed', 'Series A', 'Series B', 'Series C', 'Growth', 'Established'],
    required: true
  },
  metrics: {
    fundingTotal: {
      type: Number,
      default: 0
    },
    employees: {
      type: Number,
      default: 1
    },
    revenue: {
      type: String,
      enum: ['Pre-revenue', '$1K-$10K', '$10K-$100K', '$100K-$1M', '$1M-$10M', '$10M+', 'Undisclosed'],
      default: 'Undisclosed'
    }
  },
  socialProfiles: {
    linkedin: String,
    twitter: String,
    facebook: String,
    instagram: String
  },
  founders: [{
    name: String,
    role: String,
    linkedin: String
  }],
  fundingRounds: [{
    date: Date,
    amount: Number,
    investors: [String],
    stage: String
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});
module.exports = mongoose.model('Startup', startupSchema); 