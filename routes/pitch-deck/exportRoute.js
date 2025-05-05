// server/routes/exportRoutes.js
const express = require('express');
const { exportDeck } = require('../../controllers/pitch-deck/exportController');
const protect = require('../../middleware/authMiddleware');

const router = express.Router();

// Export a deck to a specific format
router.post('/', protect, exportDeck);

module.exports = router;