// server/routes/templateRoutes.js
const express = require('express');
const { 
  getTemplates, 
  getTemplate, 
  createTemplate 
} = require('../../controllers/pitch-deck/templateController');
const { protect } = require('../../middleware/authMiddleware');

const router = express.Router();

// Get templates for a specific sector
router.get('/', protect, getTemplates);

// Get a single template
router.get('/:id', protect, getTemplate);

// Admin only: Create a new template
router.post('/', protect, createTemplate);

module.exports = router;