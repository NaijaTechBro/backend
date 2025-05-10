// controllers/ai.controller.js
const Slide = require('../../models/pitch-deck/slideModel');
const Deck = require('../../models/pitch-deck/deckModel');
const { OpenAI } = require('openai');
const { processIndustryPrompt, processSlideOptimization, processImprovementSuggestions, 
       processSuggestionApplication, processDeckStructureGeneration } = require('../../utils/ai-prompts');

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * @desc    Generate content for a slide
 * @route   POST /api/ai/generate-content
 * @access  Private
 */
exports.generateContent = async (req, res) => {
  try {
    const { deckId, slideType, prompt, industry } = req.body;
    
    // Verify deck ownership
    const deck = await Deck.findOne({
      _id: deckId,
      userId: req.user._id,
    });
    
    if (!deck) {
      return res.status(403).json({ message: 'Not authorized to access this deck' });
    }
    
    // Prepare the prompt based on slide type and input parameters
    const aiPrompt = processIndustryPrompt(slideType, {
      industry,
      prompt,
      tone: 'professional',
    });
    
    // Call OpenAI API
    const completion = await openai.createChatCompletion({
      model: "gpt-4-turbo",
      messages: [
        {
          role: "system",
          content: "You are an expert pitch deck creator that generates high-quality content for slide presentations. Provide content in JSON format that can be directly used in a slide."
        },
        { 
          role: "user", 
          content: aiPrompt 
        }
      ],
      temperature: 0.7,
    });
    
    // Parse the AI response
    const aiContent = completion.data.choices[0].message.content;
    let parsedContent;
    
    try {
      parsedContent = JSON.parse(aiContent);
    } catch (e) {
      // If parsing fails, try to extract JSON from the response
      const jsonStart = aiContent.indexOf('{');
      const jsonEnd = aiContent.lastIndexOf('}');
      if (jsonStart >= 0 && jsonEnd >= 0) {
        try {
          parsedContent = JSON.parse(aiContent.substring(jsonStart, jsonEnd + 1));
        } catch (e2) {
          // If still fails, return raw text
          parsedContent = { text: aiContent };
        }
      } else {
        parsedContent = { text: aiContent };
      }
    }
    
    res.json({
      content: parsedContent
    });
  } catch (error) {
    console.error('AI content generation error:', error);
    res.status(500).json({ message: 'Failed to generate content' });
  }
};

/**
 * @desc    Optimize a slide's content and layout
 * @route   POST /api/ai/optimize-slide
 * @access  Private
 */
exports.optimizeSlide = async (req, res) => {
  try {
    const { slideId, currentContent } = req.body;
    
    // Get slide and verify ownership
    const slide = await Slide.findById(slideId);
    if (!slide) {
      return res.status(404).json({ message: 'Slide not found' });
    }
    
    // Get the deck to verify ownership
    const deck = await Deck.findOne({
      _id: slide.deckId,
      userId: req.user._id,
    });
    
    if (!deck) {
      return res.status(403).json({ message: 'Not authorized to access this slide' });
    }
    
    // Prepare the prompt for slide optimization
    const prompt = processSlideOptimization(slide.slideType, currentContent);
    
    // Call OpenAI API
    const completion = await openai.createChatCompletion({
      model: "gpt-4-turbo",
      messages: [
        {
          role: "system",
          content: "You are an expert in creating effective, visually appealing, and impactful presentation slides. Optimize the given slide content to improve clarity, impact, and persuasiveness."
        },
        { 
          role: "user", 
          content: prompt 
        }
      ],
      temperature: 0.7,
    });
    
    // Parse the AI response
    const aiContent = completion.data.choices[0].message.content;
    let optimizedContent;
    
    try {
      optimizedContent = JSON.parse(aiContent);
    } catch (e) {
      // If parsing fails, try to extract JSON from the response
      const jsonStart = aiContent.indexOf('{');
      const jsonEnd = aiContent.lastIndexOf('}');
      if (jsonStart >= 0 && jsonEnd >= 0) {
        try {
          optimizedContent = JSON.parse(aiContent.substring(jsonStart, jsonEnd + 1));
        } catch (e2) {
          // If still fails, return error
          return res.status(500).json({ message: 'Failed to parse AI response' });
        }
      } else {
        return res.status(500).json({ message: 'Failed to get proper JSON response from AI' });
      }
    }
    
    // Update slide with optimized content
    slide.content = optimizedContent;
    await slide.save();
    
    res.json({
      optimizedContent,
      message: 'Slide optimized successfully'
    });
  } catch (error) {
    console.error('AI slide optimization error:', error);
    res.status(500).json({ message: 'Failed to optimize slide' });
  }
};

