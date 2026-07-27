import axios from 'axios';
import config from '../utils/config';
import { pool } from '../database/db';

export async function createEmbedding(text: string): Promise<number[]> {
  try {
    const response = await axios.post(
      'https://openrouter.ai/api/v1/embeddings',
      {
        model: 'nvidia/llama-nemotron-embed-vl-1b-v2:free',
        input: text
      },
      {
        headers: {
          'Authorization': `Bearer ${config.openRouterApiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data.data[0].embedding;
  } catch (err: any) {
    console.error('Embedding error:', err.response?.data || err.message);
    return [];
  }
}

export async function storeMessageEmbedding(messageId: number, text: string): Promise<void> {
  const embedding = await createEmbedding(text);
  if (embedding.length === 0) return;

  try {
    await pool.query(
      'INSERT INTO message_embeddings (message_id, embedding) VALUES ($1, $2)',
      [messageId, `[${embedding.join(',')}]`]
    );
  } catch (err: any) {
    console.error('Error storing embedding:', err.message);
  }
}

export async function findSimilarMessages(relId: number, text: string, limit: number = 5): Promise<string[]> {
  const embedding = await createEmbedding(text);
  if (embedding.length === 0) return [];

  try {
    const result = await pool.query(
      `SELECT m.content
       FROM message_embeddings me
       JOIN messages m ON me.message_id = m.id
       WHERE m.relationship_id = $1
       ORDER BY me.embedding <=> $2
       LIMIT $3`,
      [relId, `[${embedding.join(',')}]`, limit]
    );

    return result.rows.map((r: any) => r.content);
  } catch (err: any) {
    console.error('Error finding similar messages:', err.message);
    return [];
  }
}
