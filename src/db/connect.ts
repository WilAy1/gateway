import { Pool } from 'pg';
import { env } from '../utils/env';

// Create a new Pool instance
const pool = new Pool({
  user: env.DB_USER,
  host: env.DB_HOST,
  port: parseInt(env.DB_PORT as string, 10), // Default PostgreSQL port
  database: env.DB_NAME,
  password: env.DB_PASS
});

export default pool;