/**
 * Export all prompts from a single entry point
 */
const agentPrompts = require('./agents');

// Directly export for backward compatibility
const { buildDecideActionPrompt, buildDecideAgentPrompt } = agentPrompts.jarvis;

module.exports = {
    // Preserve existing exports for backward compatibility
    buildDecideActionPrompt,
    buildDecideAgentPrompt,
    
    // Export all prompts by agent for new code
    agents: agentPrompts
};