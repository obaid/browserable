/**
 * Prompts related to navigation for Browserable agent
 */

/**
 * Builds the prompt for navigation decisions
 */
function buildNavigationPrompt({
    url,
    instructions,
    steps,
    tabsString,
    lastImageUrl
}) {
    const messagesForLLM = [
        {
            role: "system",
            content: `
            You are a navigation browser agent that can navigate to a url, read an open tab recursively, perform actions on it, until the user's navigation goal is achieved.
            You have the following tools:
            - open new tab
            - read tab (with chunk number) -> gets image + dom elements, current chunk, total chunks
            - act on tab -> clicks, scrolls, types, presses keys etc on a tab id
            - confirm navigation complete
            - confirm navigation failure

            You will be given a url, instructions, and a list of steps performed so far.
            You need to decide which tool to use next.
            `,
        },
        {
            role: "user",
            content: `
            Starting url: ${url}
            Instructions: ${instructions}

            Steps performed so far:
            ${steps}
            ${
                lastImageUrl
                    ? `Image of last step is attached in the next message.`
                    : ""
            }

            Current state:
            - tabs: ${tabsString}

            Tool details:
function_name: open_new_tab
arguments:
- url: string

function_name: read_tab
arguments:
- tabId: string
- chunkNumber: number (0 by default reads the first fold. If you need the next fold, first read the first fold. this tells how many folds are present in the page. so you can decide to read the next fold or not)

function_name: act_on_tab
arguments:
- tabId: string
- action: string. A detailed readable description of the action to be performed. Action can perform clicks, scrolls, types, presses keys etc (things that can be performed using playwright style automation). Once an action is performed, it is added to the steps. Note that the action might or might not complete the navigation goal. And it might have succeeded or failed. After every action, you need to read tab to confirm if an action is performed successfully or not. (actions that have visual confirmation can be confirmed by screenshot/ navigation)
- expectationFromAction: string. The expectation from the action.

function_name: confirm_navigation_complete
arguments:
- urls: array of strings. The urls that have been navigated to as an answer to user's navigation goal.

function_name: confirm_navigation_failure
arguments:
- urls: array of strings. The urls that have been navigated to. Any partial navigation can be retained here. 
- reason: string. The reason for the navigation failure.

OUTPUT FORMAT: (JSON)
- reasoning: string. The reasoning for the tool to be used next.
- function_name: string. The name of the tool to be used next.
- arguments: object. The arguments for the tool to be used next. keys are the arguments of the function.

ONLY RETURN THE JSON OUTPUT, NOTHING ELSE.
            `,
        },
        ...(lastImageUrl
            ? [
                  {
                      role: "user",
                      content: [
                          {
                              type: "image_url",
                              image_url: {
                                  url: lastImageUrl,
                              },
                          },
                      ],
                  },
              ]
            : []),
    ];

    return messagesForLLM;
}

/**
 * Builds the prompt for summarizing actions and navigation
 */
function buildActionsSummaryPrompt({ messages }) {
    const summary = messages
        .map((message) => {
            if (
                message.role === "user" &&
                message.content &&
                Array.isArray(message.content) &&
                message.content.length > 0
            ) {
                return message.content
                    .map((content) => {
                        if (typeof content === "string") {
                            return content;
                        }
                    })
                    .join("\n\n");
            } else if (
                message.role === "user" &&
                typeof message.content === "string"
            ) {
                return message.content;
            }
        })
        .filter((x) => x)
        .join("\n\n");

    const messagesToLLM = [
        {
            role: "system",
            content: `
        You are a helpful assistant that can summarize the actions performed so far.
        `,
        },
        {
            role: "user",
            content: `
Given a list of actions performed so far, summarize the actions in a readable format. For each action, include one line summarizing what was done.

        Actions performed so far:
${summary}

OUTPUT FORMAT: (JSON Object with key 'summary')
{ 
    "summary": "string"
}

ONLY RETURN THE JSON OUTPUT, NOTHING ELSE.
        `,
        },
    ];

    return messagesToLLM;
}

module.exports = {
    buildNavigationPrompt,
    buildActionsSummaryPrompt
};