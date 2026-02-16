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