// server/controllers/waitlistController.js
const Waitlist = require('../models/waitlistModel');
const sendEmail = require('../utils/sendEmail');

// Join waitlist
exports.joinWaitlist = async (req, res) => {
  try {
    const { email, firstName, lastName, role, reason } = req.body;
    
    // Check if email already exists in waitlist
    const existingEntry = await Waitlist.findOne({ email });
    
    if (existingEntry) {
      return res.status(400).json({
        success: false,
        message: 'Email already on waitlist'
      });
    }
    
    // Create waitlist entry
    const waitlistEntry = await Waitlist.create({
      email,
      firstName,
      lastName,
      role,
      reason
    });
    
    // Send confirmation email
    const subject = "Welcome to GetListed Africa Waitlist";
    const send_to = email;
    const sent_from = `${process.env.GETLISTED_FROM_NAME} <${process.env.GETLISTED_FROM_EMAIL}>`;
    const reply_to = process.env.GETLISTED_FROM_EMAIL;
    const template = "waitlist-confirmation";
    const name = firstName;
    
    try {
      await sendEmail({
        subject,
        send_to,
        sent_from,
        reply_to,
        template,
        name
      });
    } catch (err) {
      console.error("Waitlist confirmation email failed:", err);
      // Continue even if email fails
    }
    
    res.status(201).json({
      success: true,
      message: 'Successfully joined waitlist',
      data: waitlistEntry
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// Get all waitlist entries (admin only)
exports.getWaitlist = async (req, res) => {
  try {
    // Ensure only admins can access waitlist
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access waitlist'
      });
    }
    
    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const startIndex = (page - 1) * limit;
    const total = await Waitlist.countDocuments();
    
    // Get waitlist entries
    const entries = await Waitlist.find()
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit);
    
    // Pagination result
    const pagination = {};
    
    if (startIndex + limit < total) {
      pagination.next = {
        page: page + 1,
        limit
      };
    }
    
    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit
      };
    }
    
    res.status(200).json({
      success: true,
      count: entries.length,
      pagination,
      total,
      data: entries
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// Approve waitlist entry (admin only)
exports.approveWaitlistEntry = async (req, res) => {
  try {
    // Ensure only admins can approve waitlist entries
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to approve waitlist entries'
      });
    }
    
    const entry = await Waitlist.findById(req.params.id);
    
    if (!entry) {
      return res.status(404).json({
        success: false,
        message: 'Waitlist entry not found'
      });
    }
    
    // Update status
    entry.status = 'approved';
    entry.approvedAt = Date.now();
    entry.approvedBy = req.user.id;
    await entry.save();
    
    // Send approval email with registration link
    const registrationLink = `${process.env.FRONTEND_URL}/register?email=${entry.email}`;
    
    const subject = "You're Invited to Join GetListed Africa!";
    const send_to = entry.email;
    const sent_from = `${process.env.GETLISTED_FROM_NAME} <${process.env.GETLISTED_FROM_EMAIL}>`;
    const reply_to = process.env.GETLISTED_FROM_EMAIL;
    const template = "waitlist-approval";
    const name = entry.firstName;
    const link = registrationLink;
    
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
    } catch (err) {
      console.error("Waitlist approval email failed:", err);
      
      return res.status(500).json({
        success: false,
        message: 'Email could not be sent, but entry was approved'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Waitlist entry approved and email sent',
      data: entry
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// Delete waitlist entry (admin only)
exports.deleteWaitlistEntry = async (req, res) => {
  try {
    // Ensure only admins can delete waitlist entries
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete waitlist entries'
      });
    }
    
    const entry = await Waitlist.findById(req.params.id);
    
    if (!entry) {
      return res.status(404).json({
        success: false,
        message: 'Waitlist entry not found'
      });
    }
    
    await entry.remove();
    
    res.status(200).json({
      success: true,
      message: 'Waitlist entry deleted',
      data: {}
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// Export waitlist to CSV (admin only)
exports.exportWaitlist = async (req, res) => {
  try {
    // Ensure only admins can export waitlist
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to export waitlist'
      });
    }
    
    const entries = await Waitlist.find().sort({ createdAt: -1 });
    
    // Create CSV header
    let csv = 'Email,First Name,Last Name,Role,Reason,Status,Created At\n';
    
    // Add rows
    entries.forEach(entry => {
      csv += `"${entry.email}","${entry.firstName}","${entry.lastName}","${entry.role}","${entry.reason}","${entry.status}","${entry.createdAt}"\n`;
    });
    
    // Set response headers for file download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=waitlist.csv');
    
    // Send CSV as response
    res.status(200).send(csv);
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};