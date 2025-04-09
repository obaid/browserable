/**
 * Export all agent prompts
 */
const jarvisPrompts = require("./jarvis");
const browserablePrompts = require("./browserable");
const deepresearchPrompts = require("./deepresearch");

module.exports = {
    jarvis: jarvisPrompts,
    browserable: browserablePrompts,
    deepresearch: deepresearchPrompts,
};
