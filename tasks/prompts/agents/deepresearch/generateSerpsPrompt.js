
function buildGenerateSerpsPrompt({
    task,
    numSerps,
    learningsTrail,
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
            content: `Given the following prompt from the user, generate a list of SERP queries to research the topic. Return a maximum of ${numSerps} queries, but feel free to return less if the original prompt is clear. Make sure each query is unique and not similar to each other: <prompt>${task}</prompt>

${learningsTrail && learningsTrail.length > 0
                    ? `Here are some learnings from previous research, use them to generate more specific queries: 
${learningsTrail.join("\n")}`
                    : ""
            }
            
            
OUTPUT: JSON OBJECT WITH ONLY ONE KEY "serps"
{
    "serps": [{ // The list of SERP query objects.
        "query": "...", // The SERP query. (string). It's important to keep the SERP short and crisp as much as possible. 3-5 words max. Lengthier queries doesn't result in good research.
        "researchGoal": "..." // First talk about the goal of the research that this query is meant to accomplish, then go deeper into how to advance the research once the results are found, mention additional research directions. Be as specific as possible, especially for additional research directions. (string)
    }] 
}

IMPORTANT: 
- EACH SERP QUERY MUST BE 3-5 WORDS MAX. LENGTHIER QUERIES DOESN'T RESULT IN GOOD RESEARCH.
ONLY PRINT THE JSON OBJECT AND NOTHING ELSE.
`,
        },
    ];

    return messages;
}

module.exports = {
    buildGenerateSerpsPrompt,
};

