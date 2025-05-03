const User = require('../models/userModel');
const sendEmail = require('../utils/sendEmail');
const { uploadToCloudinary } = require('../utils/cloudinary'); // Assuming you use Cloudinary for file uploads

// Submit documents for role verification
exports.submitRoleVerification = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    // Check if user is a founder or investor
    if (user.role !== 'founder' && user.role !== 'investor') {
      return res.status(400).json({
        success: false,
        message: 'Only founders and investors require role verification'
      });
    }
    
    // Check current verification status
    if (user.isRoleVerified) {
      return res.status(400).json({
        success: false,
        message: 'Your account is already verified'
      });
    }
    
    if (user.roleVerificationStatus === 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Your verification is already in progress'
      });
    }
    
    // Get uploaded files
    const { idDocument, businessRegistration, proofOfAddress } = req.files || {};
    
    // Validate required documents
    if (!idDocument) {
      return res.status(400).json({
        success: false,
        message: 'ID document is required'
      });
    }
    
    if (user.role === 'founder' && !businessRegistration) {
      return res.status(400).json({
        success: false,
        message: 'Business registration document is required for founders'
      });
    }
    
    if (!proofOfAddress) {
      return res.status(400).json({
        success: false,
        message: 'Proof of address is required'
      });
    }
    
    // Upload documents to cloud storage
    const uploadPromises = [];
    let uploadedDocuments = {};
    
    if (idDocument) {
      uploadPromises.push(
        uploadToCloudinary(idDocument.path, 'verification_documents')
          .then(result => {
            uploadedDocuments.idDocument = result.secure_url;
          })
      );
    }
    
    if (businessRegistration) {
      uploadPromises.push(
        uploadToCloudinary(businessRegistration.path, 'verification_documents')
          .then(result => {
            uploadedDocuments.businessRegistration = result.secure_url;
          })
      );
    }
    
    if (proofOfAddress) {
      uploadPromises.push(
        uploadToCloudinary(proofOfAddress.path, 'verification_documents')
          .then(result => {
            uploadedDocuments.proofOfAddress = result.secure_url;
          })
      );
    }
    
    // Handle additional documents if any
    if (req.files.additionalDocuments) {
      const additionalDocs = Array.isArray(req.files.additionalDocuments) 
        ? req.files.additionalDocuments 
        : [req.files.additionalDocuments];
      
      uploadedDocuments.additionalDocuments = [];
      
      for (const doc of additionalDocs) {
        uploadPromises.push(
          uploadToCloudinary(doc.path, 'verification_documents')
            .then(result => {
              uploadedDocuments.additionalDocuments.push(result.secure_url);
            })
        );
      }
    }
    
    // Wait for all uploads to complete
    await Promise.all(uploadPromises);
    
    // Update user record
    user.roleVerificationDocuments = {
      idDocument: uploadedDocuments.idDocument || null,
      businessRegistration: uploadedDocuments.businessRegistration || null,
      proofOfAddress: uploadedDocuments.proofOfAddress || null,
      additionalDocuments: uploadedDocuments.additionalDocuments || []
    };
    
    user.roleVerificationStatus = 'pending';
    user.roleVerificationSubmittedAt = Date.now();
    
    await user.save();
    
    // Notify admin about new verification request
    try {
      await sendEmail({
        subject: `New ${user.role} verification request`,
        send_to: process.env.ADMIN_EMAIL,
        sent_from: `${process.env.GETLISTED_FROM_NAME} <${process.env.GETLISTED_FROM_EMAIL}>`,
        reply_to: process.env.GETLISTED_FROM_EMAIL,
        template: "admin-notification",
        name: "Admin",
        data: {
          message: `A new verification request has been submitted by ${user.firstName} ${user.lastName} (${user.email}) for the role of ${user.role}.`,
          userId: user._id.toString()
        }
      });
    } catch (err) {
      console.error("Admin notification email failed:", err);
      // Continue despite email failure
    }
    
    return res.status(200).json({
      success: true,
      message: 'Verification documents submitted successfully. Your verification is in progress.'
    });
  } catch (err) {
    console.error("Role verification submission error:", err);
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// Check verification status
exports.checkVerificationStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    return res.status(200).json({
      success: true,
      data: {
        isRoleVerified: user.isRoleVerified,
        roleVerificationStatus: user.roleVerificationStatus,
        roleVerificationSubmittedAt: user.roleVerificationSubmittedAt,
        roleVerificationApprovedAt: user.roleVerificationApprovedAt,
        roleVerificationRejectedAt: user.roleVerificationRejectedAt,
        roleVerificationRejectionReason: user.roleVerificationRejectionReason
      }
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// Admin: Get all pending verification requests
exports.getPendingVerifications = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access'
      });
    }
    
    const pendingVerifications = await User.find({
      roleVerificationStatus: 'pending'
    }).select('firstName lastName email role roleVerificationDocuments roleVerificationSubmittedAt');
    
    return res.status(200).json({
      success: true,
      count: pendingVerifications.length,
      data: pendingVerifications
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// Admin: Approve verification request
exports.approveVerification = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access'
      });
    }
    
    const { userId } = req.params;
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    if (user.roleVerificationStatus !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'User verification is not pending'
      });
    }
    
    // Update user verification status
    user.isRoleVerified = true;
    user.roleVerificationStatus = 'approved';
    user.roleVerificationApprovedAt = Date.now();
    
    await user.save();
    
    // Send approval email to user
    try {
      await sendEmail({
        subject: "Your account has been verified",
        send_to: user.email,
        sent_from: `${process.env.GETLISTED_FROM_NAME} <${process.env.GETLISTED_FROM_EMAIL}>`,
        reply_to: process.env.GETLISTED_FROM_EMAIL,
        template: "verification-approved",
        name: user.firstName,
        data: {
          role: user.role
        }
      });
    } catch (err) {
      console.error("Verification approval email failed:", err);
      // Continue despite email failure
    }
    
    return res.status(200).json({
      success: true,
      message: 'User verification approved successfully'
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// Admin: Reject verification request
exports.rejectVerification = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access'
      });
    }
    
    const { userId } = req.params;
    const { reason } = req.body;
    
    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    if (user.roleVerificationStatus !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'User verification is not pending'
      });
    }
    
    // Update user verification status
    user.isRoleVerified = false;
    user.roleVerificationStatus = 'rejected';
    user.roleVerificationRejectedAt = Date.now();
    user.roleVerificationRejectionReason = reason;
    
    await user.save();
    
    // Send rejection email to user
    try {
      await sendEmail({
        subject: "Your verification request was not approved",
        send_to: user.email,
        sent_from: `${process.env.GETLISTED_FROM_NAME} <${process.env.GETLISTED_FROM_EMAIL}>`,
        reply_to: process.env.GETLISTED_FROM_EMAIL,
        template: "verification-rejected",
        name: user.firstName,
        data: {
          reason: reason,
          role: user.role
        }
      });
    } catch (err) {
      console.error("Verification rejection email failed:", err);
      // Continue despite email failure
    }
    
    return res.status(200).json({
      success: true,
      message: 'User verification rejected successfully'
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};