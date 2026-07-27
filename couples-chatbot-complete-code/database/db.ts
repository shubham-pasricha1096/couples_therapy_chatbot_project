import { Pool } from 'pg';
import config from '../utils/config';

const pool = new Pool({
  connectionString: config.databaseUrl
});

pool.query('SELECT NOW()')
  .then(res => console.log('✅ PostgreSQL connected:', res.rows[0]))
  .catch(err => console.error('❌ PostgreSQL error:', err));

export default pool;
export { pool };
