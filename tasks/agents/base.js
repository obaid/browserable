
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
        };

        return BASE_ACTIONS;
    }

    getBaseActionFns() {
        return {
            end: this._action_end.bind(this),
            error: this._action_error.bind(this),
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
}

const baseAgent = new BaseAgent();


module.exports = {
    BaseAgent,
    baseAgent
}