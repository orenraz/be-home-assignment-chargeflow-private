import { Pool } from "pg";
import pino from "pino";

const logger = pino();

let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
    logger.info("Database pool created");
  }
  return pool;
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    logger.info("Database pool closed");
    pool = null;
  }
}
