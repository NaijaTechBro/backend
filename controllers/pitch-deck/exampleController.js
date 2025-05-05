// server/controllers/exampleController.js
const Example = require('../../models/pitch-deck/exampleModel');

// Get examples for a specific slide type and sector
const getExamples = async (req, res) => {
  try {
    const { slideType, sector } = req.query;
    
    if (!slideType || !sector) {
      return res.status(400).json({ message: 'Slide type and sector are required' });
    }
    
    const examples = await Example.find({
      slideType: slideType,
      sector: sector
    }).limit(5);
    
    res.json({ examples: examples.map(ex => ex.content) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Admin only: Add a new example
const createExample = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    const { sector, slideType, content, companyName, metrics, tags } = req.body;
    
    const newExample = new Example({
      sector,
      slideType,
      content,
      companyName,
      metrics,
      tags
    });
    
    await newExample.save();
    res.status(201).json(newExample);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getExamples,
  createExample
};