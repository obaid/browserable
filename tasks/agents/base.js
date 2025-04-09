
class BaseAgent {
    constructor() {}

    getBaseActions() {
        const BASE_ACTIONS = {
            end: {
                description: "Ends this agent and gives handle back to the runner. Action code is 'end' NOT 'ACTION end' no need for extra garbage values in code..",
                input: {
                    parameters: {
                        reasoning: "The reason for ending the agent. Give a detailed reasoning for ending the agent.",
                        output: "The output of the agent. Give very detailed output. The handler will this output to decide what to do next. Be as much detailed as possible in terms of what all you did. Also include all the details from your processing so far. The output should be rich enough so that the handler can reach out again using specific details if required. Really double down on the details. Consider what the user has asked for in the goal. Based on the goal, give all the details required so that user can proceed to next steps.",
                    },
                    required: [
                        "reasoning",
                        "output",
                    ],
                    types: {
                        reasoning: "string",
                        output: "string"
                    },
                },
                output: {
                    parameters: {
                        output: "The detailed output of the agent. Keep this detailed and make sure it answers all the questions asked by the user in the task.",
                    },
                    required: ["output"],
                    types: {
                        output: "string"
                    },
                },
            },
            error: {
                description: "Irrecoverable error at this agent. Ask the runner to convey to user and end the run here.",
                input: {
                    parameters: {
                        error: "The error string from the agent",
                    },
                    required: ["error"],
                    types: {
                        error: "string",
                    },
                },
                output: {
                    parameters: {},
                    required: [],
                    types: {},
                },
            },
            // ask_user_for_input: {
            //     description: "Ask the user for input. Ask the runner to convey the question to the user and get the input from the user.",
            //     input: {
            //         parameters: {
            //             question: "The question to ask the user",
            //             allowed_input_types: "The allowed input types",
            //         },
            //         required: ["question"],
            //         types: {
            //             question: "string",
            //             allowed_input_types: "string. comma separated string of allowed input types. Allowed are text, image, file, audio, xlsx.",
            //         },
            //     },
            //     output: {
            //         parameters: {
            //             answer: "The answer to the question. If the input type is image, file, audio, xlsx, then the answer should be the file url/ id.",
            //         },
            //         required: ["answer"],
            //         types: {
            //             answer: "string",
            //         },
            //     },
            // },
            // communicate_information_to_user: {
            //     description: "Communicate information to the user. This is used to send information to the user. The user sees the information in the UI.",
            //     input: {
            //         parameters: {
            //             information: "The information to communicate to the user",
            //         },
            //         required: ["information"],
            //         types: {
            //             information: "string",
            //         },
            //     },
            //     output: {
            //         parameters: {
            //             success: "A success message that the information has been communicated to the user.",
            //         },
            //         required: ["success"],
            //         types: {
            //             success: "string",
            //         },
            //     },
            // },
        };

        return BASE_ACTIONS;
    }

    getBaseActionFns() {
        return {
            end: this._action_end.bind(this),
            error: this._action_error.bind(this),
            // ask_user_for_input: this._action_ask_user_for_input.bind(this),
            // communicate_information_to_user: this._action_communicate_information_to_user.bind(this),
        };
    }


    async _action_error({ jarvis, aiData, runId, nodeId, threadId }) {
        const { error } = aiData;
    
        await jarvis.updateNodeStatus({
            agentCode: this.CODE,
            runId,
            nodeId,
            status: "Stopping the agent",
        });

        await jarvis.updateNodeUserLog({
            runId,
            nodeId,
            threadId,
            messages: [
                {
                    role: "assistant",
                    content: [
                        {
                            type: "text",
                            text: "Irrecoverable error at this agent.",
                            associatedData: [
                                {
                                    type: "markdown",
                                    markdown: error,
                                    name: "Error",
                                }
                            ]
                        }
                    ]
                }
            ]
        });


        await jarvis.updateNodeDebugLog({
            runId,
            nodeId,
            threadId,
            messages: [
                {
                    role: "assistant",
                    content: [
                        {
                            type: "text",
                            text: "Irrecoverable error at this agent.",
                            associatedData: [
                                {
                                    type: "markdown",
                                    markdown: error,
                                    name: "Error",
                                }
                            ]
                        }
                    ]
                }
            ]
        });

        await jarvis.errorAtNode({
            runId,
            nodeId,
            threadId,
            userId: jarvis.user_id,
            accountId: jarvis.account_id,
            error,
        });
    }
    
    async _action_end({ jarvis, aiData, threadId, runId, nodeId  }) {
        const {
            reasoning,
            output
        } = aiData;

        await jarvis.updateNodeUserLog({
            runId,
            nodeId,
            threadId,
            messages: [
                {
                    role: "assistant",
                    content: [
                        {
                            type: "text",
                            text: "Agent completed.",
                            associatedData: [
                                {
                                    type: "markdown",
                                    markdown: output,
                                    name: "Output",
                                },
                                {
                                    type: "markdown",
                                    markdown: reasoning,
                                    name: "Reasoning",
                                },
                            ]
                        }
                    ]
                }
            ]
        });
    
        await jarvis.endNode({
            runId,
            nodeId,
            threadId,
            status: 'completed',
            output,
            reasoning,
        });
    }

    async _action_ask_user_for_input({ jarvis, aiData, runId, nodeId, threadId }) {

        // add to agent log 
        await jarvis.updateNodeAgentLog({
            runId,
            nodeId,
            messages: [
                {
                    role: "assistant",
                    content: `Asking user for input.
**Question**: ${aiData.question}
**Allowed Input Types**: ${aiData.allowed_input_types}`,
                },
            ],
        });

        await jarvis.updateNodeDebugLog({
            runId,
            nodeId,
            threadId,
            messages: [
                {
                    role: "assistant",
                    content: [
                        {
                            type: "text",
                            text: "Asking user for input.",
                            associatedData: [
                                {
                                    type: "code",
                                    code: {
                                        question: aiData.question,
                                        allowed_input_types: aiData.allowed_input_types,
                                    },
                                    name: "Question",
                                },
                            ]
                        }
                    ]
                }
            ]
        });

        await jarvis.askUserForInputAtNode({
            runId,
            nodeId,
            threadId,
            question: aiData.question,
            allowed_input_types: aiData.allowed_input_types || "text",
        });
    }

    async _action_communicate_information_to_user({ jarvis, aiData, runId, nodeId, threadId }) {
        const { information } = aiData;

        await jarvis.communicateInformationToUserAtNode({
            runId,
            nodeId,
            threadId,
            information,
        });

        await jarvis.updateNodeAgentLog({
            agentCode: this.CODE,
            runId,
            nodeId,
            messages: [
                {
                    role: "jarvis",
                    content: `Communicated information to the user.`,
                },
            ],
        });

        await jarvis.updateNodeDebugLog({
            runId,
            nodeId,
            threadId,
            messages: [
                {
                    role: "assistant",
                    content: [
                        {
                            type: "text",
                            text: "Communicated information to the user.",
                            associatedData: [
                                {
                                    type: "markdown",
                                    markdown: information,
                                    name: "Information",
                                }
                            ]
                        }
                    ]
                }
            ]
        });

        await jarvis.scheduleNodeLooper({
            runId,
            nodeId,
            threadId,
            agentCode: this.CODE,
            delay: 0,
        });
    }
}

const baseAgent = new BaseAgent();


module.exports = {
    BaseAgent,
    baseAgent
}