// server/routes/connections.js
const express = require('express');
const {
  requestConnection,
  getUserConnections,
  getStartupConnections,
  getConnectionsForStartup,
  updateConnectionStatus,
  deleteConnection
} = require('../controllers/startup/connectionController');

const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// All connection routes require authentication
router.use(protect);

// Request a new connection
router.post('/', requestConnection);

// Get user's connections (as requester)
router.get('/user', getUserConnections);

// Get all connections for founder's startups
router.get('/founder', getStartupConnections);

// Get connections for a specific startup (founder only)
router.get('/startup/:startupId', getConnectionsForStartup);

// Update connection status (accept/reject)
router.put('/:connectionId', updateConnectionStatus);

// Delete a connection
router.delete('/:connectionId', deleteConnection);

module.exports = router;