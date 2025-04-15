var express = require("express");
var router = express.Router();
var cors = require("cors");
var { getReadableFromUTCToLocal } = require("../utils/datetime");
var { createFlow, changeFlowStatus } = require("../logic/flow");
var {
    callOpenAICompatibleLLMWithRetry,
    updateMetadataOfLLMCall,
} = require("../services/llm");
var {
    processUserInputForRun,
    processUserInputForNode,
    getAvailableTriggers,
    endRun,
} = require("../agents/jarvis");
var db = require("../services/db");
const {
    getDocumentsFromDataTable,
    getDataTableSchema,
} = require("../logic/datatable");
const { getGifStatus } = require("../logic/logs");

// Middleware to validate API key and get account/user info
const validateApiKey = async (req, res, next) => {
    const api_key = req.headers["x-api-key"];

    if (!api_key) {
        return res.json({ success: false, error: "API key is required" });
    }

    try {
        const tasksDB = await db.getTasksDB();
        const { rows } = await tasksDB.query(
            `SELECT account_id, user_id FROM browserable.api_keys WHERE api_key = $1`,
            [api_key]
        );

        if (rows.length === 0) {
            return res.json({ success: false, error: "Invalid API key" });
        }

        req.account_id = rows[0].account_id;
        req.user_id = rows[0].user_id;
        next();
    } catch (e) {
        console.log(e);
        res.json({ success: false, error: e.message });
    }
};

// Create task
router.post("/task/create", cors(), validateApiKey, async (req, res) => {
    const { task, agent = "BROWSER_AGENT" } = req.body;

    if (!task) {
        return res.json({ success: false, error: "Task is required" });
    }

    try {
        const uniqueKeyInMetadata = "generator";
        const uniqueValInMetadata = Date.now();

        // Generate readable name and description
        const llmResponse = await callOpenAICompatibleLLMWithRetry({
            messages: [
                {
                    role: "system",
                    content: `Create a simple readable_name (max 4-5 words) and readable_description (max 2-3 sentences) based on the user's inital message.`,
                },
                {
                    role: "user",
                    content: `Initial message: ${task}
                    
Output format: (JSON)
{
    "readable_name": "<readable_name>",
    "readable_description": "<readable_description>"
}
ONLY output the JSON, nothing else.`,
                },
            ],
            metadata: {
                [uniqueKeyInMetadata]: uniqueValInMetadata,
                usecase: "generator",
                accountId: req.account_id,
            },
            models: [
                "gemini-2.0-flash",
                "deepseek-chat",
                "gpt-4o-mini",
                "claude-3-5-haiku",
                "qwen-plus",
            ],
            max_attempts: 4,
        });

        // let finalTriggers = triggers;
        let finalTriggers = ["once|0|"];
        let readableDescriptionOfTriggers = "Runs once immediately.";

//         if (triggers === null) {
//             // Generate triggers if explicitly set to null
//             const triggersResponse = await callOpenAICompatibleLLMWithRetry({
//                 messages: [
//                     {
//                         role: "system",
//                         content: `You are a helpful assistant to figure out the when to run a task.`,
//                     },
//                     {
//                         role: "user",
//                         content: `Given the following task that user wants to run (user entered in natural language):
// ------------
// ${task}
// ------------

// Figure out the when to run the task. (i.e, what all triggers are possible for the task)

// Available triggers are:
// 1. "once|<delay>|" ---> instantly creates a run with the provided delay. delay is in milliseconds.
// 2. "crontab|<crontab_string>|" ---> creates a task with the crontab string to run as long as it is active
// 3. event.once|<event_id>|" ---> integrations can parse this event id to create a run
// 4. event.every|<event_id>|" ---> integrations can parse this event id to create a run

// It's mandatory to have at least one trigger. Worst case, you can use "once|0|" as a trigger.

// Available triggers for the task:
// ${getAvailableTriggers({
//     agent_codes: [agent],
// })}

// Output format: (JSON)
// {
//     "readableDescriptionOfTriggers": "<readableDescriptionOfTriggers>",
//     "triggers": ["trigger1", "trigger2", "trigger3"]
// }

// ONLY output the JSON, nothing else.`,
//                     },
//                 ],
//                 models: [
//                     "gemini-2.0-flash",
//                     "deepseek-chat",
//                     "deepseek-reasoner",
//                     "claude-3-5-sonnet",
//                     "gpt-4o",
//                 ],
//                 metadata: {
//                     [uniqueKeyInMetadata]: uniqueValInMetadata,
//                     accountId: req.account_id,
//                     usecase: "generator",
//                 },
//                 max_attempts: 5,
//             });

//             finalTriggers = triggersResponse.triggers;
//             readableDescriptionOfTriggers =
//                 triggersResponse.readableDescriptionOfTriggers;
//         } else if (!triggers) {
//             // Default to once|0| if undefined
//             finalTriggers = ["once|0|"];
//             readableDescriptionOfTriggers = "Run once immediately.";
//         }

        const { flowId } = await createFlow({
            flow: {
                account_id: req.account_id,
                readable_name: llmResponse?.readable_name || "Flow",
                readable_description:
                    llmResponse?.readable_description || "Flow",
                user_id: req.user_id,
                task: task,
                triggers: finalTriggers,
                data: {},
                status: "active",
                metadata: {
                    agent_codes: [agent],
                    initMessage: task,
                    readableDescriptionOfTriggers,
                },
            },
        });

        await updateMetadataOfLLMCall({
            uniqueKeyInMetadata,
            uniqueValInMetadata,
            metadataToUpdate: {
                flowId,
            },
        });

        res.json({ success: true, data: { taskId: flowId } });
    } catch (e) {
        console.log(e);
        res.json({ success: false, error: e.message });
    }
});

