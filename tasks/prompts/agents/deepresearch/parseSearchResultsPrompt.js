
function buildParseSearchResultsPrompt({
    pageContent,
    searchQuery,
}) {
    const messages = [
        {
            role: "system",
            content: `You are a Google Search expert.`,
        },
        {
            role: "user",
            content: `User searched for "${searchQuery}" on Google. and the following page content was found:
<pageContent>${pageContent}</pageContent>

Extract the following information:
- Title
- Description
- URL
- Snippet
            
OUTPUT: JSON OBJECT WITH ONLY ONE KEY "results"
{
    "results": [{ // The list of SERP query objects. Make sure to include all the search results.
        "title": "...", // The title of the page. (string)
        "description": "...", // The description of the page. (string)
        "url": "...", // The URL of the page. (string)
        "snippet": "..." // The snippet of the page. (string)
    }] 
}
ONLY PRINT THE JSON OBJECT AND NOTHING ELSE.
`,
        },
    ];

    return messages;
}

module.exports = {
    buildParseSearchResultsPrompt,
};

