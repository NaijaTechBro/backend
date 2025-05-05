const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: true,
    minlength: 8,
    select: false
  },
  role: {
    type: String,
    enum: ['user', 'founder', 'investor', 'startup', 'admin'],
    default: 'user'
  },
  profilePicture: {
    type: String
  },
  phone: {
    type: Number
  },
  bio: {
    type: String
  },
  isEmailVerified: {
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
  },
  
  // For investors
  investorProfile: {
    investmentStages: [String],  // ['Seed', 'Series A', etc.]
    investmentSectors: [String], // ['Fintech', 'Healthtech', etc.]
    minInvestmentAmount: Number,
    maxInvestmentAmount: Number,
    portfolioCompanies: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Startup'
    }]
  },
  
  // Role verification fields
  isFounderVerified: {
    type: Boolean,
    default: false
  },
  isInvestorVerified: {
    type: Boolean,
    default: false
  },
  isStartupVerified: {
    type: Boolean,
    default: false
  },
  
  // Verification status tracking
  verificationStatus: {
    type: String,
    enum: ['none', 'pending', 'approved', 'rejected'],
    default: 'none'
  },
  verificationSubmittedAt: Date,
  verificationRejectionReason: String,
  
  // For verification and password reset purposes
  verificationToken: String,
  verificationTokenExpire: Date,
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  lastLogin: Date
});

// Pre-save middleware to hash passwords
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Update the updatedAt field on save
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Method to compare entered password with hashed password
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Method to generate JWT token
userSchema.methods.getSignedJwtToken = function() {
  return jwt.sign(
    { 
      id: this._id,
      role: this.role
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );
};

// Virtual property to get full name 
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Method to check if user is verified for their role
userSchema.methods.isVerifiedForRole = function() {
  if (this.role === 'founder') {
    return this.isFounderVerified;
  } else if (this.role === 'investor') {
    return this.isInvestorVerified;
  } else if (this.role === 'startup') {
    return this.isStartupVerified;
  }
  
  // Default users and admins don't need role verification
  return true;
};

// Check if the model already exists to prevent the "Cannot overwrite model" error
module.exports = mongoose.models.User || mongoose.model('User', userSchema);