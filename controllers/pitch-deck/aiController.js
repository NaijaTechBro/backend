// controllers/ai.controller.js
const Slide = require('../../models/pitch-deck/slideModel');
const Deck = require('../../models/pitch-deck/deckModel');
const { OpenAI } = require('openai');
const { processIndustryPrompt, processSlideOptimization, processImprovementSuggestions } = require('../../utils/ai-prompts');

// Initialize OpenAI

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * @desc    Generate content for a slide
 * @route   POST /api/ai/generate-content/:slideId
 * @access  Private
 */
exports.generateContent = async (req, res) => {
  try {
    const slideId = req.params.slideId;
    const { industry, target, keyPoints, tone } = req.body;
    
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
    
    // Prepare the prompt based on slide type and input parameters
    const prompt = processIndustryPrompt(slide.slideType, {
      industry,
      target,
      keyPoints,
      tone: tone || 'professional',
      slideContent: slide.content
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
          content: prompt 
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
    
    // Update slide with generated content
    slide.content = parsedContent;
    await slide.save();
    
    res.json({
      content: parsedContent,
      rawResponse: aiContent
    });
  } catch (error) {
    console.error('AI content generation error:', error);
    res.status(500).json({ message: 'Server error generating content' });
  }
};

/**
 * @desc    Optimize a slide's content and layout
 * @route   POST /api/ai/optimize-slide/:slideId
 * @access  Private
 */
exports.optimizeSlide = async (req, res) => {
  try {
    const slideId = req.params.slideId;
    
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
    const prompt = processSlideOptimization(slide.slideType, slide.content);
    
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
      content: optimizedContent,
      message: 'Slide optimized successfully'
    });
  } catch (error) {
    console.error('AI slide optimization error:', error);
    res.status(500).json({ message: 'Server error optimizing slide' });
  }
};

/**
 * @desc    Get improvement suggestions for a deck
 * @route   POST /api/ai/suggest-improvements/:deckId
 * @access  Private
 */
exports.suggestImprovements = async (req, res) => {
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
      max_tokens: 2000
    });
    
    // Return the suggestions
    const suggestions = completion.data.choices[0].message.content;
    
    res.json({
      suggestions,
      deckAnalysis: {
        slideCount: slides.length,
        slideTypes: [...new Set(slides.map(s => s.slideType))]
      }
    });
  } catch (error) {
    console.error('AI improvement suggestions error:', error);
    res.status(500).json({ message: 'Server error generating improvement suggestions' });
  }
};




