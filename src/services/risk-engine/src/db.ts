import { Pool } from 'pg';

const pool = new Pool({
  user: process.env.POSTGRES_USER || 'chargeflow',
  host: process.env.POSTGRES_HOST || 'localhost',
  database: process.env.POSTGRES_DB || 'chargeflow',
  password: process.env.POSTGRES_PASSWORD || 'chargeflow',
  port: Number(process.env.POSTGRES_PORT || '5432'),
});

export const getPool = () => pool;

export async function closePool(): Promise<void> {
  // Implement logic to close the database connection pool
  console.log("Closing database connection pool...");
}
