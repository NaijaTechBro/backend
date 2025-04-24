// server/controllers/connectionController.js
const Connection = require('../models/connectionModel');
const Startup = require('../models/startupModel');
const User = require('../models/userModel');

// Request a connection to a startup
exports.requestConnection = async (req, res) => {
  try {
    const { startupId, message } = req.body;
    
    // Check if startup exists
    const startup = await Startup.findById(startupId);
    if (!startup) {
      return res.status(404).json({
        success: false,
        message: 'Startup not found',
      });
    }
    
    // Check if user already has a connection with this startup
    const existingConnection = await Connection.findOne({
      user: req.user.id,
      startup: startupId
    });
    
    if (existingConnection) {
      return res.status(400).json({
        success: false,
        message: 'You already have a connection request with this startup'
      });
    }
    
    // Create connection request
    const connection = await Connection.create({
      user: req.user.id,
      startup: startupId,
      founderUser: startup.createdBy,
      message,
      status: 'pending'
    });
    
    // Populate user and startup data
    const populatedConnection = await Connection.findById(connection._id)
      .populate({
        path: 'user',
        select: 'firstName lastName email profilePicture role'
      })
      .populate({
        path: 'startup',
        select: 'name description logo'
      });
    
    res.status(201).json({
      success: true,
      data: populatedConnection
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// Get all connections for a user (as requester)
exports.getUserConnections = async (req, res) => {
  try {
    const connections = await Connection.find({ user: req.user.id })
      .populate({
        path: 'startup',
        select: 'name description logo'
      })
      .populate({
        path: 'founderUser',
        select: 'firstName lastName email profilePicture'
      })
      .sort('-createdAt');
    
    res.status(200).json({
      success: true,
      count: connections.length,
      data: connections
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// Get all connection requests for a founder's startups
exports.getStartupConnections = async (req, res) => {
  try {
    // First find all startups owned by this user
    const startups = await Startup.find({ createdBy: req.user.id }).select('_id');
    const startupIds = startups.map(startup => startup._id);
    
    // Find all connection requests for these startups
    const connections = await Connection.find({ startup: { $in: startupIds } })
      .populate({
        path: 'user',
        select: 'firstName lastName email profilePicture role'
      })
      .populate({
        path: 'startup',
        select: 'name description logo'
      })
      .sort('-createdAt');
    
    res.status(200).json({
      success: true,
      count: connections.length,
      data: connections
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// Get connections for a specific startup (founder only)
exports.getConnectionsForStartup = async (req, res) => {
  try {
    const startup = await Startup.findById(req.params.startupId);
    
    if (!startup) {
      return res.status(404).json({
        success: false,
        message: 'Startup not found'
      });
    }
    
    // Check if user is the founder of this startup
    if (startup.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to view these connections'
      });
    }
    
    const connections = await Connection.find({ startup: req.params.startupId })
      .populate({
        path: 'user',
        select: 'firstName lastName email profilePicture role'
      })
      .sort('-createdAt');
    
    res.status(200).json({
      success: true,
      count: connections.length,
      data: connections
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// Accept or reject a connection request (founder only)
exports.updateConnectionStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be either accepted or rejected'
      });
    }
    
    const connection = await Connection.findById(req.params.connectionId);
    
    if (!connection) {
      return res.status(404).json({
        success: false,
        message: 'Connection request not found'
      });
    }
    
    // Get the startup associated with this connection
    const startup = await Startup.findById(connection.startup);
    
    if (!startup) {
      return res.status(404).json({
        success: false,
        message: 'Startup not found'
      });
    }
    
    // Check if user is the founder of this startup
    if (startup.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to update this connection'
      });
    }
    
    connection.status = status;
    connection.respondedAt = Date.now();
    await connection.save();
    
    const updatedConnection = await Connection.findById(connection._id)
      .populate({
        path: 'user',
        select: 'firstName lastName email profilePicture role'
      })
      .populate({
        path: 'startup',
        select: 'name description logo'
      });
    
    res.status(200).json({
      success: true,
      data: updatedConnection
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// Delete a connection (both requester and founder can delete)
exports.deleteConnection = async (req, res) => {
  try {
    const connection = await Connection.findById(req.params.connectionId);
    
    if (!connection) {
      return res.status(404).json({
        success: false,
        message: 'Connection not found'
      });
    }
    
    // Get the startup for this connection
    const startup = await Startup.findById(connection.startup);
    
    if (!startup) {
      return res.status(404).json({
        success: false,
        message: 'Startup not found'
      });
    }
    
    // Check authorization - either the requester or the founder can delete
    if (
      connection.user.toString() !== req.user.id && 
      startup.createdBy.toString() !== req.user.id && 
      req.user.role !== 'admin'
    ) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to delete this connection'
      });
    }
    
    await connection.remove();
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};