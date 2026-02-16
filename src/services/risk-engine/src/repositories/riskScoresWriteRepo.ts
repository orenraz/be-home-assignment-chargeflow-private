import type { Pool } from "pg";

export async function upsertRiskScore(
  pool: Pool,
  merchantId: string,
  orderId: string,
  score: number,
  signals: Record<string, number>,
  computedAt: Date,
  expiresAt: Date
): Promise<void> {
  await pool.query(
    `
    INSERT INTO risk_scores (
      merchant_id, order_id, score, signals, computed_at, expires_at
    ) VALUES ($1,$2,$3,$4::jsonb,$5,$6)
    ON CONFLICT (merchant_id, order_id) DO UPDATE
    SET
      score = EXCLUDED.score,
      signals = EXCLUDED.signals,
      computed_at = EXCLUDED.computed_at,
      expires_at = EXCLUDED.expires_at
    `,
    [
      merchantId,
      orderId,
      score,
      JSON.stringify(signals),
      computedAt,
      expiresAt,
    ]
  );
}