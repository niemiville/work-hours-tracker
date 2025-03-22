import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Set PostgreSQL and Node.js to use UTC for consistent timestamp handling
process.env.PGTZ = 'UTC';
process.env.TZ = 'UTC';

const pool = new Pool({
  user: process.env.DB_USER || 'user',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'workhours',
  password: process.env.DB_PASSWORD || 'password',
  port: Number(process.env.DB_PORT) || 5432,
});

export default pool;
