import { Pool } from "pg";

export async function cleanupExpiredScores(pool: Pool) {
  if (process.env.ENABLE_CLEANUP !== "true") {
    console.log("Cleanup job is disabled.");
    return;
  }

  console.log("Running cleanup job...");
  try {
    const result = await pool.query(
      "DELETE FROM risk_scores WHERE expires_at < NOW() RETURNING id;"
    );
    console.log(`Cleanup job removed ${result.rowCount} expired scores.`);
  } catch (err) {
    console.error("Error during cleanup job:", err);
  }
}

export function calculateExpiresAt(computedAt: Date): Date {
  const ttlSec = getTtlSeconds();
  return new Date(computedAt.getTime() + ttlSec * 1000);
}

export function getTtlSeconds(): number {
  const raw = process.env.RISK_SCORE_TTL_SECONDS;
  const parsed = raw ? Number(raw) : 3600;
  if (!Number.isFinite(parsed) || parsed <= 0) return 3600;
  return Math.floor(parsed);
}