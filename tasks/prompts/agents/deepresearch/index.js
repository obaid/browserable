const { buildGenerateSerpsPrompt } = require("./generateSerpsPrompt");
const { buildProcessSerpsPrompt } = require("./processSerpsPrompt");
const { buildParseSearchResultsPrompt } = require("./parseSearchResultsPrompt");

module.exports = {
    buildGenerateSerpsPrompt,
    buildProcessSerpsPrompt,
    buildParseSearchResultsPrompt,
};
