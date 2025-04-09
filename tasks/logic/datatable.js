const mongodb = require("../services/mongodb");
const db = require("../services/db");

async function addDocumentsToDataTable({ flowId, accountId, dtRows }) {
    const connection = await mongodb.getConnection();
    const collection = connection.collection("data-table");

    // get how many rows are in the data table.
    let count = await collection.countDocuments({ flowId, accountId });

    for (const dtRow of dtRows) {
        // add this document to the data table
        // add flowId, accountId to dtRows
        dtRow.flowId = flowId;
        dtRow.accountId = accountId;
        dtRow.rowId = count + 1;
        count++;
    }

    await collection.insertMany(dtRows);

    return dtRows;
}

async function updateDocumentInDataTable({ flowId, accountId, rowId, dtRow }) {
    // dtRow is an object with key-vals to update
    const connection = await mongodb.getConnection();
    const collection = connection.collection("data-table");
    await collection.updateOne({ flowId, accountId, rowId }, { $set: dtRow });
}

async function getDocumentsFromDataTable({
    flowId,
    accountId,
    page,
    pageSize,
}) {
    const connection = await mongodb.getConnection();
    const collection = connection.collection("data-table");
    // assume each document has rowId number from 1 to n
    // get the documents from rowId (page * pageSize) to (page * pageSize + pageSize)
    // we need to return the documents and the total number of documents
    const total = await collection.countDocuments({
        flowId,
        accountId,
    });
    const documents = await collection
        .find({ flowId, accountId })
        .sort({ rowId: 1 })
        .skip(Math.max(0, (page - 1) * pageSize))
        .limit(pageSize)
        .toArray();
    return { documents, total };
}

async function getDocumentsFromDataTableByFilter({
    flowId,
    accountId,
    filters,
    page,
    pageSize,
}) {
    const connection = await mongodb.getConnection();
    const collection = connection.collection("data-table");
    const documents = await collection
        .find({ flowId, accountId, ...filters })
        .sort({ rowId: 1 })
        .skip(Math.max(0, (page - 1) * pageSize))
        .limit(pageSize)
        .toArray();
    const total = await collection.countDocuments({
        flowId,
        accountId,
        ...filters,
    });
    return { documents, total };
}

async function getDocumentsFromDataTableByIds({ flowId, accountId, ids }) {
    const connection = await mongodb.getConnection();
    const collection = connection.collection("data-table");
    const documents = await collection
        .find({ flowId, accountId, rowId: { $in: ids } })
        .toArray();
    return documents;
}

async function getDataTableSchema({ flowId, accountId }) {
    // dtSchema is in metadata of the flow
    const tasksDB = await db.getTasksDB();
    const { rows: flows } = await tasksDB.query(
        `SELECT metadata FROM browserable.flows WHERE id = $1 and account_id = $2`,
        [flowId, accountId]
    );
    if (flows.length === 0) {
        return null;
    }
    const metadata = flows[0].metadata;
    return metadata.dtSchema;
}

async function updateDataTableSchema({ flowId, accountId, dtSchema }) {
    const tasksDB = await db.getTasksDB();
    // first get metadata of the flow
    const { rows: flows } = await tasksDB.query(
        `SELECT metadata FROM browserable.flows WHERE id = $1 and account_id = $2`,
        [flowId, accountId]
    );
    if (flows.length === 0) {
        return null;
    }
    const metadata = flows[0].metadata;
    metadata.dtSchema = dtSchema;
    await tasksDB.query(
        `UPDATE browserable.flows SET metadata = $1 WHERE id = $2 and account_id = $3`,
        [JSON.stringify(metadata), flowId, accountId]
    );
}

module.exports = {
    addDocumentsToDataTable,
    updateDocumentInDataTable,
    getDocumentsFromDataTable,
    getDataTableSchema,
    updateDataTableSchema,
    getDocumentsFromDataTableByIds,
    getDocumentsFromDataTableByFilter,
};
