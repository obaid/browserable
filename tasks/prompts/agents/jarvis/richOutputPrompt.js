function buildRichOutputPrompt({
    messagesExchanged,
    outputGeneratedSoFar,
    input,
    output,
    outputData,
}) {
    const messages = [
        {
            role: "system",
            content: `You are a helpful assistant in detailed output generation. 
INPUT: You will be given a list of messages that were exchanged between a user and an assistant.
OUTPUT: You will need to generate the outputs/results based on the messages. The outputs/results should be in the format of what the user asked for. You will be given a partially filled output (or empty if this is the first attempt). You need to create an updated output based on the messages.

RULES:
- For each element in the schema, you need to generate the key in output/result based on the messages. Stick to the format of the element mentioned.
- For markdown elements, you need to generate the markdown based on the messages. Make sure the markdown is formatted correctly. When in doubt, include more details rather than less.
- Focus on the task and the description of the element to understand that the value of the element should be.
- CRITICAL: When a field has a specified word limit (e.g., '100 words max'), you MUST stay under that limit. Count the words before finalizing your response."
- ALSO THE OVERALL RESULT OBJECT MUST NOT EXCEED 4000 WORDS. MAKE SURE TO STAY UNDER THAT LIMIT SO THAT THE FINAL OUTPUT IS A PROPERLY STRUCTURED JSON OBJECT.
`,
        },
        {
            role: "user",
            content: `
****************TASK START****************
DETAILED OUTPUT GENERATION

Context:
- An agent worked along with a user on a user's task and produced an output. Because of context limitations, obviously the output is heavily influenced from the last few messages it exchanged with the user.
- What we want to do is, take the output it generated and go through all the messages it exchanged with the user to understand the context and then update the output to make it more accurate.
- For ex: it might have assumed some information is not present, or presented only portions of it, or summary of it because of context limitations.
- So we need to go through the messages and update the output to make it more accurate.
- Ex: The task might assumed some information as not available, but while going through the messages, we find that the information is present. So we need to update the output to include that information.
- Another ex: The task might have given just high level very small output, but while going through the messages, we find much more helpful and rich information. So we can update the output to include that information. The more richer we make the better. 
****************TASK END****************

****************WHAT THE USER WANTED START****************
${input}
****************WHAT THE USER WANTED END****************

${
    output
        ? `****************SUMMARY OF OUTPUT FROM THE WHOLE TASK START****************
${output}
****************SUMMARY OF OUTPUT FROM THE WHOLE TASK END****************`
        : ""
}

****************OUTPUT GENERATED SO FAR START****************
${JSON.stringify(outputGeneratedSoFar, null, 2)}
****************OUTPUT GENERATED SO FAR END****************

${
    messagesExchanged.length > 0
        ? `****************NEW MESSAGES EXCHANGED START****************
${messagesExchanged
    .map((message) => `${message.role}: ${message.content}`)
    .join("\n")}
****************NEW MESSAGES EXCHANGED END****************`
        : ""
}

****************OUTPUT SCHEMA START****************
FORMAT: JSON OBJECT WITH ONLY ONE KEY "outputGenerated".
{
    "outputGenerated": {
        ${outputData.map((x) => `     "${x.key}": <${x.type}>. ${x.description}.`).join("\n")}
    }
}
IMPORTANT: If the description specifies a word limit (e.g., '100 words max'), count your words and ensure you stay under that limit.
IMPORTANT: The overall output must not exceed 4000 words. Make sure to stay under that limit so that the final output is a properly structured JSON object.

1. IF OUTPUT GENERATED SO FAR IS EMPTY, YOU MUST START YOUR PROCESS FROM THE OUTPUT SCHEMA.
2. IF OUTPUT GENERATED SO FAR IS NOT EMPTY, YOU MUST START YOUR PROCESS FROM OUTPUT GENERATED SO FAR AND BUILD ON TOP OF THAT WITH NEW LEARNINGS.

MAIN RULE:
1. DO NOT RETURN THE OUTPUT SCHEMA START AS IT IS. 

ONLY PRINT THE JSON OBJECT AND NOTHING ELSE.
****************OUTPUT END****************
`,
        },
    ];

    return messages;
}

module.exports = {
    buildRichOutputPrompt,
};
