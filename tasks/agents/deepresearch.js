const { baseAgent, BaseAgent } = require("./base");
const {
    generateSerps,
    searchAndScrape,
} = require("../logic/integrations/deepresearch");

class DeepResearchAgent extends BaseAgent {
    CODE = "DEEPRESEARCH_AGENT";
    DETAILS = {
        description: `What agent does: This agent uses Google Search and URL scraping to conduct a thorough research on a given topic. Note that this agent goes through atleast 10-50 websites to conduct a thorough research on a given topic. So use it when the user's task requires a thorough research on a given topic.
    When to use: When the user's task requires a thorough research on a given topic using the internet.
    When not to use: When the user's task requires interacting with a specific website or a service.
    Speciality: The agent can conduct a thorough research on a given topic.
    `,
        input: {
            parameters: {
                task: "The task to be performed by the agent. Detailed research task to be conducted.",
            },
            required: ["task"],
            types: {
                task: "string",
            },
        },
        output: {
            parameters: {
                output: "The output of the agent. The output should be a detailed research report on the given topic.",
            },
            required: ["output"],
            types: {
                output: "string",
            },
        },
    };

    constructor() {
        super();
    }

    getActions() {
        let baseActions = JSON.parse(JSON.stringify(super.getBaseActions()));

        return {
            ...baseActions,
        };
    }

    getActionFns() {
        const baseActionFns = super.getBaseActionFns();
        return {
            ...baseActionFns,
        };
    }

    async _init({
        runId,
        nodeId,
        threadId,
        input, // to start the agent
        jarvis,
    }) {
        await jarvis.updateNodeStatus({
            agentCode: this.CODE,
            runId,
            nodeId,
            status: "Started deep research agent",
        });

        const uniqueId = await jarvis.generateUUID();

        // any re-usable data can be stored here.
        await jarvis.saveNodePrivateData({
            runId,
            nodeId,
            data: {
                jobs: [uniqueId],
                learnings: [],
                urls: [],
            },
        });

        await jarvis.scheduleQueueJob({
            code: this.CODE,
            functionToCall: "deepResearch",
            functionArgs: {
                breadth: 4,
                depth: 3,
                task: input,
                uniqueId,
                superTask: input,
                runId,
                nodeId,
                userId: jarvis.user_id,
                flowId: jarvis.flow_id,
                accountId: jarvis.account_id,
                threadId,
            },
        });
    }

