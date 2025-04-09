const db = require("../services/db");
const { createAPIKey } = require("./api_key");

async function getAccountsOfUser({ userId }) {
    const tasksDB = await db.getTasksDB();
    const { rows } = await tasksDB.query(
        `SELECT * from browserable.accounts WHERE id IN (SELECT account_id FROM browserable.account_users WHERE user_id = $1)`,
        [userId]
    );

    return rows;
}

async function updateAccountMetadata({ accountId, metadata }) {
    const tasksDB = await db.getTasksDB();
    await tasksDB.query(
        `UPDATE browserable.accounts SET metadata = $1 WHERE id = $2`,
        [JSON.stringify(metadata), accountId]
    );
}

async function createAccountForUser({
    userId,
    accountName,
    role,
    metadata,
    emailId,
    possibleExistingAccountId,
    suggestedAccountId,
}) {
    // if accountId is provided, then check if there's an account with that id.
    if (possibleExistingAccountId) {
        const tasksDB = await db.getTasksDB();
        const { rows } = await tasksDB.query(
            `SELECT * FROM browserable.accounts WHERE id = $1`,
            [possibleExistingAccountId]
        );

        if (rows.length > 0) {
            return rows[0].id;
        }
    }

    let accountId = suggestedAccountId;
    if (!accountId) {
        // time to construct the accountId
        if (emailId) {
            // get the part before @
            accountId =
                "@" +
                emailId.split("@")[0].trim().toLowerCase().replace(/ /g, "-");
        } else {
            accountId = accountName
                .trim()
                .toLowerCase()
                .replace(/ /g, "-")
                .replace(/[^a-z0-9@-]/g, "");
        }
    } else {
        accountId = accountId
            .trim()
            .toLowerCase()
            .replace(/ /g, "-")
            .replace(/[^a-z0-9@-]/g, "");
    }

    const tasksDB = await db.getTasksDB();

    while (true) {
        const { rows } = await tasksDB.query(
            `SELECT * FROM browserable.accounts WHERE id = $1`,
            [accountId]
        );

        if (rows.length === 0) {
            break;
        }

        accountId = `${accountId}${Math.random()
            .toString(36)
            .substring(2, 15)}`;
    }

    await tasksDB.query(
        `INSERT INTO browserable.accounts (id, name, metadata) VALUES ($1, $2, $3)`,
        [accountId, accountName, metadata]
    );

    await addUserToAccount({ userId, accountId, role });

    // Create an API key for admin users
    if (role === "admin") {
        await createAPIKey({
            userId,
            accountId,
            name: "Admin API Key",
            metadata: {
                createdBy: "system",
                userId,
            },
        });
    }

    return accountId;
}

async function getAccountUsers({ accountId, userId }) {
    const tasksDB = await db.getTasksDB();
    const { rows } = await tasksDB.query(
        `SELECT * FROM browserable.account_users WHERE account_id = $1`,
        [accountId]
    );

    // check if the user is an admin
    const isAdmin = rows.some(
        (row) => row.user_id === userId && row.role === "admin"
    );

    if (isAdmin) {
        return rows;
    } else {
        // remove admins from the rows
        return rows.filter((row) => row.role !== "admin");
    }
}

async function getAccountPermissions({ userId, accountId }) {
    const tasksDB = await db.getTasksDB();
    const { rows } = await tasksDB.query(
        `SELECT * FROM browserable.account_users WHERE user_id = $1 AND account_id = $2`,
        [userId, accountId]
    );

    if (rows.length === 0) {
        return null;
    }

    return rows[0].role;
}

async function addUserToAccount({ userId, emailId, accountId, role }) {
    const tasksDB = await db.getTasksDB();

    if (userId) {
        await tasksDB.query(
            `INSERT INTO browserable.account_users (user_id, account_id, role) VALUES ($1, $2, $3)`,
            [userId, accountId, role]
        );
    } else {
        // find the user_id with the email_id
        const { rows } = await tasksDB.query(
            `SELECT * FROM browserable.users WHERE email = $1`,
            [emailId]
        );

        if (rows.length > 0) {
            try {
                userId = rows[0].id;
                await tasksDB.query(
                    `INSERT INTO browserable.account_users (user_id, account_id, role) VALUES ($1, $2, $3)`,
                    [userId, accountId, role]
                );
            } catch (e) {
                console.log(e);
            }
        } else {
        }
    }
}

async function getAccount({ accountId, userId }) {
    const access = await getAccountPermissions({ userId, accountId });

    if (access === null) {
        return null;
    }

    const tasksDB = await db.getTasksDB();
    const { rows } = await tasksDB.query(
        `SELECT * FROM browserable.accounts WHERE id = $1`,
        [accountId]
    );

    return rows[0];
}

module.exports = {
    getAccountsOfUser,
    createAccountForUser,
    getAccountUsers,
    getAccountPermissions,
    addUserToAccount,
    getAccount,
    updateAccountMetadata
};