/**
 * @desc    Get improvement suggestions for a deck or slide
 * @route   POST /api/ai/suggest-improvements
 * @access  Private
 */
exports.suggestImprovements = async (req, res) => {
  try {
    const { deckId, slideId } = req.body;
    
    // Get deck and verify ownership
    const deck = await Deck.findOne({
      _id: deckId,
      userId: req.user._id,
    });
    
    if (!deck) {
      return res.status(404).json({ message: 'Deck not found or unauthorized' });
    }
    
    // If slideId is provided, focus on that slide
    if (slideId) {
      const slide = await Slide.findOne({ _id: slideId, deckId });
      if (!slide) {
        return res.status(404).json({ message: 'Slide not found' });
      }
      
      const prompt = processImprovementSuggestions({
        title: deck.title,
        description: deck.description,
        slides: [{
          type: slide.slideType,
          position: slide.position,
          content: slide.content,
          notes: slide.notes
        }],
        forSingleSlide: true
      });
      
      const completion = await openai.createChatCompletion({
        model: "gpt-4-turbo",
        messages: [
          {
            role: "system",
            content: "You are an expert pitch deck consultant who provides valuable feedback to improve slides. Analyze the slide content to provide specific, actionable improvements."
          },
          { 
            role: "user", 
            content: prompt 
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      });
      
      const suggestions = completion.data.choices[0].message.content.split('\n').filter(s => s.trim());
      
      res.json({
        suggestions
      });
    } else {
      // Get all slides for the deck
      const slides = await Slide.find({ deckId })
        .sort({ position: 1 });
      
      if (slides.length === 0) {
        return res.status(400).json({ message: 'Deck has no slides to analyze' });
      }
      
      // Prepare the deck structure for analysis
      const deckStructure = {
        title: deck.title,
        description: deck.description,
        slides: slides.map(slide => ({
          type: slide.slideType,
          position: slide.position,
          content: slide.content,
          notes: slide.notes
        }))
      };
      
      // Prepare the prompt for improvement suggestions
      const prompt = processImprovementSuggestions(deckStructure);
      
      // Call OpenAI API
      const completion = await openai.createChatCompletion({
        model: "gpt-4-turbo",
        messages: [
          {
            role: "system",
            content: "You are an expert pitch deck consultant who provides valuable feedback to improve pitch decks. Analyze the deck structure and content to provide specific, actionable improvements."
          },
          { 
            role: "user", 
            content: prompt 
          }
        ],
        temperature: 0.7,
        max_tokens: 1500
      });
      
      // Return the suggestions as an array
      const suggestions = completion.data.choices[0].message.content.split('\n').filter(s => s.trim());
      
      res.json({
        suggestions
      });
    }
  } catch (error) {
    console.error('AI improvement suggestions error:', error);
    res.status(500).json({ message: 'Failed to get suggestions' });
  }
};

/**
 * @desc    Apply a specific suggestion to a slide or deck
 * @route   POST /api/ai/apply-suggestion
 * @access  Private
 */
exports.applySuggestion = async (req, res) => {
  try {
    const { deckId, slideId, suggestionId } = req.body;
    
    // Get deck and verify ownership
    const deck = await Deck.findOne({
      _id: deckId,
      userId: req.user._id,
    });
    
    if (!deck) {
      return res.status(404).json({ message: 'Deck not found or unauthorized' });
    }
    
    // Get saved suggestions for this deck or slide (in a real implementation, these would be stored in a database)
    // For this example, we'll assume the suggestionId is the actual suggestion text
    const suggestion = suggestionId;
    
    let targetSlide, slides;
    if (slideId) {
      // Apply suggestion to a specific slide
      targetSlide = await Slide.findOne({ _id: slideId, deckId });
      if (!targetSlide) {
        return res.status(404).json({ message: 'Slide not found' });
      }
      
      slides = [targetSlide];
    } else {
      // Apply suggestion to the entire deck
      slides = await Slide.find({ deckId }).sort({ position: 1 });
      if (slides.length === 0) {
        return res.status(400).json({ message: 'Deck has no slides to update' });
      }
    }
    
    // Prepare prompt for applying the suggestion
    const prompt = processSuggestionApplication({
      suggestion,
      slides: slides.map(slide => ({
        id: slide._id,
        type: slide.slideType,
        position: slide.position,
        content: slide.content
      })),
      forSingleSlide: !!slideId
    });
    
    // Call OpenAI API
    const completion = await openai.createChatCompletion({
      model: "gpt-4-turbo",
      messages: [
        {
          role: "system",
          content: "You are an expert at applying improvements to presentation slides. Apply the given suggestion by modifying the slide content."
        },
        { 
          role: "user", 
          content: prompt 
        }
      ],
      temperature: 0.5,
    });
    
    // Process and apply changes
    const aiResponse = completion.data.choices[0].message.content;
    let updatedContent;
    
    try {
      updatedContent = JSON.parse(aiResponse);
    } catch (e) {
      // Try to extract JSON if not directly parseable
      const jsonStart = aiResponse.indexOf('{');
      const jsonEnd = aiResponse.lastIndexOf('}');
      if (jsonStart >= 0 && jsonEnd >= 0) {
        try {
          updatedContent = JSON.parse(aiResponse.substring(jsonStart, jsonEnd + 1));
        } catch (e2) {
          return res.status(500).json({ message: 'Failed to parse AI response' });
        }
      } else {
        return res.status(500).json({ message: 'Failed to get proper JSON response from AI' });
      }
    }
    
    // Apply updates to the slide(s)
    if (slideId) {
      // Update a single slide
      targetSlide.content = updatedContent;
      await targetSlide.save();
      
      res.json({
        message: 'Suggestion applied successfully',
        updatedSlideId: targetSlide._id,
        updatedContent
      });
    } else {
      // Update multiple slides
      // This would depend on how the API is structured to return updates for multiple slides
      // For this example, we'll assume the API returns an object with slide IDs as keys
      for (const slideId in updatedContent) {
        const slide = slides.find(s => s._id.toString() === slideId);
        if (slide) {
          slide.content = updatedContent[slideId];
          await slide.save();
        }
      }
      
      res.json({
        message: 'Suggestion applied to multiple slides',
        updatedSlides: Object.keys(updatedContent)
      });
    }
  } catch (error) {
    console.error('AI apply suggestion error:', error);
    res.status(500).json({ message: 'Failed to apply suggestion' });
  }
};

/**
 * @desc    Generate entire deck structure based on a theme or topic
 * @route   POST /api/ai/generate-deck-structure
 * @access  Private
 */
exports.generateDeckStructure = async (req, res) => {
  try {
    const { topic, industry, slides } = req.body;
    
    // Set default slides number if not provided
    const slideCount = slides || 10;
    
    // Prepare prompt for generating deck structure
    const prompt = processDeckStructureGeneration({
      topic,
      industry,
      slideCount
    });
    
    // Call OpenAI API
    const completion = await openai.createChatCompletion({
      model: "gpt-4-turbo",
      messages: [
        {
          role: "system",
          content: "You are an expert pitch deck strategist who can create comprehensive deck structures tailored to specific industries and topics. Create a well-structured deck outline with appropriate slide types."
        },
        { 
          role: "user", 
          content: prompt 
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });
    
    const aiResponse = completion.data.choices[0].message.content;
    let structure;
    
    try {
      structure = JSON.parse(aiResponse);
    } catch (e) {
      // Try to extract JSON if not directly parseable
      const jsonStart = aiResponse.indexOf('{');
      const jsonEnd = aiResponse.lastIndexOf('}');
      if (jsonStart >= 0 && jsonEnd >= 0) {
        try {
          structure = JSON.parse(aiResponse.substring(jsonStart, jsonEnd + 1));
        } catch (e2) {
          structure = {
            title: `${topic} Presentation`,
            slides: []
          };
        }
      } else {
        structure = {
          title: `${topic} Presentation`,
          slides: []
        };
      }
    }
    
    res.json({
      structure,
      message: 'Deck structure generated successfully'
    });
  } catch (error) {
    console.error('AI deck structure generation error:', error);
    res.status(500).json({ message: 'Failed to generate deck structure' });
  }
};