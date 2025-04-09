const db = require("../../services/db");
const { browserQueue, integrationsQueue } = require("../../services/queue");
const browserService = require("../../services/browser");
const { chromium } = require("playwright");

browserQueue.process("turn-off-session", async (job, done) => {
    try {
        const { user_id, account_id, sessionId, eventId } = job.data;
        await doneWithSession({ user_id, account_id, eventId, sessionId });
    } catch (error) {
        console.log("error in turn-off-session", error);
    }
    done();
});

// add a job to browserqueue that checks every 15 mins, all the running requests
browserQueue.add(
    "check-running-sessions-and-close",
    {},
    {
        repeat: {
            every: 30 * 1000,
        },
    }
);

// checks if the corresponding session is still running. If not, it will mark status field as 'complete'
// checks for running sessions, if the corresponding runId, threadId, flowId are all active, if they are not, end the session and mark status field as 'complete'
browserQueue.process("check-running-sessions-and-close", async (job, done) => {
    try {
        const tasksDB = await db.getTasksDB();
        const { rows } = await tasksDB.query(
            `SELECT * FROM browserable.browser_session_requests WHERE status = 'running'`
        );

        for (const row of rows) {
            const { event_id, account_id } = row;
            const session = await browserService.getSessionById({
                sessionId: row.session_id,
            });

            if (!session.running) {
                await tasksDB.query(
                    `UPDATE browserable.browser_session_requests SET status = 'complete' WHERE event_id = $1`,
                    [event_id]
                );
                return;
            }

            const { runId, threadId, flowId } = row.metadata;

            // flowId must be 'active'
            // runId must not be 'complete' or 'error'
            // threadId -- we don't have thread level status tracking at the moment so we can ignore this.
            const {
                rows: [run],
            } = await tasksDB.query(
                `SELECT status FROM browserable.runs WHERE id = $1`,
                [runId]
            );

            const {
                rows: [flow],
            } = await tasksDB.query(
                `SELECT status FROM browserable.flows WHERE id = $1`,
                [flowId]
            );

            if (
                run.status === "completed" ||
                run.status === "error" ||
                flow.status !== "active"
            ) {
                console.log("DONE WITH SESSION 2", account_id, event_id, row.session_id);

                doneWithSession({
                    account_id,
                    eventId: event_id,
                    sessionId: row.session_id,
                });
            }
        }
    } catch (error) {
        console.log("error in check-running-sessions", error);
    }
    done();
});

// Add a job to browserqueue that runs every 30 seconds
// checks for any waiting requests and if there is space in concurrency, and how many ever it can schedule, it kicks off the events.
browserQueue.add(
    "check-waiting-requests",
    {},
    {
        repeat: {
            every: 30 * 1000,
        },
    }
);

browserQueue.process("check-waiting-requests", async (job, done) => {
    try {
        const tasksDB = await db.getTasksDB();
        const { rows } = await tasksDB.query(
            `SELECT * FROM browserable.browser_session_requests WHERE status = 'waiting'`
        );

        const { rows: runningSessions } = await tasksDB.query(
            `SELECT COUNT(*) as count FROM browserable.browser_session_requests WHERE status = 'running'`
        );

        let availableLimit =
            CONCURRENT_BROWSER_SESSIONS - runningSessions[0].count;
        for (const row of rows) {
            if (availableLimit <= 0) {
                break;
            }
            availableLimit--;

            const { event_id, account_id, metadata } = row;

            const { runId, flowId, threadId } = metadata;

            // confirm that the run is not completed or errored and that the flow is active
            const { rows: [run] } = await tasksDB.query(
                `SELECT status FROM browserable.runs WHERE id = $1`,
                [runId]
            );

            const { rows: [flow] } = await tasksDB.query(
                `SELECT status FROM browserable.flows WHERE id = $1`,
                [flowId]
            );

            if (run.status === "complete" || run.status === "error" || flow.status !== "active") {
                // mark this request as complete
                await tasksDB.query(
                    `UPDATE browserable.browser_session_requests SET status = 'complete' WHERE event_id = $1`,
                    [event_id]
                );
                continue;
            }
            
            needNewSession({
                eventId: event_id,
                account_id,
                runId,
                flowId,
                threadId,
            });
        }
    } catch (error) {
        console.log("error in check-waiting-requests", error);
    }
    done();
});

const CONCURRENT_BROWSER_SESSIONS =
    Number(process.env.BROWSER_CONCURRENCY) || 1;

