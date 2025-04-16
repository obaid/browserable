const { getReadableFromUTCToLocal } = require("../../../utils/datetime");

/**
 * Prompts related to decision making for Jarvis agent
 */

/**
 * Builds the prompt for deciding which action to take next
 */
function buildDecideActionPrompt({
    agent,
    possibleActions,
    nodeData,
    shortlistedDocuments,
    lastLimitMessages,
    lastImageMessage,
    userName,
    timezoneOffsetInSeconds,
    customInstructions,
    input,
    dtSchema,
    tools,
}) {
    return `
=== AGENT DESCRIPTION ===
${agent.DETAILS.description}

${customInstructions || ""}

=== TASK TO ACHIEVE OVERALL ===
${input}

=== DATA TABLE SCHEMA OF WHAT SCHEMA USER IS EXPECTING THE INFORMATION IN ===
${JSON.stringify(dtSchema, null, 2)}

${
    shortlistedDocuments.length == 0
        ? ""
        : `
=== SHORTLISTED DOCUMENTS WITH RELEVANT DATA FOR THIS TASK ===
${shortlistedDocuments.map((doc) => JSON.stringify(doc, null, 2)).join("\n")}
`
}


=== YOUR TASK ===
You are a helpful assistant. 
1. You decide which action to take next to achieve the goal (and related metadata). 
Once you decide the next action, user runs the action (replies with any metadata). 
Your job is to decide the next action.
2. You decide what data you learnt so far and what to store in the key-val storage for this task.
- Some tips. 
-- If the main task of the user is split into multiple sub-tasks. Then you can store the success results of the sub-tasks in the key-val storage.
-- Ex: if user asked to search for Java and JavaScript to get their founding dates. You can store the results of search for Java first. Then move on to JavaScript. The benefit of storing the results of Java search is that it can be reused at the end when JavaScript search is completed so you can compare/ merge according to user's main task.
3. Important rules
-- Do not hallucinate data. The data you are trained on might have been old. So make sure you only rely on current data.


=== POSSIBLE ACTIONS ===

${possibleActions
    .map(
        (id) => `== ACTION ${id} == 
Description: 
${agent.getActions()[id].description}

Input: 
${JSON.stringify(agent.getActions()[id].input, null, 2)}

Output: 
${JSON.stringify(agent.getActions()[id].output, null, 2)}
`
    )
    .join("\n\n")}

=== END OF POSSIBLE ACTIONS ===

${
    tools.length > 0
        ? `
== USER PROVIDED ACTION CODES ==
${tools
    .map(
        (tool) => `== ACTION ${tool.function.name} ==
actionCode = "${tool.function.name}"
Description: ${tool.function.description}
Input aiData parameters aiData of this action: 
${JSON.stringify(tool.function.parameters, null, 2)}
Output will be sent back as a string.
`
    )
    .join("\n\n")}
`
        : ""
}

=== Current Key Value Data Storage for this task ===
${JSON.stringify(nodeData, null, 2)}

=== HISTORY SO FAR OF THIS AGENT ===

${lastLimitMessages
    .map(
        (message) => `${message.role}: 
${message.content}`
    )
    .join("\n\n\n")}

== END OF HISTORY SO FAR OF THIS AGENT ==

=== USER DATA ===
User's name: ${userName}
User's timezone offset: ${timezoneOffsetInSeconds}

=== UNIVERSE DATA ===
Current date and time: ${getReadableFromUTCToLocal(
        new Date(),
        timezoneOffsetInSeconds
    )}


OUTPUT: (JSON)
{
    "disclaimer": "<string> Convey that you are not hallucinated. You are not relying on your own past information and that you are relying on existing data from the agents. ",
    "reasoningForPickingAction": "<reasoningForPickingAction>", // detailed reasoning for why this action is chosen AND also why other actions are not chosen. Critique deeply if there is any reason for picking other actions to better achieve user's goals. Also explain if you are sure that you are not hallucinating. Also you are not relying on your own past information and that you are relying on existing data from the agents. Make sure you don't include any extra info here that comes from your own data. Everything here must come from data provided so far. Why? because your knowledge cut off would cause you to hallucinate.
    "actionCode": "<actionCode>", // next action to perform to achieve the goal. THIS MUST BE A VALID ACTION CODE FROM THE POSSIBLE ACTIONS LIST. WITHOUT ANY extra garbage values.
    "aiData": {
        <keys here are the keys of the action input. values are the values to be passed to the action for that key. there is no need to have a parameter key here. It should directly be the keys inside the action's parameters. so that this is directly passed as is to the action function>
    },
    "updatesToNodeData": {
        <keys here are the keys of the node data. values are the values to be passed to the node data for that key. These key-vals are merged with the existing node data.>
    },
}

Valid action codes are: ${Object.keys(agent.getActionFns()).join(", ")}
Invalid action code format: "ACTION <actionCode>"
`;
}

