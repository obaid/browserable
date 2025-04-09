const db = require("../../services/db");
const {
    integrationsQueue,
    vectorQueue,
    flowQueue,
    agentQueue,
} = require("../../services/queue");
const { google } = require("googleapis");
const crypto = require("crypto");
const axios = require("axios");
const axiosInstance = axios.create({
    withCredentials: true,
});

// Add a job to the integrations queue that runs every 30 minutes to refresh all the tokens for "oauth2" integrations
integrationsQueue.add(
    "refreshOauth2Tokens",
    {},
    {
        repeat: {
            every: 30 * 60 * 1000,
        },
    }
);

integrationsQueue.process("refreshOauth2Tokens", async (job, done) => {
    // get all the users with "oauth2" integrations
    const tasksDB = await db.getTasksDB();
    const { rows } = await tasksDB.query(
        `SELECT user_id, account_id, integration FROM browserable.integrations WHERE type = 'oauth2'`
    );
    // add a child job for each user and integration
    for (const row of rows) {
        integrationsQueue.add(
            "refreshOauth2TokensChild",
            { user_id: row.user_id, account_id: row.account_id, integration: row.integration },
            {
                removeOnComplete: true,
                removeOnFail: false,
            }
        );
    }
    done();
});

integrationsQueue.process("refreshOauth2TokensChild", async (job, done) => {
    const { user_id, account_id, integration } = job.data;
    console.log(
        `Refreshing tokens for user ${user_id} and integration ${integration}`
    );

    // get the tokens for this user and integration
    const tokens = await getTokens({ user_id, account_id, integration, type: "oauth2" });

    if (integration === "gmail") {
        const { refresh_token } = tokens;

        const REDIRECT_URI = `http${process.env.HTTPS_DOMAIN ? "s" : ""}://${
            process.env.DOMAIN
        }/integrations/gmail/login-redirect`;

        const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            REDIRECT_URI
        );

        oauth2Client.setCredentials({
            refresh_token,
        });

        try {
            const { credentials } = await oauth2Client.refreshAccessToken();

            await upsertTokens({
                user_id,
                account_id,
                integration,
                type: "oauth2",
                tokens: credentials,
            });
        } catch (error) {
            console.error(`Error refreshing token for user ${user_id}:`, error);
        }
    } else if (integration === "sheets") {
        const { refresh_token } = tokens;

        const REDIRECT_URI = `http${process.env.HTTPS_DOMAIN ? "s" : ""}://${
            process.env.DOMAIN
        }/integrations/sheets/login-redirect`;

        const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            REDIRECT_URI
        );

        oauth2Client.setCredentials({
            refresh_token,
        });

        try {
            const { credentials } = await oauth2Client.refreshAccessToken();

            await upsertTokens({
                user_id,
                account_id,
                integration,
                type: "oauth2",
                tokens: credentials,
            });
        } catch (error) {
            console.error(`Error refreshing token for user ${user_id}:`, error);
        }
    } else if (integration === "discord") {
        const { refresh_token } = tokens;

        try {
            const params = new URLSearchParams();
            params.append("client_id", process.env.DISCORD_CLIENT_ID);
            params.append("client_secret", process.env.DISCORD_CLIENT_SECRET);
            params.append("grant_type", "refresh_token");
            params.append("refresh_token", refresh_token);

            const response = await axiosInstance.post(
                "https://discord.com/api/oauth2/token",
                params,
                {
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                    },
                }
            );

            const newTokens = response.data;

            if (response.status !== 200) {
                throw new Error(
                    `Discord responded with ${
                        response.status
                    }: ${JSON.stringify(newTokens)}`
                );
            }

            await upsertTokens({
                user_id,
                account_id,
                integration,
                type: "oauth2",
                tokens: newTokens,
            });
        } catch (error) {
            console.error(
                `Error refreshing Discord token for user ${user_id}:`,
                error
            );
        }
    } else if (integration === "x") {
        const { refresh_token } = tokens;

        const getBasicAuthCode = () => {
            const auth = Buffer.from(`${process.env.X_CLIENT_ID}:${process.env.X_CLIENT_SECRET}`).toString("base64");
            return `Basic ${auth}`;
        }

        try {
            const params = new URLSearchParams();
            params.append("client_id", process.env.X_CLIENT_ID);
            // params.append("client_secret", process.env.X_CLIENT_SECRET);
            params.append("grant_type", "refresh_token");
            params.append("refresh_token", refresh_token);

            const response = await axiosInstance.post(
                "https://api.x.com/2/oauth2/token",
                params,
                {
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                        Authorization: getBasicAuthCode(),
                    },
                }
            );

            const newTokens = response.data;

            if (response.status !== 200) {
                throw new Error(`X responded with ${response.status}: ${JSON.stringify(newTokens)}`);
            }

            await upsertTokens({
                user_id,
                account_id,
                integration,
                type: "oauth2",
                tokens: newTokens,
            });
        } catch (error) {
            console.error(`Error refreshing X token for user ${user_id}:`, error);
        }
    }

    done();
});

integrationsQueue.process("process-event", 4, async (job, done) => {
    const { user_id, account_id, event_id, event_data } = job.data;
    processEvent({ user_id, account_id, event_id, event_data });
    done();
});