    async deepResearch({
        breadth,
        depth,
        task,
        uniqueId,
        runId,
        nodeId,
        superTask,
        jarvis,
        threadId,
    }) {
        try {
            await jarvis.updateNodeStatus({
                agentCode: this.CODE,
                runId,
                nodeId,
                status: `Generating SERPs (Depth: ${depth}, Breadth: ${breadth})`,
            });

            let { private_data: dataStore } = await jarvis.getNodeInfo({
                runId,
                nodeId,
            });
            dataStore = dataStore || {};

            const history = (dataStore.learningsTrailMap || {})[uniqueId] || [];

            const serpQueries = await generateSerps({
                task,
                numSerps: breadth,
                learningsTrail: history,
                runId,
                nodeId,
                accountId: jarvis.account_id,
                flowId: jarvis.flow_id,
                agentCode: this.CODE,
                threadId,
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
                                text: "Generated ideas for research",
                                associatedData: [
                                    {
                                        type: "markdown",
                                        markdown: serpQueries
                                            .map((serp) => serp.query)
                                            .map((query) => `- ${query}`)
                                            .join("\n"),
                                        name: "Ideas",
                                    },
                                ],
                            },
                        ],
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
                                text: "Generated ideas for research",
                                associatedData: [
                                    {
                                        type: "code",
                                        code: serpQueries,
                                        name: "SERPs",
                                    },
                                ],
                            },
                        ],
                    },
                ],
            });

            let allUrls = [];
            let allLearnings = [];
            let newJobIds = [];
            let newJobs = [];
            let learningsTrailMap = {};

            // for each serp,
            for (const serpQuery of serpQueries) {
                await jarvis.updateNodeStatus({
                    agentCode: this.CODE,
                    runId,
                    nodeId,
                    status: `Researching "${serpQuery.query}"`,
                });

                const { urls, learnings, followupQuestions, searchPageContent, searchPageResults, scrapedLinks } =
                    await searchAndScrape({
                        query: serpQuery.query,
                        maxUrls: 10,
                        runId,
                        nodeId,
                        flowId: jarvis.flow_id,
                        agentCode: this.CODE,
                        accountId: jarvis.account_id,
                        threadId,
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
                                    text: `Analyzed ${urls.length} URLs for "${serpQuery.query}"`,
                                    associatedData: [
                                        {
                                            type: "markdown",
                                            markdown: urls
                                                .map((url) => `- ${url}`)
                                                .join("\n"),
                                            name: "URLs",
                                        },
                                    ],
                                },
                            ],
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
                                    text: `Analyzed ${urls.length} URLs for "${serpQuery.query}"`,
                                    associatedData: [
                                        {
                                            type: "code",
                                            code: urls
                                                .map((url) => `- ${url}`)
                                                .join("\n"),
                                            name: "URLs",
                                        },
                                        {
                                            type: "markdown",
                                            markdown: learnings
                                                .map((x) => `- ${x}`)
                                                .join("\n"),
                                            name: "Learnings",
                                        },
                                        {
                                            type: "markdown",
                                            markdown: searchPageContent,
                                            name: "Search page content",
                                        },
                                        {
                                            type: "code",
                                            code: searchPageResults,
                                            name: "Search page results",
                                        },
                                        {
                                            type: "code",
                                            code: scrapedLinks,
                                            name: "Scraped links",
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                });

                allUrls.push(...urls);
                allLearnings.push(...learnings);

                const newBreadth = Math.ceil(breadth / 2);
                const newDepth = depth - 1;

                if (newDepth > 0) {
                    const newQuery = `Previous research goal: ${
                        serpQuery.researchGoal
                    }
Follow-up research questions: 
${followupQuestions.join("\n")}`;

                    const newJobId = await jarvis.generateUUID();
                    newJobIds.push(newJobId);

                    learningsTrailMap[newJobId] = [...history, ...learnings];

                    newJobs.push({
                        code: this.CODE,
                        functionToCall: "deepResearch",
                        functionArgs: {
                            breadth: newBreadth,
                            depth: newDepth,
                            task: newQuery,
                            uniqueId: newJobId,
                            runId,
                            nodeId,
                            superTask,
                            userId: jarvis.user_id,
                            flowId: jarvis.flow_id,
                            accountId: jarvis.account_id,
                            threadId,
                        },
                    });
                }
            }

            // put back the learnings and urls
            let { private_data: data } = await jarvis.getNodeInfo({
                runId,
                nodeId,
            });
            data = data || {};

            data.learnings.push(...allLearnings);
            data.urls.push(...allUrls);
            data.jobs.push(...newJobIds);
            // mark this job as done
            data.jobs = data.jobs.filter((job) => job !== uniqueId);
            data.learningsTrailMap = {
                ...learningsTrailMap,
                ...data.learningsTrailMap,
            };

            // update the whole thing
            await jarvis.saveNodePrivateData({
                runId,
                nodeId,
                data,
            });

            // in case there are no more jobs, then we move to the next step
            if (data.jobs.length === 0 && newJobs.length === 0) {
                await jarvis.scheduleQueueJob({
                    code: this.CODE,
                    functionToCall: "generateDeepResearchReport",
                    functionArgs: {
                        runId,
                        nodeId,
                        superTask,
                        userId: jarvis.user_id,
                        flowId: jarvis.flow_id,
                        accountId: jarvis.account_id,
                        threadId,
                    },
                });
            } else {
                // schedule all the new jobs
                for (const job of newJobs) {
                    await jarvis.scheduleQueueJob(job);
                }
            }
        } catch (error) {
            console.log("Error in deep research", error);

            await jarvis.updateNodeStatus({
                agentCode: this.CODE,
                runId,
                nodeId,
                status: `Error in deep research: ${error.message}`,
            });

            // This might be just one job among many.
            let { private_data: data } = await jarvis.getNodeInfo({
                runId,
                nodeId,
            });
            data = data || {};

            // remove this job from the jobs array
            data.jobs = data.jobs.filter((job) => job !== uniqueId);

            // update the whole thing
            await jarvis.saveNodePrivateData({
                runId,
                nodeId,
                data,
            });

            // in case there are no more jobs, then we move to the next step
            if (data.jobs.length === 0) {
                await jarvis.scheduleQueueJob({
                    code: this.CODE,
                    functionToCall: "generateDeepResearchReport",
                    functionArgs: {
                        runId,
                        nodeId,
                        superTask,
                        userId: jarvis.user_id,
                        flowId: jarvis.flow_id,
                        accountId: jarvis.account_id,
                        threadId,
                    },
                });
            }
        }
    }

    async generateDeepResearchReport({
        runId,
        nodeId,
        superTask,
        jarvis,
        threadId,
    }) {
        try {
            await jarvis.updateNodeStatus({
                agentCode: this.CODE,
                runId,
                nodeId,
                status: "Generating deep research report",
            });

            let { private_data: data } = await jarvis.getNodeInfo({
                runId,
                nodeId,
            });
            data = data || {};

            // Use the detailed report helper here
            let detailedOutput = await jarvis.createDetailedOutputWithMessages({
                messages: (data.learnings || []).map((learning) => ({
                    role: "assistant",
                    content: learning,
                })),
                runId,
                nodeId,
                flowId: jarvis.flow_id,
                input: superTask,
                userId: jarvis.user_id,
                accountId: jarvis.account_id,
                threadId,
            });

            await jarvis.updateNodeStatus({
                agentCode: this.CODE,
                runId,
                nodeId,
                status: "Deep research report generated",
            });

            detailedOutput = detailedOutput.report;

            const sources = data.urls;
            // list the sources at the end of the report in a list format
            const sourcesList = sources
                .map((source) => `- ${source}`)
                .join("\n");
            const reportWithSources = `${detailedOutput}\n\n-------\n\nSources:\n${sourcesList}`;

            // Now we save this huge ass report in the node agent data
            await jarvis.updateNodeAgentLog({
                runId,
                nodeId,
                messages: [
                    {
                        role: "jarvis",
                        content: reportWithSources,
                    },
                ],
            });

            // Add this huge ass report in the node user log
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
                                text: "Deep research report",
                                associatedData: [
                                    {
                                        type: "markdown",
                                        markdown: reportWithSources,
                                        name: "Deep research report",
                                    },
                                ],
                            },
                        ],
                    },
                ],
            });

            // Add this huge ass report in the node debug log
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
                                text: "Deep research report",
                                associatedData: [
                                    {
                                        type: "markdown",
                                        markdown: detailedOutput,
                                        name: "Deep research report",
                                    },
                                    {
                                        type: "markdown",
                                        markdown: data.learnings
                                            .map((x) => `- ${x}`)
                                            .join("\n"),
                                        name: "Learnings",
                                    },
                                    {
                                        type: "markdown",
                                        markdown: data.urls
                                            .map((x) => `- ${x}`)
                                            .join("\n"),
                                        name: "URLs",
                                    },
                                ],
                            },
                        ],
                    },
                ],
            });

            // now lets get the schema of the data table
            const dtSchema = await jarvis.getDataTableSchema({
                flowId: jarvis.flow_id,
                accountId: jarvis.account_id,
            });

            // we create one new entry which is exactly in the format of the data table scheme
            let newRow = {};

            for (const row of dtSchema) {
                newRow[row.key] = "";
            }

            // for the entry in the newRow with key "report", we add the detailedOutput
            // for the entry in the newRow with key "sources", we add the sourcesList
            // for the entry in the newRow with key "learnings", we add the learnings

            newRow.report = detailedOutput;
            newRow.sources = sourcesList;
            newRow.learnings = data.learnings.map((x) => `- ${x}`).join("\n");

            // Now we end the node
            await jarvis.endNode({
                runId,
                nodeId,
                status: "completed",
                output: reportWithSources,
                reasoning: "Deep research report generated",
                schemaStructuredOutput: [newRow],
                threadId,
            });
        } catch (err) {
            await jarvis.updateNodeStatus({
                agentCode: this.CODE,
                runId,
                nodeId,
                status: `Error in generating deep research report: ${err.message}`,
            });

            await jarvis.errorAtNode({
                runId,
                nodeId,
                threadId,
                userId: jarvis.user_id,
                accountId: jarvis.account_id,
                error: `Error in generating deep research report: ${err.message}`,
            });
        }
    }

    async _looper({ runId, nodeId, threadId, input, jarvis }) {
        await jarvis.updateNodeStatus({
            agentCode: this.CODE,
            runId,
            nodeId,
            status: "Processing deep research agent",
        });

        const action = await jarvis.decideAction({
            runId,
            agentCode: this.CODE,
            nodeId,
            threadId,
            input,
            possibleActions: Object.keys(this.getActions()),
        });

        const { actionCode, aiData } = action;

        const actionId = await jarvis.generateUUID();

        // schedule to run the action
        await jarvis.scheduleAction({
            runId,
            agentCode: this.CODE,
            nodeId,
            threadId,
            actionCode,
            actionId,
            aiData,
            delay: aiData.delay || 0,
        });
    }
}

const agent = new DeepResearchAgent();
module.exports = {
    agent,
    DeepResearchAgent,
};
