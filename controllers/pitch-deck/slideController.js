// controllers/slide.controller.js
const Slide = require('../../models/pitch-deck/slideModel');
const Deck = require('../../models/pitch-deck/deckModel');
const cloudinary = require('../../utils/cloudinaryDocuments');
const fs = require('fs');



/**
 * @desc    Get a slide by ID
 * @route   GET /api/slides/:id
 * @access  Private
 */
exports.getSlideById = async (req, res) => {
  try {
    const slideId = req.params.id;

    // Get slide and verify ownership via deck association
    const slide = await Slide.findById(slideId);
    
    if (!slide) {
      return res.status(404).json({ message: 'Slide not found' });
    }

    // Verify ownership through deck
    const deck = await Deck.findOne({ 
      _id: slide.deckId,
      userId: req.user._id
    });

    if (!deck) {
      return res.status(403).json({ message: 'Not authorized to access this slide' });
    }

    res.json({ slide });
  } catch (error) {
    console.error('Get slide error:', error);
    res.status(500).json({ message: 'Server error fetching slide' });
  }
};

/**
 * @desc    Update a slide
 * @route   PUT /api/slides/:id
 * @access  Private
 */
exports.updateSlide = async (req, res) => {
  try {
    const slideId = req.params.id;
    const { content, notes } = req.body;

    // Find slide
    const slide = await Slide.findById(slideId);
    
    if (!slide) {
      return res.status(404).json({ message: 'Slide not found' });
    }

    // Verify ownership through deck
    const deck = await Deck.findOne({ 
      _id: slide.deckId,
      userId: req.user._id
    });

    if (!deck) {
      return res.status(403).json({ message: 'Not authorized to update this slide' });
    }

    // Update fields if provided
    if (content !== undefined) slide.content = content;
    if (notes !== undefined) slide.notes = notes;

    // Save updated slide
    const updatedSlide = await slide.save();
    res.json({ slide: updatedSlide });
  } catch (error) {
    console.error('Update slide error:', error);
    res.status(500).json({ message: 'Server error updating slide' });
  }
};

/**
 * @desc    Middleware to check slide ownership
 * @access  Private
 */
exports.checkSlideOwnership = async (req, res, next) => {
  try {
    const slideId = req.params.id;
    
    // Find slide
    const slide = await Slide.findById(slideId);
    
    if (!slide) {
      return res.status(404).json({ message: 'Slide not found' });
    }

    // Verify ownership through deck
    const deck = await Deck.findOne({ 
      _id: slide.deckId,
      userId: req.user._id
    });

    if (!deck) {
      return res.status(403).json({ message: 'Not authorized to access this slide' });
    }

    // Attach slide to request
    req.slide = slide;
    next();
  } catch (error) {
    console.error('Check slide ownership error:', error);
    res.status(500).json({ message: 'Server error checking slide ownership' });
  }
};
















/**
 * @desc    Add a new slide to a deck
 * @route   POST /api/decks/:deckId/slides
 * @access  Private
 */
exports.addSlide = async (req, res) => {
  try {
    const { slideType, position } = req.body;
    const deckId = req.params.deckId;

    // Validate required fields
    if (!slideType) {
      return res.status(400).json({ message: 'Slide type is required' });
    }

    // Validate deck ownership (assuming middleware sets req.deck)
    if (!req.deck) {
      // If no middleware, check deck ownership manually
      const deck = await Deck.findOne({ _id: deckId, userId: req.user._id });
      if (!deck) {
        return res.status(404).json({ message: 'Deck not found or unauthorized' });
      }
    }

    // If position is not specified, add to the end
    let slidePosition = position;
    if (slidePosition === undefined) {
      // Count existing slides to determine last position
      const slidesCount = await Slide.countDocuments({ deckId });
      slidePosition = slidesCount;
    } else {
      // If position is specified, shift existing slides
      await Slide.updateMany(
        { deckId, position: { $gte: slidePosition } },
        { $inc: { position: 1 } }
      );
    }

    // Create default content based on slide type
    let defaultContent = {};
    switch (slideType) {
      case 'title':
        defaultContent = {
          title: 'Title Slide',
          subtitle: 'Click to edit subtitle'
        };
        break;
      case 'content':
        defaultContent = {
          title: 'Content Slide',
          bullets: ['Click to edit bullet point']
        };
        break;
      // Add more default content for other slide types as needed
    }

    // Create new slide
    const slide = await Slide.create({
      deckId,
      slideType,
      position: slidePosition,
      content: defaultContent,
      notes: ''
    });

    res.status(201).json({ slide });
  } catch (error) {
    console.error('Add slide error:', error);
    res.status(500).json({ message: 'Server error adding slide' });
  }
};



