/**
 * Prompts related to content extraction for Browserable agent
 */

/**
 * Builds the prompt for extracting content with LLM
 */
function buildExtractLLMPrompt({
    instructions,
    schema,
    previouslyExtractedContent,
    domElements,
    chunksSeen,
    chunksTotal,
    useTextExtract = true,
    imageUrl,
    privateImageUrl
}) {
    const messages = [
        {
            role: "system",
            content: `You are extracting content on behalf of a user.
   
  You will be given:
1. An instruction
2.${
                useTextExtract
                    ? "A text representation of a webpage to extract information from."
                    : "A list of DOM elements to extract from."
            }

Print the exact text from the ${
                useTextExtract ? "text-rendered webpage" : "DOM elements"
            } with all symbols, characters, and endlines as is.
Print null or an empty string if no new information is found.

${
    useTextExtract
        ? "Once you are given the text-rendered webpage, you must thoroughly and meticulously analyze it. Be very careful to ensure that you do not miss any important information."
        : ""
}
`,
        },
        {
            role: "user",
            content: `
Rules:
- If a user asks you to extract a 'list' of information, or 'all' information, YOU MUST EXTRACT ALL OF THE INFORMATION THAT THE USER REQUESTS.
- Always ensure that you are extracting information only from the DOM provided. Do not make assumptions or hallucinate information.

Instructions: ${instructions}

DOM: ${domElements} 

OUTPUT FORMAT: JSON objects
key: justification
value: justification for the extraction. justify that you stuck to the DOM provided. justify that you did not hallucinate any information. justify that you stuck to the instructions. 3 lines max.
key: extractedContent
value:
${schema
    .map(({ key, type, description }) => `- ${key} (${type}): ${description}`)
    .join("\n")}

ONLY PRINT THE JSON AND NOTHING ELSE.
    `,
        },
        ...(imageUrl
            ? [
                  {
                      role: "user",
                      content: [
                          {
                              type: "image_url",
                              image_url: {
                                  url: privateImageUrl,
                              },
                          },
                      ],
                  },
              ]
            : []),
    ];

    return messages;
}

/**
 * Builds the prompt for refining extracted content
 */
function buildRefineExtractedContentPrompt({
    instructions,
    previouslyExtractedContent, 
    extractedContent,
    schema
}) {
    const messages = [
        {
            role: "system",
            content: `
Your job is simple. MERGE previous extracted content + new extracted content. 
1. Remove exact duplicates for elements in arrays and objects.
2. For text fields, append or update relevant text if the new content is an extension, replacement, or continuation.
3. For non-text fields (e.g., numbers, booleans), update with new values if they differ.
4. Add any completely new fields or objects ONLY IF they correspond to the provided schema.
5. Only work with provided previous extracted content and new extracted content. Do not make assumptions or hallucinate information.

Return the updated content that includes both the previous content and the new, non-duplicate, or extended information.`,
        },
        {
            role: "user",
            content: `Instructions: ${instructions}
Previously extracted content: ${JSON.stringify(
                previouslyExtractedContent,
                null,
                2
            )}
Newly extracted content: ${JSON.stringify(extractedContent, null, 2)}

OUTPUT FORMAT: JSON
key: justification
value: justification for the extraction. justify that you did not hallucinate any information. justify that you stuck to the instructions. 3 lines max.
key: extractedContent
value:
${schema
    .map(({ key, type, description }) => `- ${key} (${type}): ${description}`)
    .join("\n")}

ONLY PRINT THE JSON AND NOTHING ELSE.
`,
        },
    ];

    return messages;
}

/**
 * Builds the prompt for determining completion status of extraction
 */
function buildExtractionMetadataPrompt({
    instructions,
    refinedContent,
    chunksSeen,
    chunksTotal
}) {
    const messages = [
        {
            role: "system",
            content: `You are an AI assistant tasked with evaluating the progress and completion status of an extraction task.
Analyze the extraction response and determine if the task is completed or if more information is needed. Also create a short summary of the extracted content.

Strictly abide by the following criteria:
1. Once the instruction has been satisfied by the current extraction response, ALWAYS set completion status to true and stop processing, regardless of remaining chunks.
2. Only set completion status to false if BOTH of these conditions are true:
   - The instruction has not been satisfied yet
   - There are still chunks left to process (chunksTotal > chunksSeen)
3. Create a short summary of the extracted content. This should be a summary of the entire content, not just the current chunk. 3-4 lines maximum.
4. As long as the page does not have > 10 chunks, truly understand if there is value in processing more chunks. If you think there might be a chance that user will benefit from processing more chunks, set completed to false. 
   - If user wants ALL of something, then its better to process ALL chunks and then set completed to true.
   - If user wants a specific thing, then only process the chunks until you are sure that the goal has been accomplished.`,
        },
        {
            role: "user",
            content: `Instructions: ${instructions}

Extracted content: ${JSON.stringify(refinedContent, null, 2)}
chunksSeen: ${chunksSeen}
chunksTotal: ${chunksTotal}

OUTPUT FORMAT: JSON
key: summaryOfExtractedContent
value: summary of the extracted content
key: completed
value: true or false

ONLY PRINT THE JSON AND NOTHING ELSE.
`,
        },
    ];

    return messages;
}

module.exports = {
    buildExtractLLMPrompt,
    buildRefineExtractedContentPrompt,
    buildExtractionMetadataPrompt
};