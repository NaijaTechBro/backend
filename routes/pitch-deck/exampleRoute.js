// server/routes/exampleRoutes.js
const express = require('express');
const { getExamples, getExampleById, createExample, updateExample, deleteExample, createDeckFromExample } = require('../../controllers/pitch-deck/exampleController');
const { protect } = require('../../middleware/authMiddleware');

const router = express.Router();

// Get examples for a specific slide type and sector
router.get('/examples', protect, getExamples);

router.get('/examples/:id', protect, getExampleById);

router.post('/examples/:id/create-deck', protect, createDeckFromExample)

// Admin only: Add a new example
router.post('/examples', protect, createExample);

router.put('examples/:id', protect, updateExample);

router.delete('/examples/:id', protect, deleteExample);



module.exports = router;