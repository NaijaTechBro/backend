// controllers/export.controller.js
const Deck = require('../../models/pitch-deck/deckModel');
const Slide = require('../../models/pitch-deck/slideModel');
const pptxgenjs = require('pptxgenjs');
const PDFDocument = require('pdfkit');
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const cloudinary = require('../../utils/cloudinaryDocuments');
const { nanoid } = require('nanoid');

/**
 * Generate a unique filename for exports
 */
const generateExportFilename = (deckTitle, format) => {
  const sanitizedTitle = deckTitle.replace(/[^a-z0-9]/gi, '-').toLowerCase();
  const timestamp = Date.now();
  return `${sanitizedTitle}-${timestamp}.${format}`;
};

/**
 * @desc    Export deck as PDF
 * @route   POST /api/export/pdf/:deckId
 * @access  Private
 */
exports.exportPDF = async (req, res) => {
  try {
    const deckId = req.params.deckId;
    const { quality = 'medium', includeNotes = false } = req.body;
    
    // Get deck and verify ownership
    const deck = await Deck.findOne({
      _id: deckId,
      userId: req.user._id,
    });
    
    if (!deck) {
      return res.status(404).json({ message: 'Deck not found or unauthorized' });
    }
    
    // Get all slides for the deck
    const slides = await Slide.find({ deckId })
      .sort({ position: 1 });
    
    if (slides.length === 0) {
      return res.status(400).json({ message: 'Deck has no slides to export' });
    }
    
    // Create PDF document
    const pdfQuality = {
      low: { size: [800, 450], imageQuality: 0.7 },
      medium: { size: [1024, 576], imageQuality: 0.85 },
      high: { size: [1920, 1080], imageQuality: 1.0 }
    }[quality];
    
    const pdf = new PDFDocument({
      size: pdfQuality.size,
      margin: 0,
      autoFirstPage: false
    });
    
    // Generate filename
    const filename = generateExportFilename(deck.title, 'pdf');
    const filePath = path.join(__dirname, '../exports', filename);
    
    // Ensure exports directory exists
    if (!fs.existsSync(path.join(__dirname, '../exports'))) {
      fs.mkdirSync(path.join(__dirname, '../exports'), { recursive: true });
    }
    
    // Create write stream
    const writeStream = fs.createWriteStream(filePath);
    pdf.pipe(writeStream);
    
    // Process slides
    for (const slide of slides) {
      pdf.addPage();
      
      // Render slide content
      // This is a simplified version - in a real implementation, 
      // you would render different slide types differently
      pdf.fontSize(32).text(deck.title, 50, 50);
      
      if (slide.content.title) {
        pdf.fontSize(24).text(slide.content.title, 50, 100);
      }
      
      if (slide.content.subtitle) {
        pdf.fontSize(18).text(slide.content.subtitle, 50, 140);
      }
      
      if (slide.content.text) {
        pdf.fontSize(14).text(slide.content.text, 50, 180);
      }
      
      // Add notes if requested
      if (includeNotes && slide.notes) {
        pdf.fontSize(10).text('Notes: ' + slide.notes, 50, pdfQuality.size[1] - 50);
      }
      
      // Process slide media (simplified)
      // In a real implementation, you would handle images properly
    }
    
    // Finalize PDF
    pdf.end();
    
    // Wait for PDF to be fully written
    writeStream.on('finish', async () => {
      try {
        // Upload to Cloudinary
        const result = await cloudinary.uploader.upload(filePath, {
          folder: 'pitch-deck-exports',
          resource_type: 'raw'
        });
        
        // Delete local file
        fs.unlinkSync(filePath);
        
        // Return download URL
        res.json({
          downloadUrl: result.secure_url,
          format: 'pdf'
        });
      } catch (uploadError) {
        console.error('PDF upload error:', uploadError);
        res.status(500).json({ message: 'Error uploading PDF' });
      }
    });
    
    writeStream.on('error', (err) => {
      console.error('PDF write error:', err);
      res.status(500).json({ message: 'Error writing PDF file' });
    });
  } catch (error) {
    console.error('PDF export error:', error);
    res.status(500).json({ message: 'Server error exporting to PDF' });
  }
};

