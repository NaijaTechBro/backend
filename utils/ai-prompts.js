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
    return `${slideInfo.title} for a ${industry} company targeting ${target}.
  
  Key points to include:
  ${keyPoints}
  
  Tone: ${tone}
  
  Please provide content in the following JSON format:
  ${slideInfo.format}
  
  Make sure the content is:
  1. Concise and impactful - avoid fluff
  2. Specific to the ${industry} industry
  3. Relevant to the ${target} audience
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
  
  Format your response as:
  - Overall Assessment: [brief assessment]
  - Narrative Flow: [feedback on story arc]
  - Content Gaps: [identify missing elements]
  - Slide-Specific Improvements: [list by position/type]
  - Visual Enhancement: [suggestions for visuals]
  - Next Steps: [3-5 actionable recommendations]`;
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