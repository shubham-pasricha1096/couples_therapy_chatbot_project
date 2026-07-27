"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createEmbedding = createEmbedding;
exports.storeMessageEmbedding = storeMessageEmbedding;
exports.findSimilarMessages = findSimilarMessages;
const axios_1 = __importDefault(require("axios"));
const config_1 = __importDefault(require("../utils/config"));
const db_1 = require("../database/db");
async function createEmbedding(text) {
    try {
        const response = await axios_1.default.post('https://openrouter.ai/api/v1/embeddings', {
            model: 'nvidia/llama-nemotron-embed-vl-1b-v2:free',
            input: text
        }, {
            headers: {
                'Authorization': `Bearer ${config_1.default.openRouterApiKey}`,
                'Content-Type': 'application/json'
            }
        });
        return response.data.data[0].embedding;
    }
    catch (err) {
        console.error('Embedding error:', err.response?.data || err.message);
        return [];
    }
}
async function storeMessageEmbedding(messageId, text) {
    const embedding = await createEmbedding(text);
    if (embedding.length === 0)
        return;
    try {
        await db_1.pool.query('INSERT INTO message_embeddings (message_id, embedding) VALUES ($1, $2)', [messageId, `[${embedding.join(',')}]`]);
    }
    catch (err) {
        console.error('Error storing embedding:', err.message);
    }
}
async function findSimilarMessages(relId, text, limit = 5) {
    const embedding = await createEmbedding(text);
    if (embedding.length === 0)
        return [];
    try {
        const result = await db_1.pool.query(`SELECT m.content
       FROM message_embeddings me
       JOIN messages m ON me.message_id = m.id
       WHERE m.relationship_id = $1
       ORDER BY me.embedding <=> $2
       LIMIT $3`, [relId, `[${embedding.join(',')}]`, limit]);
        return result.rows.map((r) => r.content);
    }
    catch (err) {
        console.error('Error finding similar messages:', err.message);
        return [];
    }
}
