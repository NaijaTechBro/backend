const mongoose = require('mongoose');

// Schema for profile picture
const ProfilePictureSchema = new mongoose.Schema({
  public_id: {
    type: String,
    required: true
  },
  url: {
    type: String,
    required: true
  },
  // Additional fields that might be returned from Cloudinary
  secure_url: String,
  format: String,
  width: Number,
  height: Number,
  bytes: Number,
  created_at: Date
});

// Schema for document file
const DocumentSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true
  },
  path: {
    type: String,
    required: true
  },
  originalName: String,
  fileType: String,
  fileSize: Number,
  uploadedAt: {
    type: Date,
    default: Date.now
  }
});

// Schema for social links
const SocialLinkSchema = new mongoose.Schema({
  platform: {
    type: String,
    required: true,
    enum: ['linkedin', 'twitter', 'github', 'facebook', 'instagram', 'website', 'other']
  },
  url: {
    type: String,
    required: true
  },
  display: {
    type: String,
    default: ''
  }
});

const ProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  firstName: {
    type: String,
    required: [true, 'First name is required']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required']
  },
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot be more than 500 characters']
  },
  email: {
    type: String,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  phone: {
    type: String
  },
  homeAddress: {
    type: String
  },
  city: {
    type: String
  },
  state: {
    type: String
  },
  postalCode: {
    type: String
  },
  country: {
    type: String
  },
  profilePicture: ProfilePictureSchema,
  resume: DocumentSchema,
  idDocument: DocumentSchema,
  proofOfAddress: DocumentSchema,
  businessRegistration: DocumentSchema,
  additionalDocuments: [DocumentSchema],
  socialLinks: [SocialLinkSchema],
  jobTitle: {
    type: String
  },
  company: {
    type: String
  },
  location: {
    type: String
  },
  skills: {
    type: [String],
    default: []
  },
  preferences: {
    notifications: {
      paymentNotifications: {
        type: Boolean,
        default: true
      },
      invoiceReminders: {
        type: Boolean,
        default: true
      },
      productUpdates: {
        type: Boolean,
        default: false
      }
    },
    display: {
      currencyFormat: {
        type: String,
        default: 'USD ($)'
      },
      dateFormat: {
        type: String,
        default: 'MM/DD/YYYY'
      }
    },
    integrations: {
      stripe: {
        connected: {
          type: Boolean,
          default: false
        },
        accountId: String
      },
      quickbooks: {
        connected: {
          type: Boolean,
          default: false
        },
        accountId: String
      }
    }
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
ProfileSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Profile', ProfileSchema);