// Get task run status
router.get(
    "/task/:taskId/run/:runId?/status",
    cors(),
    validateApiKey,
    async (req, res) => {
        const { taskId } = req.params;
        const runId = req.params.runId;

        if (!taskId) {
            return res.json({ success: false, error: "Task ID is required" });
        }

        try {
            const tasksDB = await db.getTasksDB();

            // If runId is not provided, get the most recent run
            let finalRunId = runId;
            if (!finalRunId) {
                const { rows: recentRuns } = await tasksDB.query(
                    `SELECT id FROM browserable.runs 
                WHERE flow_id = $1 AND account_id = $2 
                ORDER BY created_at DESC LIMIT 1`,
                    [taskId, req.account_id]
                );
                if (recentRuns.length > 0) {
                    finalRunId = recentRuns[0].id;
                } else {
                    return res.json({
                        success: true,
                        data: {
                            status: null,
                            inputWait: null,
                            liveStatus: null,
                        },
                    });
                }
            }

            // Get run status
            const { rows: runs } = await tasksDB.query(
                `SELECT status, input_wait, id, live_status, private_data->>'workingOnNodeId' AS working_on_node_id 
            FROM browserable.runs 
            WHERE id = $1 AND flow_id = $2 AND account_id = $3`,
                [finalRunId, taskId, req.account_id]
            );

            if (runs.length === 0) {
                return res.json({
                    success: true,
                    data: {
                        status: null,
                        inputWait: null,
                        liveStatus: null,
                    },
                });
            }

            let runStatus = runs[0].status;
            let inputWait = runs[0].input_wait;
            let liveStatus = runs[0].live_status;
            let runStatusCopy = runStatus;

            if (inputWait) {
                inputWait.runId = runs[0].id;
            }

            if (runStatus === "running" && runs[0].working_on_node_id) {
                const { rows: nodes } = await tasksDB.query(
                    `SELECT status, live_status, input_wait, id 
                FROM browserable.nodes 
                WHERE run_id = $1 AND id = $2`,
                    [runs[0].id, runs[0].working_on_node_id]
                );

                if (nodes.length > 0 && nodes[0].live_status) {
                    liveStatus = nodes[0].live_status;
                }

                if (nodes.length > 0 && runStatus !== "ask_user_for_input") {
                    runStatus = nodes[0].status;

                    if (
                        nodes[0].input_wait &&
                        nodes[0].status === "ask_user_for_input" &&
                        nodes[0].input_wait != "completed"
                    ) {
                        inputWait = nodes[0].input_wait;
                        inputWait.nodeId = nodes[0].id;
                        inputWait.runId = runs[0].id;
                    }
                }
            }

            res.json({
                success: true,
                data: {
                    status:
                        runStatusCopy === "completed"
                            ? "completed"
                            : runStatusCopy === "error"
                            ? "error"
                            : runStatusCopy === "pending"
                            ? "scheduled"
                            : "running",
                    detailedStatus: runStatus,
                    inputWait,
                    liveStatus,
                },
            });
        } catch (e) {
            console.log(e);
            res.json({ success: false, error: e.message });
        }
    }
);