/**
 * @desc    Create a new slide
 * @route   POST /api/decks/:deckId/slides
 * @access  Private
 */
exports.createSlide = async (req, res) => {
  try {
    const { slideType, position, content } = req.body;
    const deckId = req.params.deckId;

    // Validate required fields
    if (!slideType) {
      return res.status(400).json({ message: 'Slide type is required' });
    }

    // Check if deck exists and belongs to user
    const deck = await Deck.findOne({ 
      _id: deckId,
      userId: req.user._id 
    });

    if (!deck) {
      return res.status(404).json({ message: 'Deck not found or unauthorized' });
    }

    // If position is specified, shift existing slides
    if (position !== undefined) {
      await Slide.updateMany(
        { deckId, position: { $gte: position } },
        { $inc: { position: 1 } }
      );
    } else {
      // If position not specified, put at the end
      const lastSlide = await Slide.findOne({ deckId })
        .sort({ position: -1 });
      
      const newPosition = lastSlide ? lastSlide.position + 1 : 0;
      req.body.position = newPosition;
    }

    // Create slide
    const slide = await Slide.create({
      deckId,
      slideType,
      position: req.body.position,
      content: content || {}
    });

    res.status(201).json(slide);
  } catch (error) {
    console.error('Create slide error:', error);
    res.status(500).json({ message: 'Server error creating slide' });
  }
};

/**
 * @desc    Delete a slide
 * @route   DELETE /api/slides/:slideId
 * @access  Private
 */
exports.deleteSlide = async (req, res) => {
  try {
    const slideId = req.params.id;

    // Find slide
    const slide = await Slide.findById(slideId);
    
    if (!slide) {
      return res.status(404).json({ message: 'Slide not found' });
    }

    // Verify ownership through deck
    const deck = await Deck.findOne({ 
      _id: slide.deckId,
      userId: req.user._id
    });

    if (!deck) {
      return res.status(403).json({ message: 'Not authorized to delete this slide' });
    }

    const deckId = slide.deckId;
    const position = slide.position;


    // Delete slide media if any
    if (slide.mediaUrls && slide.mediaUrls.length > 0) {
      for (const url of slide.mediaUrls) {
        // Extract public_id from Cloudinary URL
        const publicId = url.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(publicId);
      }
    }

    // Delete the slide
    await slide.remove();

    // Reorder remaining slides
    await Slide.updateMany(
      { deckId, position: { $gt: position } },
      { $inc: { position: -1 } }
    );

    res.json({ message: 'Slide deleted successfully' });
  } catch (error) {
    console.error('Delete slide error:', error);
    res.status(500).json({ message: 'Server error deleting slide' });
  }
};

/**
 * @desc    Upload media for a slide
 * @route   POST /api/slides/:slideId/media
 * @access  Private
 */
exports.uploadMedia = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const slide = req.slide; // Attached by middleware

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'pitch-deck-media',
    });

    // Remove the file from server after upload
    fs.unlinkSync(req.file.path);

    // Add URL to slide's mediaUrls array
    slide.mediaUrls.push(result.secure_url);
    await slide.save();

    res.json({
      url: result.secure_url,
      mediaUrls: slide.mediaUrls
    });
  } catch (error) {
    console.error('Media upload error:', error);
    
    // Remove the file if it exists
    if (req.file && req.file.path) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ message: 'Server error uploading media' });
  }
};

/**
 * @desc    Delete media from a slide
 * @route   DELETE /api/slides/:slideId/media/:mediaIndex
 * @access  Private
 */
exports.deleteMedia = async (req, res) => {
  try {
    const { mediaIndex } = req.params;
    const slide = req.slide; // Attached by middleware

    if (!slide.mediaUrls || !slide.mediaUrls[mediaIndex]) {
      return res.status(404).json({ message: 'Media not found' });
    }

    const mediaUrl = slide.mediaUrls[mediaIndex];
    
    // Extract public_id from Cloudinary URL
    const publicId = mediaUrl.split('/').pop().split('.')[0];
    
    // Delete from Cloudinary
    await cloudinary.uploader.destroy(`pitch-deck-media/${publicId}`);
    
    // Remove URL from slide's mediaUrls array
    slide.mediaUrls.splice(mediaIndex, 1);
    await slide.save();

    res.json({
      message: 'Media deleted successfully',
      mediaUrls: slide.mediaUrls
    });
  } catch (error) {
    console.error('Media delete error:', error);
    res.status(500).json({ message: 'Server error deleting media' });
  }
};