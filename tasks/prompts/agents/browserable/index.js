/**
 * Export all Browserable agent prompts
 */
const { 
    buildExtractLLMPrompt,
    buildRefineExtractedContentPrompt,
    buildExtractionMetadataPrompt
} = require('./extractPrompts');

const {
    buildActLLMPrompt,
    buildVerifyActionPrompt
} = require('./actionPrompts');

const {
    buildNavigationPrompt,
    buildActionsSummaryPrompt
} = require('./navigationPrompts');

const {
    buildVisionActionPrompt
} = require('./visionPrompts');

module.exports = {
    // Extract prompts
    buildExtractLLMPrompt,
    buildRefineExtractedContentPrompt,
    buildExtractionMetadataPrompt,
    
    // Action prompts
    buildActLLMPrompt,
    buildVerifyActionPrompt,
    
    // Navigation prompts
    buildNavigationPrompt,
    buildActionsSummaryPrompt,
    
    // Vision prompts
    buildVisionActionPrompt
};