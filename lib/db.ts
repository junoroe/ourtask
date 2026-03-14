import { Pool, PoolClient } from 'pg';

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'ourtask',
  user: process.env.DB_USER || 'ourtask',
  password: process.env.DB_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export function query(text: string, params?: any[]) {
  return pool.query(text, params);
}

export function getClient(): Promise<PoolClient> {
  return pool.connect();
}