/**
 * @desc    Export deck as PPTX
 * @route   POST /api/export/pptx/:deckId
 * @access  Private
 */
exports.exportPPTX = async (req, res) => {
  try {
    const deckId = req.params.deckId;
    const { quality = 'medium', includeNotes = false } = req.body;
    
    // Get deck and verify ownership
    const deck = await Deck.findOne({
      _id: deckId,
      userId: req.user._id,
    });
    
    if (!deck) {
      return res.status(404).json({ message: 'Deck not found or unauthorized' });
    }
    
    // Get all slides for the deck
    const slides = await Slide.find({ deckId })
      .sort({ position: 1 });
    
    if (slides.length === 0) {
      return res.status(400).json({ message: 'Deck has no slides to export' });
    }
    
    // Create PPTX
    const pptx = new pptxgenjs();
    
    // Set metadata
    pptx.title = deck.title;
    pptx.author = req.user.name;
    pptx.subject = deck.description;
    
    // Process slides
    for (const slide of slides) {
      const pptxSlide = pptx.addSlide();
      
      // Add content based on slide type
      switch (slide.slideType) {
        case 'title':
          pptxSlide.addText(slide.content.title || deck.title, {
            x: '10%', y: '40%', w: '80%', h: '20%',
            fontSize: 44, align: 'center', bold: true
          });
          
          if (slide.content.subtitle) {
            pptxSlide.addText(slide.content.subtitle, {
              x: '10%', y: '60%', w: '80%', h: '10%',
              fontSize: 24, align: 'center'
            });
          }
          break;
        
        case 'content':
          if (slide.content.title) {
            pptxSlide.addText(slide.content.title, {
              x: '5%', y: '5%', w: '90%', h: '10%',
              fontSize: 24, bold: true
            });
          }
          
          if (slide.content.text) {
            pptxSlide.addText(slide.content.text, {
              x: '5%', y: '20%', w: '90%', h: '70%',
              fontSize: 18
            });
          }
          break;
        
        case 'bullets':
          if (slide.content.title) {
            pptxSlide.addText(slide.content.title, {
              x: '5%', y: '5%', w: '90%', h: '10%',
              fontSize: 24, bold: true
            });
          }
          
          if (slide.content.bullets && Array.isArray(slide.content.bullets)) {
            pptxSlide.addText(
              slide.content.bullets.map(b => `• ${b}`).join('\n'),
              { x: '5%', y: '20%', w: '90%', h: '70%', fontSize: 18 }
            );
          }
          break;
          
        // Add more slide types as needed
        case 'problem':
          pptxSlide.addText(slide.content.title || "Problem Statement", {
            x: '5%', y: '5%', w: '90%', h: '10%',
            fontSize: 24, bold: true
          });
          
          if (slide.content.painPoints && Array.isArray(slide.content.painPoints)) {
            pptxSlide.addText(
              slide.content.painPoints.map(p => `• ${p}`).join('\n'),
              { x: '5%', y: '20%', w: '90%', h: '30%', fontSize: 18 }
            );
          }
          
          if (slide.content.impactStatement) {
            pptxSlide.addText(slide.content.impactStatement, {
              x: '5%', y: '55%', w: '90%', h: '15%',
              fontSize: 18, italic: true
            });
          }
          break;
          
        case 'solution':
          pptxSlide.addText(slide.content.title || "Our Solution", {
            x: '5%', y: '5%', w: '90%', h: '10%',
            fontSize: 24, bold: true
          });
          
          if (slide.content.description) {
            pptxSlide.addText(slide.content.description, {
              x: '5%', y: '20%', w: '90%', h: '15%',
              fontSize: 18
            });
          }
          
          if (slide.content.keyFeatures && Array.isArray(slide.content.keyFeatures)) {
            pptxSlide.addText(
              slide.content.keyFeatures.map(f => `• ${f}`).join('\n'),
              { x: '5%', y: '40%', w: '90%', h: '30%', fontSize: 18 }
            );
          }
          
          if (slide.content.uniqueValue) {
            pptxSlide.addText(slide.content.uniqueValue, {
              x: '5%', y: '75%', w: '90%', h: '15%',
              fontSize: 18, bold: true
            });
          }
          break;
          
        case 'market':
          pptxSlide.addText(slide.content.title || "Market Opportunity", {
            x: '5%', y: '5%', w: '90%', h: '10%',
            fontSize: 24, bold: true
          });
          
          if (slide.content.marketSize) {
            pptxSlide.addText(`Market Size: ${slide.content.marketSize}`, {
              x: '5%', y: '20%', w: '90%', h: '10%',
              fontSize: 18, bold: true
            });
          }
          
          if (slide.content.segments && Array.isArray(slide.content.segments)) {
            pptxSlide.addText(
              "Key Segments:\n" + slide.content.segments.map(s => `• ${s}`).join('\n'),
              { x: '5%', y: '35%', w: '90%', h: '25%', fontSize: 18 }
            );
          }
          
          if (slide.content.trends && Array.isArray(slide.content.trends)) {
            pptxSlide.addText(
              "Market Trends:\n" + slide.content.trends.map(t => `• ${t}`).join('\n'),
              { x: '5%', y: '65%', w: '90%', h: '25%', fontSize: 18 }
            );
          }
          break;
        
        default:
          // Generic fallback for unknown slide types
          if (slide.content.title) {
            pptxSlide.addText(slide.content.title, {
              x: '5%', y: '5%', w: '90%', h: '10%',
              fontSize: 24, bold: true
            });
          }
          
          if (slide.content.text) {
            pptxSlide.addText(slide.content.text, {
              x: '5%', y: '20%', w: '90%', h: '70%',
              fontSize: 18
            });
          }
      }
      
      // Add notes if requested
      if (includeNotes && slide.notes) {
        pptxSlide.addNotes(slide.notes);
      }
      
      // Add media (simplified)
      // In a real implementation, you would handle this more thoroughly
      if (slide.mediaUrls && slide.mediaUrls.length > 0) {
        // For simplicity, just add the first image
        try {
          pptxSlide.addImage({
            path: slide.mediaUrls[0],
            x: '60%', y: '60%',
            w: '30%', h: '30%'
          });
        } catch (imgError) {
          console.error('Error adding image to slide:', imgError);
        }
      }
    }
    
    // Generate filename
    const filename = generateExportFilename(deck.title, 'pptx');
    const filePath = path.join(__dirname, '../exports', filename);
    
    // Ensure exports directory exists
    if (!fs.existsSync(path.join(__dirname, '../exports'))) {
      fs.mkdirSync(path.join(__dirname, '../exports'), { recursive: true });
    }
    
    // Write PPTX file
    pptx.writeFile({ fileName: filePath })
      .then(async () => {
        try {
          // Upload to Cloudinary
          const result = await cloudinary.uploader.upload(filePath, {
            folder: 'pitch-deck-exports',
            resource_type: 'raw'
          });
          
          // Delete local file
          fs.unlinkSync(filePath);
          
          // Return download URL
          res.json({
            downloadUrl: result.secure_url,
            format: 'pptx'
          });
        } catch (uploadError) {
          console.error('PPTX upload error:', uploadError);
          res.status(500).json({ message: 'Error uploading PPTX' });
        }
      })
      .catch(writeError => {
        console.error('PPTX write error:', writeError);
        res.status(500).json({ message: 'Error writing PPTX file' });
      });
  } catch (error) {
    console.error('PPTX export error:', error);
    res.status(500).json({ message: 'Server error exporting to PPTX' });
  }
};

