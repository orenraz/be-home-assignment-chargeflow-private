import type { Pool } from "pg";

export type RiskScoreRow = {
  merchant_id: string;
  order_id: string;
  score: number;
  signals: unknown;
  computed_at: Date;
  expires_at: Date;
};

export async function findRiskScore(
  pool: Pool,
  merchantId: string,
  orderId: string
): Promise<RiskScoreRow | null> {
  const res = await pool.query<RiskScoreRow>(
    `
    SELECT merchant_id, order_id, score, signals, computed_at, expires_at
    FROM risk_scores
    WHERE merchant_id = $1 AND order_id = $2
    LIMIT 1
    `,
    [merchantId, orderId]
  );
  return res.rows[0] ?? null;
}