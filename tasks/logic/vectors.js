const db = require("../services/db");
const { vectorQueue } = require("../services/queue");
const CHUNK_SIZE = 1500;
const tiktoken = require("tiktoken");
const enc = tiktoken.encoding_for_model("text-embedding-3-small");
const crypto = require("crypto");
const textEncoding = require('text-encoding');
const TextDecoder = textEncoding.TextDecoder;

async function callOpenAiDirectlyForEmbeddings(text) {

    if (!text) {
        return null;
    }

    // use http rest api call directly
    const response = await fetch("https://api.openai.com/v1/embeddings", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({ input: text, model: "text-embedding-3-small" }),
    });
    return response.json();
}


async function vectorizeFile({ user_id, file_id, account_id }) {
    const tasksDB = await db.getTasksDB();
    const { rows } = await tasksDB.query(`SELECT * FROM browserable.files WHERE id = $1`, [file_id]);
    const file = rows[0];

    // now get the parsed_txt from the file
    const parsed_txt = file.parsed_txt || "";

    if (parsed_txt.length === 0) {
        done();
        return;
    }

    // Tokenize the text
    const tokens = enc.encode(parsed_txt);
        
    // Chunk the tokens into segments of CHUNK_SIZE
    const chunks = [];
    for (let i = 0; i < tokens.length; i += CHUNK_SIZE) {
        const chunkTokens = tokens.slice(i, i + CHUNK_SIZE);
        const chunkText = new TextDecoder().decode(enc.decode(chunkTokens));

        chunks.push(chunkText);
    }

    // Generate embeddings using Ada Small
    for (const [index, chunk] of chunks.entries()) {
        if (chunk.length === 0) {
            continue;
        }
        const embeddingResponse = await callOpenAiDirectlyForEmbeddings(chunk);

        const vector = embeddingResponse.data[0].embedding;
        const chunkId = crypto.randomUUID();

        // save the chunk to the DB
        await tasksDB.query(
            `INSERT INTO browserable.file_chunks (file_id, user_id, account_id, index, chunk_text, id, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [file_id, user_id, account_id, index, chunk, chunkId, new Date()]
        );

        // save the chunk to the Qdrant
        // TODO: (SAVE TO SUPA VECTOR)
        // await QdrantClient.insertFileVector({
        //     user_id,
        //     account_id,
        //     file_id,
        //     file_source: file.file_source,
        //     file_type: file.file_type,
        //     file_sub_type: file.file_sub_type,
        //     file_extension: file.file_extension,
        //     created_at: file.created_at,
        //     chunk_id: chunkId,
        //     chunk_vector: vector,
        // });
    }
}

async function getSimilarFileChunksHelper({
    user_id,
    account_id,
    file_source,
    input_text,
    max_results = 10,
}) {

    if (!input_text) {
        return [];
    }

    const embeddingResponse = await callOpenAiDirectlyForEmbeddings(input_text || "");
    const vector = embeddingResponse.data[0].embedding;

    // TODO: (GET FROM SUPA VECTOR)
    // const similarChunks = await QdrantClient.getSimilarVectors({
    //     // user_id,
    //     account_id,
    //     file_source,
    //     vector,
    //     max_results,
    // });

    // return similarChunks.map(chunk => chunk.id);
}

async function getChunkTextsFromIdsHelper({
    user_id,
    account_id,
    chunk_ids,
}) {
    const tasksDB = await db.getTasksDB();
    // filter the chunk_ids that MUST BE in UUID format
    const filteredChunkIds = chunk_ids.filter(id => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(id));
    const { rows } = await tasksDB.query(`SELECT chunk_text FROM browserable.file_chunks WHERE account_id = $1 AND id IN (${filteredChunkIds.map(id => `'${id}'`).join(",")})`, [account_id]);
    return rows;
}


vectorQueue.process("vectorize-file", async (job, done) => {
    const { user_id, account_id, file_id } = job.data;
    await vectorizeFile({ user_id, account_id, file_id });
    done();
});

module.exports = {
    vectorizeFile,
    getSimilarFileChunksHelper,
    getChunkTextsFromIdsHelper
}