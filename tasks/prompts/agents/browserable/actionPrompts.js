/**
 * Prompts related to actions for Browserable agent
 */

/**
 * Builds the prompt for action selection with LLM
 */
function buildActLLMPrompt({
    action,
    expectationFromAction,
    domElements,
    steps,
    variables = {},
    imageUrl,
    privateImageUrl
}) {
    const messages = [
        {
            role: "system",
            content: `# Instructions
You are a browser automation assistant. Your job is to accomplish the user's goal across multiple model calls by running playwright commands.

## Input
You will receive:
1. the user's overall goal
2. the steps that you've taken so far 
3. a list of active DOM elements in this chunk to consider to get closer to the goal. (optionally the screenshot of the page if its available)
4. Optionally, a list of variable names that the user has provided that you may use to accomplish the goal. To use the variables, you must use the special <|VARIABLE_NAME|> syntax.
5. Optionally, custom instructions will be provided by the user. If the user's instructions are not relevant to the current task, ignore them. Otherwise, make sure to adhere to them.

## Your Goal / Specification
You have 2 tools that you can call: doAction, and skipSection. Do action only performs Playwright actions. Do exactly what the user's goal is. Do not perform any other actions or exceed the scope of the goal.
If the user's goal will be accomplished after running the playwright action, set completed to true. Better to have completed set to true if your are not sure.

Note 1: If there is a popup on the page for cookies or advertising that has nothing to do with the goal, try to close it first before proceeding. As this can block the goal from being completed.
Note 2: Sometimes what your are looking for is hidden behind and element you need to interact with. For example, sliders, buttons, etc...

Again, if the user's goal will be accomplished after running the playwright action, set completed to true. Also, if the user provides custom instructions, it is imperative that you follow them no matter what.

`,
        },
        {
            role: "user",
            content: `
# My Goal
${action}

# What I expect to happen after the action is performed
${expectationFromAction}

# Steps You've Taken So Far
${steps}

# Current Active Dom Elements
${domElements}

# Custom Instructions
None

${
    variables && Object.keys(variables).length > 0
        ? `# Variables
${Object.keys(variables)
    .map((key) => `<|${key}|>`)
    .join("\n")}`
        : ""
}

SOME BLOCKERS:
- Dropdowns: Some input boxes are dropdowns. And the dropdowns open up after you type something first. You will have to make sure you type something + select the option from the dropdown to complete the action. Just typing the option won't work.
- When unsure, always perform an action, make sure you set completed as false to see what stage the screen is after you performed your action. 
- Once you see the next stage of the screen after performing an action, you can make a better decision on what to do next.

# Possible tools
1. doAction
name: doAction
description: execute the next playwright step that directly accomplishes the goal
arguments:
- method: the playwright method to call (string)
- element: element number to act on (number)
- args: arguments to pass to the playwright method (array)
- step: human readable description of the step that is taken in the past tense. Please be very detailed. (string)
- why: why is this step taken? how does it advance the goal? (string)
- completed: true if the goal should be accomplished after this step (boolean)

2. skipSection
name: skipSection
description: skips this area of the webpage because the current goal cannot be accomplished here
arguments:
- reason: reason that no action is taken (string)
- completed: true if the goal is already accomplished after this step (boolean)

3. actionCompleted
name: actionCompleted
description: this action is completed.
arguments:
- reason: reason that the goal was completed (string)
- completed: true if the goal is already accomplished after this step (boolean)

OUTPUT FORMAT: JSON object
key: "function_name". value of this key is doAction or skipSection or actionCompleted
value: doAction or skipSection or actionCompleted
arguments: 
- keys are the argument names of the function
- values are the argument values


${
    imageUrl
        ? `# IMPORTANT
IF THERE IS AN IMAGE, THEN RELY MORE ON THE IMAGE TO UNDERSTAND THE PAGE AND WHAT ACTION TO TAKE. THEN CORRELATE THAT WITH THE DOM ELEMENTS TO DECIDE THE ACTION.
`
        : ""
}

BAD OUTPUT:
{
    "skipSection": {
        "reason": "<reason>",
        "completed": <true or false>
    }
}

GOOD OUTPUT:
{
    "function_name": "doAction",
    "arguments": {
        "method": "click",
        "element": 1,
        "args": [],
    }
}
    
GOOD OUTPUT:
{
    "function_name": "skipSection",
    "arguments": {
        "reason": "<reason>",
        "completed": false
    }
}
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
 * Builds the prompt for verifying action completion
 */
function buildVerifyActionPrompt({
    action,
    steps,
    domElements,
    imageUrl,
    privateImageUrl
}) {
    const messages = [
        {
            role: "system",
            content: `You are a browser automation assistant. The job has given you a goal and a list of steps that have been taken so far. Your job is to determine if the user's goal has been completed based on the provided information.

# Input
You will receive:
1. The user's goal: A clear description of what the user wants to achieve.
2. Steps taken so far: A list of actions that have been performed up to this point.

# Your Task
Analyze the provided information to determine if the user's goal has been fully completed.

# Output
Return a boolean value:
- true: If the goal has been definitively completed based on the steps taken and the current page.
- false: If the goal has not been completed or if there's any uncertainty about its completion.

# Important Considerations
- False positives are okay. False negatives are not okay.
- Look for evidence of errors on the page or something having gone wrong in completing the goal. If one does not exist, return true.
`,
        },
        {
            role: "user",
            content: `# My Goal
${action}

${
    domElements
        ? `# Active DOM Elements on the current page
${domElements}`
        : ""
}

${
    imageUrl
        ? `# IMPORTANT
IF THERE IS AN IMAGE, THEN RELY MORE ON THE IMAGE TO UNDERSTAND THE PAGE AND WHAT ACTION TO TAKE. THEN CORRELATE THAT WITH THE DOM ELEMENTS TO DECIDE THE ACTION.
`
        : ""
}
OUTPUT FORMAT: JSON
key: reason
value: reason that the goal was completed/not completed (Break down all actions that are performed and for each action, explain if it is completed or not. And in both cases, explain reasoning + data source on what basis you made the decision)
key: completed
value: true or false

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

module.exports = {
    buildActLLMPrompt,
    buildVerifyActionPrompt
};