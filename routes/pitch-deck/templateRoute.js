// server/routes/templateRoutes.js
const express = require('express');
const { 
  getTemplates,
  createTemplate,
  getTemplateById,
  updateTemplate,
  deleteTemplate,
  uploadThumbnail
} = require('../../controllers/pitch-deck/templateController');
const { protect } = require('../../middleware/authMiddleware');

const router = express.Router();

// Get templates for a specific sector
router.get('/templates', protect, getTemplates);

// Get a single template
router.get('/templates/:id', protect, getTemplateById);

router.put('/templates/:id', protect, updateTemplate);

router.delete('/templates/:id', protect, deleteTemplate);

router.post('/templates/:id/thumbnail', protect, uploadThumbnail);
// Admin only: Create a new template
router.post('/templates', protect, createTemplate);

module.exports = router;