/**
 * Builds the prompt for deciding which agent to use next
 */
function buildDecideAgentPrompt({
    availableAgents,
    input,
    triggerInput,
    runData,
    shortlistedDocument,
    lastLimitMessages,
    lastImageMessage,
    userName,
    email,
    timezoneOffsetInSeconds,
    tools,
}) {

    // strip off flow_id and account_id from shortlistedDocument
    const { flow_id, account_id, ...rest } = shortlistedDocument || {};

    return `
=== AGENT DESCRIPTION ===
You decide what to do next to achieve the goal of the user.

=== TASK TO ACHIEVE OVERALL ===
${input || ""}
${triggerInput || ""}

=== YOUR TASK ===
You decide which agent to take next to achieve the goal (and related metadata). Once you decide the next agent, user runs the agent (replies with any metadata). Your job is to decide the next agent in repeat.

=== RELEVANT DATA TO USE ===
${JSON.stringify(shortlistedDocument || {}, null, 2)}

=== POSSIBLE AGENTS ===

${Object.keys(availableAgents)
    .map(
        (agentCode) => `== AGENT CODE: ${agentCode} == 
Description: 
${
    availableAgents[agentCode].DETAILS.simpleDescription ||
    availableAgents[agentCode].DETAILS.description
}

Input (aiData parameters): 
${JSON.stringify(availableAgents[agentCode].DETAILS.input, null, 2)}

`
    )
    .join("\n\n")}

=== END OF POSSIBLE AGENTS ===

== GENERIC AGENT CODES ==

agentCode = "end"
If the task is completed, then this should be "end". 
aiData for this agent is:
{
    "reasoning": "<reasoning>" string explaning reasoning for ending. Give very detailed reasoning for why this is chosen.,
    "output": "<o>" string output generated from the task.The output of the agent. Give very detailed output. The handler will this output to decide what to do next. Be as much detailed as possible in terms of what all you did. Also include all the details from your processing so far. The output should be rich enough so that the handler can reach out again using specific details if required.,
}

agentCode = "error"
If there is a irrecoverable error, then this should be "error".
aiData for this agent is:
{
    "error": "<e>" string error message,
}

${
    tools.length > 0
        ? `
== USER PROVIDED AGENT CODES ==
${tools
    .map(
        (tool) => `== TOOL ${tool.function.name} ==
agentCode = "${tool.function.name}"
Description: ${tool.function.description}
Input aiData parameters aiData of this tool: 
${JSON.stringify(tool.function.parameters, null, 2)}
Output will be sent back as a string.
`
    )
    .join("\n\n")}
`
        : ""
}

=== HISTORY OF ALL ACTIONS PERFORMED SO FAR ===

${lastLimitMessages
    .map((message) => `${message.role}: ${message.content}`)
    .join("\n\n")}

== END OF HISTORY OF ALL ACTIONS PERFORMED SO FAR ==

=== USER DATA ===
User's name: ${userName}
User's email: ${email}
User's timezone offset: ${timezoneOffsetInSeconds}

=== UNIVERSE DATA ===
Current date and time at user's timezone: ${getReadableFromUTCToLocal(
        new Date(),
        timezoneOffsetInSeconds
    )}

== IMPORTANT ==
Each agent runs in it's own context. The agents don't have access to each other's context. So you need to pass all the information that the next agent would require to complete the task.

OUTPUT: (JSON)
{
    "agentCode": "<agentCode> string", // next agent to perform to achieve the goal. Note that the agent code is case sensitive. so if the agent code is "end" then it should be "end" and not "End" or "END" or "Ending" or anything else.
    "aiData": {
        <keys here are the keys of the agent input. values are the values to be passed to the agent for that key.> 
        <for the task key, make sure the input is structured and includes ALL possible information that the agent would require. For ex: assume the agent does not have access to original task. Your input is THE ONLY information the agent would act upon. (IMPORTANT)>
        // Note that the keys here are directly the nodes inside input.parameters. Don't start with parameters again.
    },
    "reasoningForPickingAgent": "<reasoningForPickingAgent> string,
    "summaryOfEverythingHappenedSoFar": "<summaryOfEverythingHappenedSoFar> string. Include all the details that the next agent can use to complete the task. This is important.",
}
`;
}

module.exports = {
    buildDecideActionPrompt,
    buildDecideAgentPrompt,
};