async function needNewSession({
    eventId,
    user_id,
    account_id,
    runId,
    flowId,
    threadId,
}) {
    try {
        const tasksDB = await db.getTasksDB();
        const provider = await browserService.getCurrentProvider();
        const { rows } = await tasksDB.query(
            `SELECT profile_id FROM browserable.browser_sessions WHERE account_id = $1 AND provider = $2`,
            [account_id, provider]
        );

        let profileId = null;

        if (rows.length === 0) {
            // no profile found, we need to create a new one
            profileId = await browserService.getNewProfile();
            await tasksDB.query(
                `INSERT INTO browserable.browser_sessions (account_id, profile_id, provider) VALUES ($1, $2, $3)`,
                [account_id, profileId, provider]
            );
        } else {
            profileId = rows[0].profile_id;
        }

        // check how many browser sessions are 'running' OVERALL
        const { rows: runningSessions } = await tasksDB.query(
            `SELECT COUNT(*) FROM browserable.browser_session_requests WHERE status = 'running'`
        );

        if (runningSessions[0].count >= CONCURRENT_BROWSER_SESSIONS) {
            // is this request already in the DB?
            const {
                rows: [existingRequest],
            } = await tasksDB.query(
                `SELECT * FROM browserable.browser_session_requests WHERE event_id = $1`,
                [eventId]
            );

            if (existingRequest) {
                return;
            }

            // register the request in the DB
            await tasksDB.query(
                `INSERT INTO browserable.browser_session_requests (account_id, event_id, created_at, metadata, status) VALUES ($1, $2, $3, $4, $5)`,
                [
                    account_id,
                    eventId,
                    new Date(),
                    JSON.stringify({ runId, flowId, threadId }),
                    "waiting",
                ]
            );

            return;
        }

        const { success, sessionId, connectUrl, liveUrl } =
            await browserService.getNewSession({
                token: eventId,
                profileId,
                account_id,
            });

        if (success && sessionId) {
            // if the request is already in the DB, we need to update the session_id. if not, then we create a new request.
            const {
                rows: [existingRequest],
            } = await tasksDB.query(
                `SELECT * FROM browserable.browser_session_requests WHERE event_id = $1`,
                [eventId]
            );

            if (existingRequest) {
                await tasksDB.query(
                    `UPDATE browserable.browser_session_requests SET status = 'running', session_id = $1 WHERE event_id = $2`,
                    [sessionId, eventId]
                );
            } else {
                await tasksDB.query(
                    `INSERT INTO browserable.browser_session_requests (account_id, event_id, created_at, metadata, status, session_id) VALUES ($1, $2, $3, $4, $5, $6)`,
                    [
                        account_id,
                        eventId,
                        new Date(),
                        JSON.stringify({ runId, flowId, threadId }),
                        "running",
                        sessionId,
                    ]
                );
            }

            // create a job that runs 45 mins later
            browserQueue.add(
                "turn-off-session",
                {
                    user_id,
                    sessionId,
                    eventId,
                    account_id,
                },
                {
                    delay: 60 * 60 * 1000,
                }
            );

            integrationsQueue.add(
                "process-event",
                {
                    user_id,
                    account_id,
                    event_id: eventId,
                    event_data: {
                        sessionId,
                        connectUrl,
                        liveUrl,
                    },
                },
                {
                    removeOnComplete: false,
                    removeOnFail: false,
                }
            );
        } else {
            // TODO: (SG) throw an alert to admin discord to look into this.
            // TODO: (SG) figure out a better alternative to waiting. We can technically mark a task as error as well.
            // something weird happened.
            // register the request in the DB

            // is this request already in the DB?
            const {
                rows: [existingRequest],
            } = await tasksDB.query(
                `SELECT * FROM browserable.browser_session_requests WHERE event_id = $1`,
                [eventId]
            );

            if (existingRequest) {
                return;
            }

            await tasksDB.query(
                `INSERT INTO browserable.browser_session_requests (account_id, event_id, created_at, metadata, status) VALUES ($1, $2, $3, $4, $5)`,
                [
                    account_id,
                    eventId,
                    new Date(),
                    JSON.stringify({ runId, flowId, threadId }),
                    "waiting",
                ]
            );

            return;
        }

        return profileId;
    } catch (error) {
        console.error("ERROR NEEDING NEW SESSION", error, { eventId, account_id, runId, flowId, threadId });
    }
}


async function doneWithSession({ user_id, account_id, eventId, sessionId }) {
    try {

        const session = await browserService.getSessionById({ sessionId });
        const tasksDB = await db.getTasksDB();

        let context = null;
        if (session.running) {
            context = await browserService.stopSession({
                token: eventId,
                sessionId,
            });
        }

        const provider = await browserService.getCurrentProvider();

        if (context) {
            // save the context to db for future use.
            await tasksDB.query(
                `UPDATE browserable.browser_sessions SET context = $1 WHERE account_id = $2 AND provider = $3`,
                [JSON.stringify(context), account_id, provider]
            );
        }

        // mark the request as complete
        await tasksDB.query(
            `UPDATE browserable.browser_session_requests SET status = 'complete' WHERE event_id = $1`,
            [eventId]
        );
    } catch (error) {
        console.log("error in doneWithSession", error);
    }
}

async function scrapeUrl({ sessionId, url }) {
    // for now scraping a url is directly using the client.
    const scrapedText = await browserService.scrape({
        url,
    });

    return scrapedText;
}

module.exports = {
    needNewSession,
    doneWithSession,
    scrapeUrl,
};
