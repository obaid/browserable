/**
 * Prompts related to vision-based interaction for Browserable agent
 */

/**
 * Builds the prompt for vision-based decision making
 */
function buildVisionActionPrompt({
    action,
    expectationFromAction,
    width,
    height,
    steps,
    tabsString,
    lastStepImageUrl
}) {
    const messages = [
        {
            role: "system",
            content: `You are a helpful assistant that can perform actions on a web page to achieve a user's goal. User will provide you with the overall goal, steps you have suggested so far, and for each step, the result of the action. You will then suggest the next action to perform.
                
                `,
        },
        {
            role: "user",
            content: `
Overall goal: ${action}

What the user is expecting from the action: ${expectationFromAction}

Current browser state:
${tabsString}

Device display dimensions:
Width: ${width}
Height: ${height}

Steps taken so far:
${steps
    .map(
        (step, index) => `### Step ${index + 1}:  
Description: ${step.actionDescription}
Result: ${step.result}
`
    )
    .join("\n")}

${
    lastStepImageUrl
        ? `Screenshot of the last step is attached in the next message.`
        : ""
}

Possible next steps:

function_name: click
arguments: {
    tabId: string
    x: number
    y: number
}
details: If you have a screenshot, you can decide to click on x,y coordinates. click, clicks on the page. If you want to scroll, then use scroll function.

function_name: type
arguments: {
    tabId: string
    text: string
    x: number
    y: number
}
details: If you have a screenshot, you can decide to type text at x,y coordinates.

function_name: keyPress
arguments: {
    tabId: string
    key: string (key here is what will be passed to Playwright's page.keyboard.press)
    x: number
    y: number
}
details: If you have a screenshot, you can decide to press a key at x,y coordinates.

function_name: scroll
arguments: {
    tabId: string
    x: number
    y: number
    deltaX: number
    deltaY: number
}
details: 
- If you have a screenshot, you can decide to scroll. This uses playwrights page.mouse.wheel. So first the cursor is moved to x,y and then the page is scrolled with deltaX and deltaY.
- Use this if the screenshot doesn't show the desired element. or if you think scrolling will help you see the desired element.
- If you want to scroll, then use scroll function.


function_name: double_click
arguments: {
    tabId: string
    x: number
    y: number
}
details: If you have a screenshot, you can decide to double click at x,y coordinates.

function_name: screenshot
arguments: {
    tabId: string
}
details: If you don't have a screenshot, you can ask for screenshot so you can decide what to do next.

function_name: exit
arguments: {
    reason: string,
    completed: boolean // true if you achieved user's goal, false otherwise
}
details: 
- If you achieved user's goal, you can exit. 
- If it feels like you are stuck, you can exit.
- If you have tried too many things and it doesn't seem to be working, you can exit.


Instructions:
- Don't just stick to the user's direct goal. Understand the user's expectation from the action.
- You might have to perform multiple actions to achieve the user's expectation. There might be unknown popups/ elements in the way. 
- Go through the steps one by one and see if you can achieve the user's expectation.
- If you think you have achieved the user's expectation, you can exit.
- If you think you are stuck after trying a few things, you can exit.

OUTPUT: (JSON)
{
    "function_name": "string",
    "arguments": {
        <keys and values based on the function_name and arguments. keys must be exactly as defined in the function arguments. value types must be as defined in the function arguments.>
    },
    "reason": "string" (reason for picking this function_name and arguments)${
        lastStepImageUrl
            ? `,
    "learningFromImage": "string" (learning from the last step image)`
            : ""
    }
}

ONLY OUTPUT THE JSON AND NOTHING ELSE.
`,
        },
        ...(lastStepImageUrl
            ? [
                  {
                      role: "user",
                      content: [
                          {
                              type: "image_url",
                              image_url: {
                                  url: lastStepImageUrl,
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
    buildVisionActionPrompt
};