/**
 * @desc    Export deck to Google Slides
 * @route   POST /api/export/google-slides/:deckId
 * @access  Private
 */
exports.exportGoogleSlides = async (req, res) => {
  try {
    const deckId = req.params.deckId;
    
    // Get deck and verify ownership
    const deck = await Deck.findOne({
      _id: deckId,
      userId: req.user._id,
    });
    
    if (!deck) {
      return res.status(404).json({ message: 'Deck not found or unauthorized' });
    }
    
    // Get all slides for the deck
    const slides = await Slide.find({ deckId })
      .sort({ position: 1 });
    
    if (slides.length === 0) {
      return res.status(400).json({ message: 'Deck has no slides to export' });
    }
    
    // Check if user has Google OAuth credentials
    if (!req.user.googleAccessToken) {
      return res.status(400).json({ 
        message: 'Google authentication required',
        authRequired: true
      });
    }
    
    // Create OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
    
    oauth2Client.setCredentials({
      access_token: req.user.googleAccessToken,
      refresh_token: req.user.googleRefreshToken
    });
    
    // Initialize Google Slides API
    const slides_api = google.slides({ version: 'v1', auth: oauth2Client });
    const drive_api = google.drive({ version: 'v3', auth: oauth2Client });
    
    // Create a new presentation
    const presentation = await slides_api.presentations.create({
      requestBody: {
        title: deck.title
      }
    });
    
    const presentationId = presentation.data.presentationId;
    
    // Create requests for batch update
    let requests = [];
    
    // Delete the default slide
    requests.push({
      deleteObject: {
        objectId: presentation.data.slides[0].objectId
      }
    });
    
    // Add slides
    for (const slide of slides) {
      // Create slide
      const slideId = `slide_${nanoid(8)}`;
      
      requests.push({
        createSlide: {
          objectId: slideId,
          insertionIndex: slide.position,
          slideLayoutReference: {
            predefinedLayout: 'BLANK'
          }
        }
      });
      
      // Add title
      if (slide.content.title) {
        const titleId = `title_${nanoid(8)}`;
        requests.push({
          createShape: {
            objectId: titleId,
            shapeType: 'TEXT_BOX',
            elementProperties: {
              pageObjectId: slideId,
              size: {
                width: { magnitude: 600, unit: 'PT' },
                height: { magnitude: 50, unit: 'PT' }
              },
              transform: {
                scaleX: 1,
                scaleY: 1,
                translateX: 30,
                translateY: 30,
                unit: 'PT'
              }
            }
          }
        });
        
        requests.push({
          insertText: {
            objectId: titleId,
            text: slide.content.title
          }
        });
        
        requests.push({
          updateTextStyle: {
            objectId: titleId,
            style: {
              fontFamily: 'Arial',
              fontSize: { magnitude: 24, unit: 'PT' },
              bold: true
            },
            fields: 'fontFamily,fontSize,bold'
          }
        });
      }
      
      // Add content based on slide type
      switch (slide.slideType) {
        case 'title':
          if (slide.content.subtitle) {
            const subtitleId = `subtitle_${nanoid(8)}`;
            requests.push({
              createShape: {
                objectId: subtitleId,
                shapeType: 'TEXT_BOX',
                elementProperties: {
                  pageObjectId: slideId,
                  size: {
                    width: { magnitude: 600, unit: 'PT' },
                    height: { magnitude: 50, unit: 'PT' }
                  },
                  transform: {
                    scaleX: 1,
                    scaleY: 1,
                    translateX: 30,
                    translateY: 100,
                    unit: 'PT'
                  }
                }
              }
            });
            
            requests.push({
              insertText: {
                objectId: subtitleId,
                text: slide.content.subtitle
              }
            });
            
            requests.push({
              updateTextStyle: {
                objectId: subtitleId,
                style: {
                  fontFamily: 'Arial',
                  fontSize: { magnitude: 18, unit: 'PT' },
                  italic: true
                },
                fields: 'fontFamily,fontSize,italic'
              }
            });
          }
          break;
        
        case 'bullets':
          if (slide.content.bullets && Array.isArray(slide.content.bullets)) {
            const bulletId = `bullets_${nanoid(8)}`;
            requests.push({
              createShape: {
                objectId: bulletId,
                shapeType: 'TEXT_BOX',
                elementProperties: {
                  pageObjectId: slideId,
                  size: {
                    width: { magnitude: 600, unit: 'PT' },
                    height: { magnitude: 300, unit: 'PT' }
                  },
                  transform: {
                    scaleX: 1,
                    scaleY: 1,
                    translateX: 30,
                    translateY: 100,
                    unit: 'PT'
                  }
                }
              }
            });
            
            requests.push({
              insertText: {
                objectId: bulletId,
                text: slide.content.bullets.join('\n')
              }
            });
            
            // Add bullet formatting
            for (let i = 0; i < slide.content.bullets.length; i++) {
              if (i > 0) {
                // Add paragraph bullet for all but the first bullet
                requests.push({
                  createParagraphBullets: {
                    objectId: bulletId,
                    textRange: {
                      startIndex: slide.content.bullets.slice(0, i).join('\n').length + 1,
                      endIndex: slide.content.bullets.slice(0, i + 1).join('\n').length + 1
                    },
                    bulletPreset: 'BULLET_DISC_CIRCLE_SQUARE'
                  }
                });
              } else {
                // Add bullet for the first bullet
                requests.push({
                  createParagraphBullets: {
                    objectId: bulletId,
                    textRange: {
                      startIndex: 0,
                      endIndex: slide.content.bullets[0].length
                    },
                    bulletPreset: 'BULLET_DISC_CIRCLE_SQUARE'
                  }
                });
              }
            }
          }
          break;
          
        case 'content':
          if (slide.content.text) {
            const contentId = `content_${nanoid(8)}`;
            requests.push({
              createShape: {
                objectId: contentId,
                shapeType: 'TEXT_BOX',
                elementProperties: {
                  pageObjectId: slideId,
                  size: {
                    width: { magnitude: 600, unit: 'PT' },
                    height: { magnitude: 300, unit: 'PT' }
                  },
                  transform: {
                    scaleX: 1,
                    scaleY: 1,
                    translateX: 30,
                    translateY: 100,
                    unit: 'PT'
                  }
                }
              }
            });
            
            requests.push({
              insertText: {
                objectId: contentId,
                text: slide.content.text
              }
            });
          }
          break;
          
        // Add other slide types as needed
      }
      
      // Add notes if available
      if (slide.notes) {
        requests.push({
          createShape: {
            objectId: `notes_${nanoid(8)}`,
            shapeType: 'TEXT_BOX',
            elementProperties: {
              pageObjectId: slideId,
              size: {
                width: { magnitude: 600, unit: 'PT' },
                height: { magnitude: 50, unit: 'PT' }
              },
              transform: {
                scaleX: 1,
                scaleY: 1,
                translateX: 30,
                translateY: 400,
                unit: 'PT'
              }
            }
          }
        });
      }
    }
    
    // Send the batch update
    if (requests.length > 0) {
      await slides_api.presentations.batchUpdate({
        presentationId,
        requestBody: {
          requests
        }
      });
    }
    
    // Get shareable link
    const response = await drive_api.permissions.create({
      fileId: presentationId,
      requestBody: {
        role: 'reader',
        type: 'anyone'
      }
    });
    
    // Get presentation details
    const file = await drive_api.files.get({
      fileId: presentationId,
      fields: 'webViewLink'
    });
    
    res.json({
      presentationId,
      viewUrl: file.data.webViewLink,
      format: 'google-slides'
    });
  } catch (error) {
    console.error('Google Slides export error:', error);
    
    // Handle token expiration
    if (error.code === 401) {
      return res.status(401).json({
        message: 'Google authentication expired',
        authRequired: true
      });
    }
    
    res.status(500).json({
      message: 'Server error exporting to Google Slides',
      error: error.message
    });
  }
};

/**
 * @desc    Check user's Google OAuth status
 * @route   GET /api/export/check-google-auth
 * @access  Private
 */
exports.checkGoogleAuth = async (req, res) => {
  try {
    if (!req.user.googleAccessToken) {
      return res.json({
        authenticated: false
      });
    }
    
    // Create OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
    
    oauth2Client.setCredentials({
      access_token: req.user.googleAccessToken,
      refresh_token: req.user.googleRefreshToken
    });
    
    // Test the connection
    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    await drive.files.list({
      pageSize: 1,
      fields: 'files(id, name)'
    });
    
    return res.json({
      authenticated: true,
      email: req.user.googleEmail
    });
  } catch (error) {
    console.error('Google auth check error:', error);
    
    return res.json({
      authenticated: false,
      error: error.message
    });
  }
};