// Get task run result
router.get(
    "/task/:taskId/run/:runId?/result",
    cors(),
    validateApiKey,
    async (req, res) => {
        const { taskId } = req.params;
        const runId = req.params.runId;

        if (!taskId) {
            return res.json({ success: false, error: "Task ID is required" });
        }

        try {
            const tasksDB = await db.getTasksDB();

            // If runId is not provided, get the most recent run
            let finalRunId = runId;
            if (!finalRunId) {
                const { rows: recentRuns } = await tasksDB.query(
                    `SELECT id FROM browserable.runs 
                WHERE flow_id = $1 AND account_id = $2 
                ORDER BY created_at DESC LIMIT 1`,
                    [taskId, req.account_id]
                );
                if (recentRuns.length > 0) {
                    finalRunId = recentRuns[0].id;
                } else {
                    return res.json({
                        success: true,
                        data: {
                            status: null,
                            error: null,
                            output: null,
                            dataTable: [],
                        },
                    });
                }
            }

            // Get run details
            const { rows: runs } = await tasksDB.query(
                `SELECT status, error, output 
            FROM browserable.runs 
            WHERE id = $1 AND flow_id = $2 AND account_id = $3`,
                [finalRunId, taskId, req.account_id]
            );

            if (runs.length === 0) {
                return res.json({
                    success: true,
                    data: {
                        status: null,
                        error: null,
                        output: null,
                        dataTable: [],
                    },
                });
            }

            // Get results table documents
            const { documents } = await getDocumentsFromDataTable({
                flowId: taskId,
                accountId: req.account_id,
                userId: req.user_id,
                page: 1,
                pageSize: 100,
            });

            // remove _id, flowId, accountId from documents
            documents.forEach((document) => {
                delete document._id;
                delete document.flowId;
                delete document.accountId;
                delete document.subTask;
            });

            res.json({
                success: true,
                data: {
                    status:
                        runs[0].status === "pending"
                            ? "scheduled"
                            : runs[0].status === "completed"
                            ? "completed"
                            : runs[0].status === "error"
                            ? "error"
                            : "running",
                    ...(runs[0].error && { error: runs[0].error }),
                    ...(runs[0].output && { output: runs[0].output }),
                    dataTable: documents,
                },
            });
        } catch (e) {
            console.log(e);
            res.json({ success: false, error: e.message });
        }
    }
);

// Stop a task run
router.put(
    "/task/:taskId/run/:runId?/stop",
    cors(),
    validateApiKey,
    async (req, res) => {
        const { taskId } = req.params;
        let runId = req.params.runId;

        if (!taskId) {
            return res.json({ success: false, error: "Task ID is required" });
        }

        try {
            const tasksDB = await db.getTasksDB();
            if (!runId) {
                const { rows: recentRuns } = await tasksDB.query(
                    `SELECT id FROM browserable.runs 
                WHERE flow_id = $1 AND account_id = $2 
                ORDER BY created_at DESC LIMIT 1`,
                    [taskId, req.account_id]
                );
                if (recentRuns.length > 0) {
                    runId = recentRuns[0].id;
                } else {
                    return res.json({
                        success: false,
                        error: "Run ID is required",
                    });
                }
            }

            // get the run details
            const { rows: runs } = await tasksDB.query(
                `SELECT id, status FROM browserable.runs 
            WHERE id = $1 AND flow_id = $2 AND account_id = $3`,
                [runId, taskId, req.account_id]
            );

            if (runs.length === 0) {
                return res.json({ success: false, error: "Run not found" });
            }

            const run = runs[0];

            if (run.status === "completed" || run.status === "error") {
                return res.json({
                    success: false,
                    error: "Run already completed",
                });
            }

            await endRun({
                runId,
                userId: req.user_id,
                accountId: req.account_id,
                error: "API abort",
                status: "error",
            });

            res.json({ success: true });
        } catch (e) {
            console.log(e);
            res.json({ success: false, error: e.message });
        }
    }
);