integrationsQueue.process("process-file", async (job, done) => {
    const {
        user_id,
        account_id,
        file_type,
        file_sub_type,
        file_extension,
        file_source,
        parsed_txt,
        original_ref,
        created_at,
    } = job.data;

    const tasksDB = await db.getTasksDB();

    if (file_type === "text") {
        // for now we only support text files

        // for few file types, we need to parse to create the content. see if that is the case.
        if (file_sub_type === "email") {
            // parsed_txt is already present. nothing much for us to do. schedule upsert to DB.
        }

        // TODO: (other file types)

        // first we upsert the file to the DB. check constraint on user_id, file_source and original_ref. if it already exists, we skip.
        const { rows } = await tasksDB.query(
            `SELECT id FROM browserable.files WHERE account_id = $1 AND file_source = $2 AND original_ref = $3`,
            [account_id, file_source, original_ref]
        );
        if (rows.length > 0) {
            done();
            return;
        }

        const id = crypto.randomUUID();

        // upsert the file to the DB
        await tasksDB.query(
            `INSERT INTO browserable.files (id, user_id, account_id, file_type, file_sub_type, file_source, file_extension, parsed_txt, original_ref, created_at, saved_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
            [
                id,
                user_id,
                account_id,
                file_type,
                file_sub_type,
                file_source,
                file_extension,
                parsed_txt,
                original_ref,
                new Date(created_at),
                new Date(),
            ]
        );

        // now we need to schedule a job for vectorization
        vectorQueue.add("vectorize-file", {
            user_id,
            account_id,
            file_id: id,
        });
    }

    done();
});

async function upsertTokens({ user_id, account_id, tokens, integration, type }) {
    // upsert the tokens in the database for this user and integration
    const tasksDB = await db.getTasksDB();
    await tasksDB.query(
        `INSERT INTO browserable.integrations (user_id, account_id, integration, type, tokens) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (account_id, integration, type) DO UPDATE SET tokens = EXCLUDED.tokens`,
        [user_id, account_id, integration, type, JSON.stringify(tokens)]
    );
}

async function getTokens({ user_id, account_id, integration, type }) {
    const tasksDB = await db.getTasksDB();
    const { rows } = await tasksDB.query(
        `SELECT tokens FROM browserable.integrations WHERE account_id = $1 AND integration = $2 AND type = $3`,
        [account_id, integration, type]
    );
    return rows[0].tokens;
}

async function getMetadataOfUser({ user_id, account_id, integration, type }) {
    const tasksDB = await db.getTasksDB();
    const { rows } = await tasksDB.query(
        `SELECT metadata FROM browserable.integrations WHERE account_id = $1 AND integration = $2 AND type = $3`,
        [account_id, integration, type]
    );
    return rows[0].metadata;
}

async function upsertMetadataOfUser({ user_id, account_id, metadata, integration, type }) {
    const tasksDB = await db.getTasksDB();
    await tasksDB.query(
        `INSERT INTO browserable.integrations (account_id, user_id, integration, type, metadata) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (account_id, integration, type) DO UPDATE SET metadata = EXCLUDED.metadata`,
        [account_id, user_id, integration, type, JSON.stringify(metadata)]
    );
}

async function processEvent({ user_id, event_id, event_data, account_id }) {
    // find all the flows with event.once|<event_id>| present in triggers column and status active
    const tasksDB = await db.getTasksDB();

    const { rows: flows } = await tasksDB.query(
        `SELECT * FROM browserable.flows 
         WHERE (CAST(triggers AS JSONB) @> $1::JSONB 
                OR CAST(triggers AS JSONB) @> $2::JSONB) 
           AND status = 'active' 
           AND account_id = $3`,
        [`["event.once|${event_id}|"]`, `["event.every|${event_id}|"]`, account_id]
    );

    console.log(
        `Found ${flows.length} flows for event ${event_id} for account ${account_id}`
    );

    for (const flow of flows) {
        const { id, task, triggers, data } = flow;

        let stringEventData = "";

        // if event_data is an object, convert it to a string
        if (typeof event_data === "object") {
            stringEventData = JSON.stringify(event_data);
        } else {
            stringEventData = event_data;
        }

        // For a once-trigger, there is no input
        flowQueue.add(
            "create-run",
            {
                userId: user_id,
                accountId: account_id,
                flowId: id,
                input: flow.task,
                triggerInput: `Event ${event_id} triggered with data: ${stringEventData}`,
                triggerType: "event",
            },
            {
                delay: 0,
                removeOnComplete: true,
            }
        );
    }

    // get nodes that has trigger_wait = event.once|<event_id>|
    const { rows: nodes } = await tasksDB.query(
        `SELECT * FROM browserable.nodes WHERE trigger_wait = $1`,
        [`event.once|${event_id}|`]
    );

    for (const node of nodes) {
        agentQueue.add(
            "process-trigger",
            {
                runId: node.run_id,
                nodeId: node.id,
                triggerWaitId: node.trigger_wait,
                triggerData: event_data,
            },
            {
                jobId: `${node.run_id}-${node.id}-process-trigger`,
                removeOnComplete: true,
            }
        );
    }
}

module.exports = {
    upsertTokens,
    getTokens,
    getMetadataOfUser,
    upsertMetadataOfUser,
    processEvent,
};
