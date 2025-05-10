/**
 * @file ai-prompts.js
 * @desc Utility functions for generating AI prompts for pitch deck content
 */

/**
 * Generate a prompt for slide content based on industry and slide type
 * @param {string} slideType - Type of slide (e.g., 'intro', 'problem', 'solution')
 * @param {Object} params - Parameters for the prompt
 * @param {string} params.industry - Industry sector
 * @param {string} params.target - Target audience
 * @param {string} params.keyPoints - Key points to cover
 * @param {string} params.tone - Tone of the content
 * @param {Object} params.slideContent - Existing slide content
 * @returns {string} - Formatted prompt for the AI
 */
exports.processIndustryPrompt = (slideType, params) => {
    const { industry, target, keyPoints, tone, slideContent } = params;
    
    // Base structure for different slide types
    const slideStructures = {
      intro: {
        title: "Create a compelling introduction slide",
        format: `{
          "title": "Brief, compelling title",
          "subtitle": "Supporting statement",
          "tagline": "Optional tagline or mission statement",
          "visualSuggestion": "Suggestion for visual element"
        }`
      },
      problem: {
        title: "Create a problem statement slide",
        format: `{
          "title": "Problem statement",
          "painPoints": ["3-4 key pain points"],
          "statistics": ["1-2 relevant statistics if applicable"],
          "impactStatement": "Statement on market/customer impact",
          "visualSuggestion": "Suggestion for visual element"
        }`
      },
      solution: {
        title: "Create a solution slide",
        format: `{
          "title": "Solution overview",
          "description": "Brief description of solution",
          "keyFeatures": ["3-4 key features/benefits"],
          "uniqueValue": "Unique value proposition",
          "visualSuggestion": "Suggestion for visual element"
        }`
      },
      market: {
        title: "Create a market analysis slide",
        format: `{
          "title": "Market opportunity",
          "marketSize": "Total addressable market size",
          "segments": ["2-3 key market segments"],
          "trends": ["2-3 market trends"],
          "visualSuggestion": "Suggestion for chart or visual"
        }`
      },
      competition: {
        title: "Create a competitive analysis slide",
        format: `{
          "title": "Competitive landscape",
          "competitors": ["3-4 main competitors"],
          "advantages": ["3-4 competitive advantages"],
          "differentiators": "Key differentiator statement",
          "visualSuggestion": "Suggestion for comparison table or quadrant"
        }`
      },
      business_model: {
        title: "Create a business model slide",
        format: `{
          "title": "Business model",
          "revenueStreams": ["2-3 revenue streams"],
          "pricingStrategy": "Pricing strategy overview",
          "customerAcquisition": "Customer acquisition approach",
          "visualSuggestion": "Suggestion for business model visualization"
        }`
      },
      traction: {
        title: "Create a traction slide",
        format: `{
          "title": "Traction & milestones",
          "metrics": ["3-4 key growth metrics"],
          "milestones": ["3-4 achieved milestones"],
          "upcomingGoals": ["2-3 upcoming goals"],
          "visualSuggestion": "Suggestion for growth chart or timeline"
        }`
      },
      team: {
        title: "Create a team slide",
        format: `{
          "title": "Our team",
          "teamMembers": [
            {"name": "Example Name", "role": "Role", "background": "Brief background"}
          ],
          "advisors": "Optional advisor mentions",
          "visualSuggestion": "Suggestion for team presentation"
        }`
      },
      financials: {
        title: "Create a financials slide",
        format: `{
          "title": "Financial projections",
          "revenue": "Revenue highlights/projections",
          "costs": "Cost structure overview",
          "breakeven": "Break-even point",
          "fundingNeeds": "Funding requirements",
          "visualSuggestion": "Suggestion for financial chart"
        }`
      },
      call_to_action: {
        title: "Create a call to action slide",
        format: `{
          "title": "Next steps",
          "ask": "Clear ask statement",
          "benefits": ["2-3 partnership/investment benefits"],
          "contactInfo": "Placeholder for contact information",
          "visualSuggestion": "Suggestion for visual element"
        }`
      }
    };
  
    // Default to intro slide if type not found
    const slideInfo = slideStructures[slideType] || slideStructures.intro;
    
    // Format the existing content for context if available
    let existingContentText = "";
    if (slideContent && Object.keys(slideContent).length > 0) {
      existingContentText = `\n\nExisting slide content for reference (modify and improve this):\n${JSON.stringify(slideContent, null, 2)}`;
    }
  
    // Build the prompt
    return `${slideInfo.title} for a ${industry} company targeting ${target || "businesses/customers"}.
  
  Key points to include:
  ${keyPoints || "Focus on clarity, impact, and relevance to the industry"}
  
  Tone: ${tone || "professional"}
  
  Please provide content in the following JSON format:
  ${slideInfo.format}
  
  Make sure the content is:
  1. Concise and impactful - avoid fluff
  2. Specific to the ${industry} industry
  3. Relevant to the ${target || "target"} audience
  4. Actionable and clear
  5. Suitable for a presentation slide (not too text-heavy)${existingContentText}`;
  };
  
  /**
   * Generate a prompt for optimizing slide content
   * @param {string} slideType - Type of slide
   * @param {Object} content - Current slide content
   * @returns {string} - Formatted prompt for the AI
   */
  exports.processSlideOptimization = (slideType, content) => {
    return `Please optimize the following ${slideType} slide content to make it more impactful, clear, and persuasive:
  
  ${JSON.stringify(content, null, 2)}
  
  Specifically:
  1. Make titles and headlines more concise and compelling
  2. Reduce text where possible without losing key information
  3. Ensure bullet points are parallel in structure and impactful
  4. Suggest better visual elements if applicable
  5. Enhance the overall persuasiveness and clarity
  
  Return the optimized content in the same JSON structure, maintaining all existing fields.`;
  };
  
  /**
   * Generate a prompt for suggesting improvements to an entire deck
   * @param {Object} deckStructure - Structure of the deck with all slides
   * @returns {string} - Formatted prompt for the AI
   */
  exports.processImprovementSuggestions = (deckStructure) => {
    const isSingleSlide = deckStructure.forSingleSlide || false;
    
    if (isSingleSlide) {
      const slide = deckStructure.slides[0];
      return `Please analyze this individual slide and provide specific, actionable improvements:
      
      Slide Type: ${slide.type}
      Position in Deck: ${slide.position || "N/A"}
      
      Content:
      ${JSON.stringify(slide.content, null, 2)}
      
      ${slide.notes ? `Notes: ${slide.notes}` : ""}
      
      Please provide 5-7 specific, actionable improvements for this slide focusing on:
      1. Content clarity and impact
      2. Visual presentation
      3. Persuasiveness and messaging
      4. Alignment with likely pitch objectives
      5. Text reduction without losing meaning
      
      Format your suggestions as a list of clear, actionable recommendations that can be directly implemented.`;
    }
    
    return `Please analyze this pitch deck and provide specific, actionable improvements:
  
  Deck Title: ${deckStructure.title}
  Description: ${deckStructure.description}
  
  Slide Structure:
  ${JSON.stringify(deckStructure.slides.map(s => ({
      position: s.position,
      type: s.type,
      content: s.content
    })), null, 2)}
  
  Please provide feedback on:
  1. Overall narrative flow and storytelling
  2. Content gaps or redundancies
  3. Slide-specific improvements (identify by position/type)
  4. Suggestions for better visual elements
  5. Ways to enhance persuasiveness for investors/stakeholders
  
  Format your response as a numbered list of 10-15 specific, actionable suggestions that can be implemented directly. Each suggestion should be a single sentence or short paragraph.`;
  };
  
  /**
   * Generate a prompt for creating a new slide template
   * @param {string} slideType - Type of slide to create
   * @param {Object} params - Parameters for the slide
   * @returns {string} - Formatted prompt for the AI
   */
  exports.processSlideTemplateCreation = (slideType, params) => {
    const { industry, purpose } = params;
    
    return `Create a template for a ${slideType} slide for a ${industry} pitch deck.
  Purpose: ${purpose}
  
  The template should include:
  1. A suggested slide title
  2. Placeholder content structure
  3. Visual element suggestions
  4. Brief notes on what to include/avoid
  
  Return as JSON in this format:
  {
    "title": "Suggested slide title",
    "structure": {
      // Content structure fields appropriate for this slide type
    },
    "visualSuggestions": ["List of visual element ideas"],
    "notes": "Brief guidance notes"
  }`;
  };
  
  /**
   * Generate a prompt for analyzing slide effectiveness
   * @param {Object} slide - Slide to analyze
   * @param {Object} deckContext - Context of the entire deck
   * @returns {string} - Formatted prompt for the AI
   */
  exports.processSlideEffectivenessAnalysis = (slide, deckContext) => {
    return `Analyze the effectiveness of this ${slide.slideType} slide within the context of a ${deckContext.industry} pitch deck:
  
  Slide Content:
  ${JSON.stringify(slide.content, null, 2)}
  
  Deck Context:
  - Industry: ${deckContext.industry}
  - Target Audience: ${deckContext.audience}
  - Pitch Purpose: ${deckContext.purpose}
  
  Provide a detailed analysis including:
  1. Clarity score (1-10) with reasoning
  2. Impact score (1-10) with reasoning
  3. Visual effectiveness score (1-10) with reasoning
  4. Specific improvement recommendations
  5. Examples of better wording/structure where applicable`;
  };

