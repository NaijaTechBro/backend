const Verification = require('../../models/startup/verificationModel');
const User = require('../../models/userModel');
const ErrorResponse = require('../../middleware/errorResponseMiddleware');
const asyncHandler = require('express-async-handler');
const uploadDocuments = require('../../middleware/documentUploadMiddleware');
const cloudinaryDocs = require('../../utils/cloudinaryDocuments');
const verificationEmails = require('../../utils/email/verificationEmail');

// @desc    Submit verification documents
// @route   POST /api/verification/submit
// @access  Private (Authenticated users)
exports.submitVerification = asyncHandler(async (req, res, next) => {
  // Check if user already has a pending verification request
  const existingRequest = await Verification.findOne({ 
    user: req.user.id,
    status: 'pending'
  });
  
  if (existingRequest) {
    return next(new ErrorResponse('You already have a pending verification request', 400));
  }
  
  // Use multer middleware to handle file uploads
  uploadDocuments(req, res, async (err) => {
    if (err) {
      return next(new ErrorResponse(`File upload error: ${err.message}`, 400));
    }
    
    // Check required files based on user role
    const requiredFiles = ['idDocument', 'proofOfAddress'];
    if (req.user.role === 'founder') {
      requiredFiles.push('businessRegistration');
    }
    
    for (const field of requiredFiles) {
      if (!req.files || !req.files[field]) {
        return next(new ErrorResponse(`Please upload ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`, 400));
      }
    }
    
    try {
      // Process and upload files to Cloudinary
      const idDocumentData = await cloudinaryDocs.processVerificationDocument(
        req.files.idDocument[0], 
        req.user.id,
        'idDocument'
      );
      
      const proofOfAddressData = await cloudinaryDocs.processVerificationDocument(
        req.files.proofOfAddress[0],
        req.user.id,
        'proofOfAddress'
      );
      
      // Create verification request
      const verificationData = {
        user: req.user.id,
        idDocument: idDocumentData,
        proofOfAddress: proofOfAddressData
      };
      
      // Add business registration if available
      if (req.files.businessRegistration && req.files.businessRegistration[0]) {
        verificationData.businessRegistration = await cloudinaryDocs.processVerificationDocument(
          req.files.businessRegistration[0],
          req.user.id,
          'businessRegistration'
        );
      }
      
      // Process additional documents if any
      if (req.files.additionalDocuments && req.files.additionalDocuments.length > 0) {
        verificationData.additionalDocuments = await cloudinaryDocs.processMultipleVerificationDocuments(
          req.files.additionalDocuments,
          req.user.id
        );
      }
      
      const verification = await Verification.create(verificationData);
      
      // Update user verification status
      const user = await User.findByIdAndUpdate(
        req.user.id, 
        {
          $set: {
            verificationStatus: 'pending',
            verificationSubmittedAt: Date.now()
          }
        },
        { new: true }
      );
      
      // Send notification email to admin
      await verificationEmails.sendVerificationRequestNotification(verification, user);
      
      res.status(201).json({
        success: true,
        data: {
          id: verification._id,
          status: verification.status,
          submittedAt: verification.submittedAt
        }
      });
    } catch (error) {
      return next(new ErrorResponse(`Error submitting verification: ${error.message}`, 500));
    }
  });
});

// @desc    Get verification status for a user
// @route   GET /api/verification/status
// @access  Private (Authenticated users)
exports.getVerificationStatus = asyncHandler(async (req, res, next) => {
  // Find the most recent verification request
  const verification = await Verification
    .findOne({ user: req.user.id })
    .sort({ submittedAt: -1 });
  
  if (!verification) {
    return res.status(200).json({
      success: true,
      data: {
        isVerified: false,
        verificationStatus: null
      }
    });
  }
  
  // Get user data with verification status
  const user = await User.findById(req.user.id);
  
  const roleVerificationField = `is${user.role.charAt(0).toUpperCase() + user.role.slice(1)}Verified`;
  
  res.status(200).json({
    success: true,
    data: {
      isVerified: user[roleVerificationField] || false,
      verificationStatus: verification.status,
      submittedAt: verification.submittedAt,
      rejectionReason: verification.rejectionReason,
      reviewedAt: verification.reviewedAt
    }
  });
});

