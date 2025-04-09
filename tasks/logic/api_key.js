const db = require("../services/db");
const crypto = require("crypto");

async function createAPIKey({ accountId, userId, name, metadata = {} }) {
    const tasksDB = await db.getTasksDB();
    
    // Generate a secure random API key
    const apiKey = crypto.randomBytes(32).toString('hex');
    
    const id = crypto.randomUUID();
    const date = new Date();
    
    await tasksDB.query(
        `INSERT INTO browserable.api_keys (id, account_id, user_id, api_key, name, created_at, metadata) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [id, accountId, userId, apiKey, name, date, JSON.stringify(metadata)]
    );
    
    return { id, apiKey };
}

async function getAPIKeys({ accountId }) {
    const tasksDB = await db.getTasksDB();
    
    const { rows } = await tasksDB.query(
        `SELECT id, name, api_key, created_at, last_used_at, metadata FROM browserable.api_keys WHERE account_id = $1 ORDER BY created_at DESC`,
        [accountId]
    );
    
    return rows;
}

async function deleteAPIKey({ accountId, apiKeyId }) {
    const tasksDB = await db.getTasksDB();
    
    await tasksDB.query(
        `DELETE FROM browserable.api_keys WHERE id = $1 AND account_id = $2`,
        [apiKeyId, accountId]
    );
    
    return true;
}

module.exports = {
    createAPIKey,
    getAPIKeys,
    deleteAPIKey
}; 