/**
 * Generate a prompt for applying a specific improvement suggestion
 * @param {Object} params - Parameters for the suggestion application
 * @param {string} params.suggestion - The improvement suggestion to apply
 * @param {Array} params.slides - Array of slides to apply the suggestion to
 * @param {boolean} params.forSingleSlide - Whether applying to a single slide or multiple
 * @returns {string} - Formatted prompt for the AI
 */
exports.processSuggestionApplication = (params) => {
  const { suggestion, slides, forSingleSlide } = params;
  
  if (forSingleSlide) {
    const slide = slides[0];
    return `Please apply the following improvement suggestion to this slide:
    
    Suggestion: "${suggestion}"
    
    Current Slide Content (${slide.type} slide):
    ${JSON.stringify(slide.content, null, 2)}
    
    Please modify the slide content to implement this suggestion. Return the complete updated content in the same JSON format, with all fields preserved. Be precise and focused on implementing exactly what the suggestion recommends without making unrelated changes.`;
  }
  
  return `Please apply the following improvement suggestion across multiple slides in a deck:
  
  Suggestion: "${suggestion}"
  
  Current Slides:
  ${JSON.stringify(slides.map(slide => ({
    id: slide.id,
    type: slide.type,
    position: slide.position,
    content: slide.content
  })), null, 2)}
  
  Please modify the slides that are most relevant to this suggestion. Return a JSON object with slide IDs as keys and their updated content as values, like this:
  {
    "slide-id-1": { /* updated content for this slide */ },
    "slide-id-2": { /* updated content for this slide */ }
  }
  
  Only include slides that you've actually modified. Be precise and focused on implementing exactly what the suggestion recommends.`;
};

