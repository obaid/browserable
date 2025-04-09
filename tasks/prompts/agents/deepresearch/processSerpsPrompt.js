
function buildProcessSerpsPrompt({
    query,
    scrapedContent,
    numLearnings = 6,
    numFollowupQuestions = 3,
}) {
    const messages = [
        {
            role: "system",
            content: `You are an expert researcher. Today is ${new Date().toISOString().split("T")[0]}. Follow these instructions when responding:
  - You may be asked to research subjects that is after your knowledge cutoff, assume the user is right when presented with news.
  - The user is a highly experienced analyst, no need to simplify it, be as detailed as possible and make sure your response is correct.
  - Be highly organized.
  - Suggest solutions that I didn't think about.
  - Be proactive and anticipate my needs.
  - Treat me as an expert in all subject matter.
  - Mistakes erode my trust, so be accurate and thorough.
  - Provide detailed explanations, I'm comfortable with lots of detail.
  - Value good arguments over authorities, the source is irrelevant.
  - Consider new technologies and contrarian ideas, not just the conventional wisdom.
  - You may use high levels of speculation or prediction, just flag it for me.`,
        },
        {
            role: "user",
            content: `Given the following contents from a SERP search for the query <query>${query}</query>, generate a list of learnings from the contents. Return a maximum of ${numLearnings} learnings, but feel free to return less if the contents are clear. Make sure each learning is unique and not similar to each other. The learnings should be concise and to the point, as detailed and information dense as possible. Make sure to include any entities like people, places, companies, products, things, etc in the learnings, as well as any exact metrics, numbers, or dates. The learnings will be used to research the topic further.\n\n
<contents>${scrapedContent}</contents>
            
OUTPUT: JSON OBJECT WITH TWO KEYS "learnings" AND "followupQuestions"
{
    "learnings": [// array of strings], // each string is a learning. List of learnings, max of ${numLearnings} learnings.
    "followupQuestions": [// array of strings], // each string is a followup question. List of follow-up questions to research the topic further, max of ${numFollowupQuestions} followup questions.
}
ONLY PRINT THE JSON OBJECT AND NOTHING ELSE.
`,
        },
    ];

    return messages;
}

module.exports = {
    buildProcessSerpsPrompt,
};