// Get all runs for a task
router.get("/task/:taskId/runs", cors(), validateApiKey, async (req, res) => {
    const { taskId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 30, 30);

    if (!taskId) {
        return res.json({ success: false, error: "Task ID is required" });
    }

    try {
        const tasksDB = await db.getTasksDB();
        const { rows: runs } = await tasksDB.query(
            `SELECT id, created_at FROM browserable.runs 
            WHERE flow_id = $1 AND account_id = $2 
            ORDER BY created_at DESC
            LIMIT $3 OFFSET $4`,
            [taskId, req.account_id, limit, (page - 1) * limit]
        );

        const totalRuns = await tasksDB.query(
            `SELECT COUNT(*) FROM browserable.runs 
            WHERE flow_id = $1 AND account_id = $2`,
            [taskId, req.account_id]
        );

        res.json({
            success: true,
            data: runs,
            total: totalRuns.rows[0].count,
            page,
            limit,
        });
    } catch (e) {
        console.log(e);
        res.json({ success: false, error: e.message });
    }
});

// List all tasks
router.get("/tasks", cors(), validateApiKey, async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 30, 30);

    try {
        const tasksDB = await db.getTasksDB();
        const { rows: tasks } = await tasksDB.query(
            `SELECT id, status, readable_name FROM browserable.flows 
            WHERE account_id = $1
            ORDER BY created_at DESC
            LIMIT $2 OFFSET $3`,
            [req.account_id, limit, (page - 1) * limit]
        );

        const totalTasks = await tasksDB.query(
            `SELECT COUNT(*) FROM browserable.flows 
            WHERE account_id = $1`,
            [req.account_id]
        );

        res.json({
            success: true,
            data: tasks,
            total: totalTasks.rows[0].count,
            page,
            limit,
        });
    } catch (e) {
        console.log(e);
        res.json({ success: false, error: e.message });
    }
});

// Stop a task
router.put("/task/:taskId/stop", cors(), validateApiKey, async (req, res) => {
    const { taskId } = req.params;

    if (!taskId) {
        return res.json({ success: false, error: "Task ID is required" });
    }

    try {
        const tasksDB = await db.getTasksDB();

        // get the current status of the task
        const { rows: tasks } = await tasksDB.query(
            `SELECT status FROM browserable.flows 
            WHERE id = $1 AND account_id = $2`,
            [taskId, req.account_id]
        );

        if (tasks.length === 0) {
            return res.json({ success: false, error: "Task not found" });
        }

        const task = tasks[0];

        if (task.status === "inactive") {
            return res.json({ success: false, error: "Task already stopped" });
        }

        await changeFlowStatus({
            flowId: taskId,
            userId: req.user_id,
            accountId: req.account_id,
            status: "inactive",
            currentStatus: task.status,
        });

        res.json({
            success: true,
        });
    } catch (e) {
        console.log(e);
        res.json({ success: false, error: e.message });
    }
});

// Get GIF status for a run
router.get("/task/:taskId/run/:runId?/gif", cors(), validateApiKey, async (req, res) => {
    const { taskId } = req.params;
    const runId = req.params.runId;

    if (!taskId) {
        return res.json({ success: false, error: "Task ID is required" });
    }

    try {
        const result = await getGifStatus({
            flowId: taskId,
            runId,
            accountId: req.account_id
        });

        res.json(result);
    } catch (e) {
        console.log(e);
        res.json({ success: false, error: e.message });
    }
});

router.get("/check", cors(), validateApiKey, async (req, res) => {
    res.json({ success: true, data: "ok" });
});

router.get("/health", cors(), async (req, res) => {
    res.json({ success: true, data: "ok" });
});

module.exports = router;