// @desc    Review a verification request (admin only)
// @route   PUT /api/verification/:id/review
// @access  Private (Admin)
exports.reviewVerification = asyncHandler(async (req, res, next) => {
  const { status, rejectionReason } = req.body;
  
  // Validate input
  if (!status || !['approved', 'rejected'].includes(status)) {
    return next(new ErrorResponse('Please provide a valid status (approved/rejected)', 400));
  }
  
  if (status === 'rejected' && !rejectionReason) {
    return next(new ErrorResponse('Please provide a reason for rejection', 400));
  }
  
  // Find verification request
  const verification = await Verification.findById(req.params.id);
  
  if (!verification) {
    return next(new ErrorResponse('Verification request not found', 404));
  }
  
  // Update verification status
  verification.status = status;
  verification.reviewedBy = req.user.id;
  verification.reviewedAt = Date.now();
  
  if (status === 'rejected') {
    verification.rejectionReason = rejectionReason;
  }
  
  await verification.save();
  
  // Update user verification status
  const user = await User.findById(verification.user);
  
  if (status === 'approved') {
    // Set role-specific verification flag
    const roleVerificationField = `is${user.role.charAt(0).toUpperCase() + user.role.slice(1)}Verified`;
    
    const updateData = {
      verificationStatus: 'approved'
    };
    
    updateData[roleVerificationField] = true;
    
    await User.findByIdAndUpdate(user._id, { $set: updateData });
  } else {
    // Reset verification status
    await User.findByIdAndUpdate(user._id, {
      $set: {
        verificationStatus: 'rejected',
        verificationRejectionReason: rejectionReason
      }
    });
  }
  
  // Send notification email to user
  await verificationEmails.sendVerificationStatusUpdate(verification, user);
  
  res.status(200).json({
    success: true,
    data: verification
  });
});

// @desc    Get all verification requests (admin only)
// @route   GET /api/verification
// @access  Private (Admin)
exports.getAllVerifications = asyncHandler(async (req, res, next) => {
  // Pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const startIndex = (page - 1) * limit;
  
  // Filtering
  const filter = {};
  
  if (req.query.status) {
    filter.status = req.query.status;
  }
  
  if (req.query.role) {
    // Find users with specified role
    const users = await User.find({ role: req.query.role }).select('_id');
    const userIds = users.map(user => user._id);
    filter.user = { $in: userIds };
  }
  
  // Execute query with pagination
  const verifications = await Verification
    .find(filter)
    .populate('user', 'firstName lastName email role')
    .populate('reviewedBy', 'firstName lastName email')
    .sort({ submittedAt: -1 })
    .skip(startIndex)
    .limit(limit);
  
  // Get total count for pagination
  const total = await Verification.countDocuments(filter);
  
  // Pagination result
  const pagination = {
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    total
  };
  
  res.status(200).json({
    success: true,
    pagination,
    data: verifications
  });
});

// @desc    Get verification details (admin or owner)
// @route   GET /api/verification/:id
// @access  Private (Admin or owner)
exports.getVerificationById = asyncHandler(async (req, res, next) => {
  const verification = await Verification
    .findById(req.params.id)
    .populate('user', 'firstName lastName email role')
    .populate('reviewedBy', 'firstName lastName email');
  
  if (!verification) {
    return next(new ErrorResponse('Verification request not found', 404));
  }
  
  // Check permissions - only admin or owner can view
  if (
    verification.user._id.toString() !== req.user.id && 
    req.user.role !== 'admin'
  ) {
    return next(new ErrorResponse('Not authorized to access this verification', 403));
  }
  
  res.status(200).json({
    success: true,
    data: verification
  });
});

// @desc    Delete verification request (admin only)
// @route   DELETE /api/verification/:id
// @access  Private (Admin)
exports.deleteVerification = asyncHandler(async (req, res, next) => {
  const verification = await Verification.findById(req.params.id);
  
  if (!verification) {
    return next(new ErrorResponse('Verification request not found', 404));
  }
  
  // Delete associated files from Cloudinary
  const publicIds = [];
  
  // Add document public IDs if they exist
  if (verification.idDocument?.publicId) publicIds.push(verification.idDocument.publicId);
  if (verification.businessRegistration?.publicId) publicIds.push(verification.businessRegistration.publicId);
  if (verification.proofOfAddress?.publicId) publicIds.push(verification.proofOfAddress.publicId);
  
  // Add additional documents
  if (verification.additionalDocuments && verification.additionalDocuments.length > 0) {
    verification.additionalDocuments.forEach(doc => {
      if (doc.publicId) publicIds.push(doc.publicId);
    });
  }
  
  // Delete files from Cloudinary
  try {
    for (const publicId of publicIds) {
      await cloudinaryDocs.deleteDocument(publicId);
    }
  } catch (error) {
    console.error('Error deleting files from Cloudinary:', error);
    // Continue with document deletion even if some file deletions fail
  }
  
  await verification.remove();
  
  res.status(200).json({
    success: true,
    data: {}
  });
});