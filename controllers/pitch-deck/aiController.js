const { OpenAI } = require('openai');
const Example = require('../../models/pitch-deck/exampleModel');
const Template = require('../../models/pitch-deck/templateModel');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Get AI suggestions for a slide
const getSuggestions = async (req, res) => {
  try {
    const { sector, slideType, currentContent } = req.body;
    
    if (!sector || !slideType) {
      return res.status(400).json({ message: 'Sector and slide type are required' });
    }
    
    // Get examples for this slide type and sector
    const examples = await Example.find({ 
      sector, 
      slideType 
    }).limit(3);
    
    // Get template for this slide type and sector
    const template = await Template.findOne({ 
      sector, 
      'slides.slideType': slideType 
    });
    
    let templateContent = '';
    if (template) {
      const slide = template.slides.find(s => s.slideType === slideType);
      if (slide) {
        templateContent = slide.content;
      }
    }
    
    // Create prompt for OpenAI
    let prompt = `Create content for a "${slideType}" slide in a pitch deck for a ${sector} startup in Africa.\n\n`;
    
    if (currentContent) {
      prompt += `The current content is: "${currentContent}"\n\n`;
    }
    
    if (templateContent) {
      prompt += `Based on this template: "${templateContent}"\n\n`;
    }
    
    if (examples.length > 0) {
      prompt += "Here are some examples from successful African startups:\n\n";
      examples.forEach((example, index) => {
        prompt += `Example ${index + 1}: "${example.content}"\n\n`;
      });
    }
    
    prompt += "Please provide well-structured, compelling content that would resonate with investors in Africa. Include placeholders for key metrics and statistics that the founder should fill in. Format with proper HTML for a presentation slide.";
    
    // Call OpenAI API
    const completion = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: prompt,
      max_tokens: 1000,
      temperature: 0.7,
    });
    
    const suggestions = completion.data.choices[0].text?.trim() || "";
    
    res.json({ suggestions });
  } catch (error) {
    console.error('AI suggestion error:', error);
    res.status(500).json({ message: 'Error generating AI suggestions' });
  }
};

// Generate complete pitch deck with AI
const generateDeck = async (req, res) => {
  try {
    const { sector, companyName, description, problemStatement } = req.body;
    
    if (!sector || !companyName) {
      return res.status(400).json({ message: 'Sector and company name are required' });
    }
    
    // Get template for this sector
    const template = await Template.findOne({ 
      sector,
      isDefault: true
    });
    
    if (!template) {
      return res.status(404).json({ message: 'Template not found for this sector' });
    }
    
    // Initialize deck structure based on template
    const deckStructure = template.slides.map(slide => ({
      id: slide.slideType,
      title: slide.title,
      content: '', // To be filled by AI
      notes: '',
      order: slide.order,
      template: slide.content
    }));
    
    // Create base prompt for OpenAI
    const basePrompt = `Generate content for a pitch deck for an African ${sector} startup named "${companyName}".
    
${description ? `Company description: ${description}` : ''}
${problemStatement ? `Problem being solved: ${problemStatement}` : ''}

Create compelling, investor-focused content for each slide. Include realistic but fictional metrics and traction data appropriate for an early-stage African ${sector} startup.`;
    
    // Generate content for each slide
    const completedSlides = await Promise.all(deckStructure.map(async (slide) => {
      try {
        const slidePrompt = `${basePrompt}
        
This is for the "${slide.title}" slide.
Template guidance: ${slide.template}

Generate concise, well-structured content in HTML format that would make a compelling slide.`;
        
        const completion = await openai.createCompletion({
          model: "text-davinci-003",
          prompt: slidePrompt,
          max_tokens: 600,
          temperature: 0.7,
        });
        
        return {
          ...slide,
          content: completion.data.choices[0].text?.trim() || slide.template
        };
      } catch (error) {
        console.error(`Error generating content for slide ${slide.title}:`, error);
        return slide;
      }
    }));
    
    res.json({ slides: completedSlides });
  } catch (error) {
    console.error('AI deck generation error:', error);
    res.status(500).json({ message: 'Error generating AI pitch deck' });
  }
};

module.exports = {
  getSuggestions,
  generateDeck
};