const db = require("../services/db");

const { v4: uuidv4 } = require("uuid");

const { baseQueue } = require("../services/queue");
const { customDomainSetupEmail } = require("../logic/email");
const axios = require("axios");
const hri = require("human-readable-ids").hri;

// add a job that runs every 2 hours and removed old login tokens
baseQueue.add(
    "removeOldLoginTokens",
    {},
    {
        repeat: {
            every: 2 * 60 * 60 * 1000,
        },
    }
);

baseQueue.process("removeOldLoginTokens", async (job, done) => {
    const tasksDB = await db.getTasksDB();

    // remove all otps that are older than 30 days
    await tasksDB.query(
        `DELETE FROM browserable.login_token WHERE created_at < NOW() - INTERVAL '30 days'`
    );

    done();
});

async function getUserById(id) {
    const tasksDB = await db.getTasksDB();
    const { rows } = await tasksDB.query(
        `SELECT * FROM browserable.users WHERE id = $1`,
        [id]
    );
    return rows[0];
}

// function to get users
async function getUserFromToken({ token, fingerprint, allowWithoutFingerprint = false }) {
    const tasksDB = await db.getTasksDB();

    if (!token) return null;
    if (!fingerprint && !allowWithoutFingerprint) return null;

    const client = await tasksDB.connect();
    const { rows } = await client.query(
        `SELECT * FROM browserable.login_token WHERE uuid = $1`,
        [token]
    );

    if (rows.length > 0) {
        const loginTokens = rows[0];

        if ((fingerprint && fingerprint == loginTokens.fingerprint) || allowWithoutFingerprint) {
            // get the user of this login token
            const { rows: users } = await client.query(
                `SELECT * FROM browserable.users WHERE id = $1`,
                [loginTokens.user_id]
            );

            if (users.length > 0) {
                client.release();
                return users[0];
            } else {
                // delete the token from DB
                await client.query(
                    `DELETE FROM browserable.login_token WHERE uuid = $1`,
                    [token]
                );

                client.release();
                return null;
            }
        } else {
            // delete the token from DB
            await client.query(
                `DELETE FROM browserable.login_token WHERE uuid = $1`,
                [token]
            );

            client.release();
            return null;
        }
    } else {
        client.release();
        return null;
    }
}

async function doesLoginTokenExist({ token, fingerprint }) {
    const tasksDB = await db.getTasksDB();

    const { rows } = await tasksDB.query(
        `SELECT * FROM browserable.login_token WHERE uuid = $1 AND fingerprint = $2`,
        [token, fingerprint]
    );

    return rows.length > 0;
}

// function to create login token for user
async function createLoginToken({ email, fingerprint, ip_address }) {
    const tasksDB = await db.getTasksDB();
    const client = await tasksDB.connect();

    // get the user
    const { rows: users } = await client.query(
        `SELECT * FROM browserable.users WHERE processed_email = $1`,
        [email.toLowerCase().split(".").join("")]
    );

    if (users.length > 0) {
        const user = users[0];

        // create a random uuid token
        const token = uuidv4();

        // insert the token in DB
        await client.query(
            `INSERT INTO browserable.login_token (uuid, user_id, ip_address, fingerprint, created_at) VALUES ($1, $2, $3, $4, $5)`,
            [token, user.id, ip_address, fingerprint, new Date()]
        );

        client.release();
        return token;
    } else {
        client.release();
        throw new Error("User does not exist");
    }
}

async function deleteLoginToken({ fingerprint }) {
    const tasksDB = await db.getTasksDB();
    await tasksDB.query(
        `DELETE FROM browserable.login_token WHERE fingerprint = $1`,
        [fingerprint]
    );
}

// function to create user
async function createUser({ email, settings = {} }) {
    const tasksDB = await db.getTasksDB();
    let user_id = "";

    // check if user already exists
    const { rows } = await tasksDB.query(
        `SELECT * FROM browserable.users WHERE processed_email = $1`,
        [(email || "").toLowerCase().split(".").join("")]
    );

    if (rows.length == 0) {
        // create user
        const { rows: newUser } = await tasksDB.query(
            `INSERT INTO browserable.users (email, processed_email, created_at, settings) VALUES ($1, $2, $3, $4) RETURNING id`,
            [email, email.toLowerCase().split(".").join(""), new Date(), settings]
        );

        user_id = newUser[0].id;
    } else {
        user_id = rows[0].id;
    }

    return user_id;
}

async function setUserDetails({ name, pic, user_id, settings }) {
    const tasksDB = await db.getTasksDB();

    console.log("setUserDetails", name, user_id, pic, settings);

    try {
        await tasksDB.query(
            `UPDATE browserable.users SET name = $1, pic = $2, settings = $3 WHERE id = $4`,
            [name, pic, settings, user_id]
        );

        return {
            success: true,
        };
    } catch (e) {
        console.log(e);
        return {
            success: false,
            error: e.message,
        };
    }
}

module.exports = {
    getUserFromToken,
    getUserById,
    createLoginToken,
    doesLoginTokenExist,
    createUser,
    setUserDetails,
    deleteLoginToken,
};