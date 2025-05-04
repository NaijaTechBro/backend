const sendEmail = require('./sendEmail');

/**
 * Send notification email to admin when a new verification request is submitted
 * @param {Object} verification - Verification document
 * @param {Object} user - User document
 * @returns {Promise}
 */
exports.sendVerificationRequestNotification = async (verification, user) => {
  try {
    const subject = `New Verification Request - ${user.firstName} ${user.lastName}`;
    
    // Admin email should be configured in environment variables
    const adminEmail = process.env.GETLISTED_ADMIN_EMAIL || 'admin@getlisted.site';
    
    // Generate admin dashboard link
    const adminDashboardLink = `${process.env.FRONTEND_URL}/admin/verification/${verification._id}`;
    
    return await sendEmail({
      subject,
      send_to: adminEmail,
      sent_from: process.env.GETLISTED_EMAIL_USER,
      reply_to: process.env.GETLISTED_EMAIL_USER,
      template: 'verification-request',  // Create this template in your emails directory
      name: 'Admin',
      link: adminDashboardLink
    });
  } catch (error) {
    console.error('Error sending verification request notification:', error);
    // Don't throw the error as it's not critical to the verification process
    return false;
  }
};

/**
 * Send verification status update email to user
 * @param {Object} verification - Verification document
 * @param {Object} user - User document
 * @returns {Promise}
 */
exports.sendVerificationStatusUpdate = async (verification, user) => {
  try {
    // Determine template and subject based on verification status
    let template, subject;
    
    if (verification.status === 'approved') {
      template = 'verification-approved';
      subject = 'Your Verification Request Has Been Approved';
    } else {
      template = 'verification-rejected';
      subject = 'Your Verification Request Has Been Rejected';
    }
    
    // Generate dashboard link for the user
    const dashboardLink = `${process.env.FRONTEND_URL}/dashboard`;
    
    return await sendEmail({
      subject,
      send_to: user.email,
      sent_from: process.env.GETLISTED_EMAIL_USER,
      reply_to: process.env.GETLISTED_EMAIL_USER,
      template,  // Create these templates in your emails directory
      name: user.firstName,
      link: dashboardLink
    });
  } catch (error) {
    console.error('Error sending verification status update email:', error);
    // Don't throw the error as it's not critical to the verification process
    return false;
  }
};