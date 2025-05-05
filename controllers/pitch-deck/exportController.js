// server/controllers/exportController.js
const Deck = require('../../models/pitch-deck/deckModel');
const PresentationExporter = require('../../utils/presentationExporter');
const path = require('path');
const fs = require('fs');

const exporter = new PresentationExporter();

// Export a deck to a specific format
const exportDeck = async (req, res) => {
  try {
    const { deckId, format } = req.body;
    
    if (!deckId || !format) {
      return res.status(400).json({ message: 'Deck ID and format are required' });
    }
    
    const deck = await Deck.findOne({
      _id: deckId,
      userId: req.user.id
    });
    
    if (!deck) {
      return res.status(404).json({ message: 'Deck not found' });
    }
    
    // Temporary file path
    const tempDir = path.join(__dirname, '../temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    const outputPath = path.join(tempDir, `${deck.title.replace(/\s+/g, '_')}_${Date.now()}.${format}`);
    
    // Export based on format
    switch (format) {
      case 'pptx':
        await exporter.exportToPPTX(deck, outputPath);
        break;
      case 'pdf':
        await exporter.exportToPDF(deck, outputPath);
        break;
      case 'html':
        await exporter.exportToHTML(deck, outputPath);
        break;
      default:
        return res.status(400).json({ message: 'Unsupported format' });
    }
    
    // Send file to client
    res.download(outputPath, `${deck.title}.${format}`, (err) => {
      if (err) {
        console.error('Download error:', err);
      }
      
      // Delete temp file after download
      fs.unlink(outputPath, (unlinkErr) => {
        if (unlinkErr) {
          console.error('Error deleting temp file:', unlinkErr);
        }
      });
    });
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ message: 'Error exporting deck' });
  }
};

module.exports = {
  exportDeck
};