/**
 * Generate a prompt for creating a complete deck structure
 * @param {Object} params - Parameters for deck generation
 * @param {string} params.topic - Main topic or theme of the deck
 * @param {string} params.industry - Industry sector
 * @param {number} params.slideCount - Number of slides to generate
 * @returns {string} - Formatted prompt for the AI
 */
exports.processDeckStructureGeneration = (params) => {
  const { topic, industry, slideCount } = params;
  
  return `Please create a comprehensive pitch deck structure for a ${industry} company presentation on "${topic}".
  
  The deck should include ${slideCount} slides, with appropriate slide types and content for each. Focus on creating a compelling narrative flow that would be effective for investors or stakeholders in the ${industry} industry.
  
  For each slide, provide:
  1. Slide type (e.g., intro, problem, solution, market, etc.)
  2. A compelling title
  3. Brief description of key content points (2-3 bullet points)
  4. A suggestion for visual elements
  
  Return the structure in the following JSON format:
  {
    "title": "Overall deck title",
    "description": "Brief description of the deck's purpose",
    "slides": [
      {
        "position": 1,
        "type": "intro",
        "title": "Slide title",
        "keyPoints": ["Point 1", "Point 2", "Point 3"],
        "visualSuggestion": "Suggested visual element"
      },
      {
        "position": 2,
        "type": "problem",
        "title": "Slide title",
        "keyPoints": ["Point 1", "Point 2", "Point 3"],
        "visualSuggestion": "Suggested visual element"
      }
      // And so on for all ${slideCount} slides
    ]
  }
  
  Ensure the slides follow a logical progression that tells a compelling story about the ${topic} in the ${industry} industry.`;
};