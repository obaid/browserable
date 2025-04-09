/**
 * Export all Jarvis agent prompts
 */
const { 
    buildDecideActionPrompt, 
    buildDecideAgentPrompt 
} = require('./decidePrompts');

const { buildRichOutputPrompt } = require('./richOutputPrompt');

const {
    buildDataTableSystemPrompt,
    buildDataTableSchemaPrompt,
    buildDataTableOpsPrompt,
    buildDataTableDocUpdatePrompt,
} = require('./datatablePrompts');

module.exports = {
    buildDecideActionPrompt,
    buildDecideAgentPrompt,
    buildRichOutputPrompt,
    buildDataTableSystemPrompt,
    buildDataTableSchemaPrompt,
    buildDataTableOpsPrompt,
    buildDataTableDocUpdatePrompt,
};