const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function setup() {
  try {
    await pool.query('CREATE EXTENSION IF NOT EXISTS vector;');
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS relationships (
        id SERIAL PRIMARY KEY,
        relationship_code TEXT UNIQUE,
        partner1 BIGINT,
        partner2 BIGINT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        relationship_id INTEGER REFERENCES relationships(id),
        sender BIGINT,
        emotion TEXT,
        conflict_level TEXT,
        content TEXT,
        is_crisis BOOLEAN DEFAULT FALSE,
        crisis_type TEXT,
        is_escalation BOOLEAN DEFAULT FALSE,
        severity TEXT DEFAULT 'low',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_crisis BOOLEAN DEFAULT FALSE;
      ALTER TABLE messages ADD COLUMN IF NOT EXISTS crisis_type TEXT;
      ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_escalation BOOLEAN DEFAULT FALSE;
      ALTER TABLE messages ADD COLUMN IF NOT EXISTS severity TEXT DEFAULT 'low';
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS message_embeddings (
        id SERIAL PRIMARY KEY,
        message_id INTEGER REFERENCES messages(id),
        embedding vector(1024)
      );
    `);
    console.log('✅ pgvector and schema setup complete');
  } catch (err) {
    console.error('❌ setup failed:', err);
  } finally {
    await pool.end();
  }
}

setup();
