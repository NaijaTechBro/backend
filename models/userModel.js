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
  // New fields for role-based verification
  isRoleVerified: {
    type: Boolean,
    default: false
  },
  roleVerificationStatus: {
    type: String,
    enum: ['not_submitted', 'pending', 'approved', 'rejected'],
    default: 'not_submitted'
  },
  roleVerificationDocuments: {
    idDocument: {
      type: String, // URL to stored document
      default: null
    },
    businessRegistration: {
      type: String, // URL to stored document
      default: null
    },
    proofOfAddress: {
      type: String, // URL to stored document
      default: null
    },
    additionalDocuments: [{
      type: String // URLs to stored documents
    }]
  },
  roleVerificationSubmittedAt: {
    type: Date
  },
  roleVerificationApprovedAt: {
    type: Date
  },
  roleVerificationRejectedAt: {
    type: Date
  },
  roleVerificationRejectionReason: {
    type: String
  },
  // End of new fields
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
  // For verification purposes
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
      role: this.role,
      isRoleVerified: this.isRoleVerified 
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );
};

// Method to check if user needs role verification
userSchema.methods.requiresRoleVerification = function() {
  return (this.role === 'founder' || this.role === 'investor') && !this.isRoleVerified;
};

module.exports = mongoose.model('User', userSchema);