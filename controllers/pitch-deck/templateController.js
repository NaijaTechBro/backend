// server/controllers/templateController.js
const Template = require('../../models/pitch-deck/templateModel');

// Get templates for a specific sector
const getTemplates = async (req, res) => {
  try {
    const { sector } = req.query;
    
    const query = sector ? { sector: sector } : {};
    
    const templates = await Template.find(query);
    res.json(templates);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get a single template
const getTemplate = async (req, res) => {
  try {
    const template = await Template.findById(req.params.id);
    
    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }
    
    res.json(template);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Admin only: Create a new template
const createTemplate = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    const { name, sector, description, slides, isDefault } = req.body;
    
    const newTemplate = new Template({
      name,
      sector,
      description,
      slides,
      isDefault
    });
    
    await newTemplate.save();
    res.status(201).json(newTemplate);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getTemplates,
  getTemplate,
  createTemplate
};