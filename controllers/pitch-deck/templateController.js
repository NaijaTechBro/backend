// controllers/template.controller.js
const Template = require('../../models/pitch-deck/templateModel');
const cloudinary = require('../../utils/cloudinaryDocuments');
const fs = require('fs');

/**
 * @desc    Get all templates
 * @route   GET /api/templates
 * @access  Private
 */
exports.getTemplates = async (req, res) => {
  try {
    // Get system templates and user's own templates
    const templates = await Template.find({
      $or: [
        { isSystem: true },
        { creatorId: req.user._id }
      ]
    });
    
    res.json(templates);
  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({ message: 'Server error fetching templates' });
  }
};

/**
 * @desc    Create a new template
 * @route   POST /api/templates
 * @access  Private
 */
exports.createTemplate = async (req, res) => {
  try {
    const { name, slides } = req.body;

    // Validate required fields
    if (!name || !slides) {
      return res.status(400).json({ message: 'Name and slides are required' });
    }

    // Create template
    const template = await Template.create({
      name,
      creatorId: req.user._id,
      isSystem: req.user.role === 'admin' && req.body.isSystem ? true : false,
      slides
    });

    res.status(201).json(template);
  } catch (error) {
    console.error('Create template error:', error);
    res.status(500).json({ message: 'Server error creating template' });
  }
};

/**
 * @desc    Get template by ID
 * @route   GET /api/templates/:id
 * @access  Private
 */
exports.getTemplateById = async (req, res) => {
  try {
    // Template is attached to req by checkTemplateOwnership middleware
    const template = req.template;
    res.json(template);
  } catch (error) {
    console.error('Get template by ID error:', error);
    res.status(500).json({ message: 'Server error fetching template' });
  }
};

/**
 * @desc    Update template
 * @route   PUT /api/templates/:id
 * @access  Private
 */
exports.updateTemplate = async (req, res) => {
  try {
    const { name, slides, isSystem } = req.body;
    const template = req.template;

    // Update fields if provided
    if (name !== undefined) template.name = name;
    if (slides !== undefined) template.slides = slides;
    
    // Only admins can set isSystem flag
    if (isSystem !== undefined && req.user.role === 'admin') {
      template.isSystem = isSystem;
    }

    // Save updated template
    const updatedTemplate = await template.save();
    res.json(updatedTemplate);
  } catch (error) {
    console.error('Update template error:', error);
    res.status(500).json({ message: 'Server error updating template' });
  }
};

/**
 * @desc    Delete template
 * @route   DELETE /api/templates/:id
 * @access  Private
 */
exports.deleteTemplate = async (req, res) => {
  try {
    const template = req.template;

    // Prevent deletion of system templates by non-admins
    if (template.isSystem && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete system templates' });
    }

    // Delete thumbnail if exists
    if (template.thumbnailUrl) {
      const publicId = template.thumbnailUrl.split('/').pop().split('.')[0];
      await cloudinary.uploader.destroy(`pitch-deck-thumbnails/${publicId}`);
    }

    // Delete the template
    await template.remove();

    res.json({ message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Delete template error:', error);
    res.status(500).json({ message: 'Server error deleting template' });
  }
};

/**
 * @desc    Upload template thumbnail
 * @route   POST /api/templates/:id/thumbnail
 * @access  Private
 */
exports.uploadThumbnail = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const template = req.template;

    // Delete old thumbnail if exists
    if (template.thumbnailUrl) {
      const publicId = template.thumbnailUrl.split('/').pop().split('.')[0];
      await cloudinary.uploader.destroy(`pitch-deck-thumbnails/${publicId}`);
    }

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'pitch-deck-thumbnails',
    });

    // Remove the file from server after upload
    fs.unlinkSync(req.file.path);

    // Update template with new thumbnail URL
    template.thumbnailUrl = result.secure_url;
    await template.save();

    res.json({
      thumbnailUrl: result.secure_url
    });
  } catch (error) {
    console.error('Thumbnail upload error:', error);
    
    // Remove the file if it exists
    if (req.file && req.file.path) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ message: 'Server error uploading thumbnail' });
  }
};