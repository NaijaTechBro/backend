// server/routes/exampleRoutes.js
const express = require('express');
const { getExamples, createExample } = require('../../controllers/pitch-deck/exampleController');
const { protect } = require('../../middleware/authMiddleware');

const router = express.Router();

// Get examples for a specific slide type and sector
router.get('/', protect, getExamples);

// Admin only: Add a new example
router.post('/', protect, createExample);

module.exports = router;