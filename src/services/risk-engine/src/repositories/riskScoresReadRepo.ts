import { Pool } from "pg";

export async function getRiskScore(pool: Pool, merchantId: string, orderId: string) {
  const result = await pool.query(
    "SELECT * FROM risk_scores WHERE merchant_id = $1 AND order_id = $2",
    [merchantId, orderId]
  );
  return result.rows[0] || null;
}