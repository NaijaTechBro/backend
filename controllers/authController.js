const User = require('../models/userModel');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');

// Register a new user
exports.register = async (req, res) => {
  try {
    const { firstName, lastName, email, password, role } = req.body;
    
    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }
    
    // Validate role (admin can only be created by another admin)
    if (role === 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Cannot register as admin'
      });
    }
    
    // Create verification token
    const verificationToken = crypto.randomBytes(20).toString('hex');
    
    // Create user
    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      role: role || 'user',
      verificationToken,
      verificationTokenExpire: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
    });
    
    // Create verification URL
    const verificationUrl = `${req.protocol}://${req.get('host')}/api/auth/verify/${verificationToken}`;
    
       //send welcome mail
	const subject = "Email Verification";
	const send_to = user.email;
	const sent_from = `${process.env.GETLISTED_FROM_NAME} <${process.env.GETLISTED_FROM_EMAIL}>`;
	const reply_to = process.env.GETLISTED_FROM_EMAIL
	const template = "verification";
  const name = user.firstName;
  const link = verificationUrl;
    try {
      await sendEmail({
        subject,
        send_to,
        sent_from,
        reply_to,
        template,
        name,
        link
        
      });
      
      return res.status(201).json({
        success: true,
        message: 'User registered. Please verify your email'
      });
    } catch (err) {
      console.error("Email sending failed:", err);
      
      user.verificationToken = undefined;
      user.verificationTokenExpire = undefined;
      await user.save();
      
      return res.status(500).json({
        success: false,
        message: 'Email could not be sent'
      });
    }
  } catch (err) {
    console.error("Registration error:", err);
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// Verify email
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;
    
    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpire: { $gt: Date.now() }
    });
    
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }
    
    user.isEmailVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpire = undefined;
    await user.save();

    const loginLink = `${req.protocol}://${req.get('host')}/login`;
    
       //send welcome mail
       const subject = "Welcome to GetListed Africa!";
       const send_to = user.email;
       const sent_from = `${process.env.GETLISTED_FROM_NAME} <${process.env.GETLISTED_FROM_EMAIL}>`;
       const reply_to = process.env.GETLISTED_FROM_EMAIL
       const template = "welcome";
       const name = user.firstName;
       const link = loginLink;
    // Send welcome email after successful verification

    try {
      await sendEmail({
        subject,
        send_to,
        sent_from,
        reply_to,
        template,
        name,
        link,
      });
      
      console.log('Welcome email sent successfully');
    } catch (err) {
      console.error("Welcome email sending failed:", err);
      // We don't want to stop the verification process if welcome email fails
      // Just log the error and continue
    }
    
    return res.status(200).json({
      success: true,
      message: 'Email verified successfully'
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }
    
    // Check for user
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    // Check if password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    // Check if email is verified
    if (!user.isEmailVerified) {
      return res.status(401).json({
        success: false,
        message: 'Please verify your email before logging in'
      });
    }
    
    // Update last login
    user.lastLogin = Date.now();
    await user.save();
    
    // Generate token
    sendTokenResponse(user, 200, res);
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// Logout user
exports.logout = (req, res) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });
  
  res.status(200).json({
    success: true,
    message: 'User logged out successfully'
  });
};

// Get current logged in user
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// Update user details
exports.updateDetails = async (req, res) => {
  try {
    const fieldsToUpdate = {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      phone: req.body.phone,
      bio: req.body.bio
    };
    
    // Remove undefined fields
    Object.keys(fieldsToUpdate).forEach(key => 
      fieldsToUpdate[key] === undefined && delete fieldsToUpdate[key]
    );
    
    const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
      new: true,
      runValidators: true
    });
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// Update password
exports.updatePassword = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('+password');
    
    // Check current password
    const isMatch = await user.matchPassword(req.body.currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }
    
    user.password = req.body.newPassword;
    await user.save();
    
    sendTokenResponse(user, 200, res);
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// Forgot password
exports.forgotPassword = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No user with that email'
      });
    }
    
    // Get reset token
    const resetToken = crypto.randomBytes(20).toString('hex');
    
    // Hash token and set to resetPasswordToken field
    user.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    
    // Set expire
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
    
    await user.save();
    
    // Create reset URL
    const resetUrl = `${req.protocol}://${req.get('host')}/api/auth/reset-password/${resetToken}`;
    
    const subject = "Password Reset";
    const send_to = user.email;
    const sent_from = `${process.env.GETLISTED_FROM_NAME} <${process.env.GETLISTED_FROM_EMAIL}>`;
    const reply_to = process.env.GETLISTED_FROM_EMAIL
    const template = "reset-password";
    const name = user.firstName;
    const link = resetUrl;
  
    try {
      await sendEmail({
        subject,
        send_to,
        sent_from,
        reply_to,
        template,
        name,
        link,
      });
      
      res.status(200).json({
        success: true,
        message: 'Email sent'
      });
    } catch (err) {
      console.error("Password reset email error:", err);
      
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      
      await user.save();
      
      return res.status(500).json({
        success: false,
        message: 'Email could not be sent'
      });
    }
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// Reset password
exports.resetPassword = async (req, res) => {
  try {
    // Get hashed token
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.resetToken)
      .digest('hex');
    
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });
    
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }
    
    // Set new password
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();
    
    sendTokenResponse(user, 200, res);
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// Helper function to get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
  // Create token
  const token = user.getSignedJwtToken();
  
  const options = {
    expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000),
    httpOnly: true
  };
  
  if (process.env.NODE_ENV === 'production') {
    options.secure = true;
  }
  
  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role
      }
    });
};