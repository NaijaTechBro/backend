// models/Investor.js
const mongoose = require('mongoose');

const portfolioSchema = new mongoose.Schema({
  startupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Startup'
  },
  startupName: {
    type: String,
    required: true
  },
  investmentDate: {
    type: Date
  },
  investmentStage: {
    type: String,
    enum: ['Pre-seed', 'Seed', 'Series A', 'Series B', 'Series C', 'Later Stage', 'All Stages']
  },
  description: {
    type: String
  }
});

const contactDetailsSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: {
    type: String
  },
  website: {
    type: String
  }
});

const socialProfilesSchema = new mongoose.Schema({
  linkedin: {
    type: String
  },
  twitter: {
    type: String
  }
});

const investorSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  position: {
    type: String,
    required: true
  },
  organization: {
    type: String,
    required: true
  },
  bio: {
    type: String,
    required: true
  },
  profileImage: {
    type: String
  },
  investmentFocus: {
    type: [String],
    default: []
  },
  preferredStages: {
    type: [String],
    enum: ['Pre-seed', 'Seed', 'Series A', 'Series B', 'Series C', 'Later Stage', 'All Stages'],
    required: true
  },
  preferredSectors: {
    type: [String],
    required: true
  },
  preferredCountries: {
    type: [String],
    required: true
  },
  minInvestmentRange: {
    type: Number,
    default: 10000
  },
  maxInvestmentRange: {
    type: Number,
    default: 100000
  },
  portfolio: {
    type: [portfolioSchema],
    default: []
  },
  contactDetails: {
    type: contactDetailsSchema,
    required: true
  },
  socialProfiles: {
    type: socialProfilesSchema,
    default: {}
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationStatus: {
    type: String,
    enum: ['none', 'pending', 'approved', 'rejected'],
    default: 'none'
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

// Update the updatedAt field on save
investorSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Create indexes for better query performance
investorSchema.index({ userId: 1 }, { unique: true });
investorSchema.index({ preferredSectors: 1 });
investorSchema.index({ preferredStages: 1 });
investorSchema.index({ preferredCountries: 1 });
investorSchema.index({ 'portfolio.startupId': 1 });

module.exports = mongoose.models.Investor || mongoose.model('Investor', investorSchema);
