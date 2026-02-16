import type { Pool } from "pg";
import pino from "pino";

const logger = pino();

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
  try {
    const res = await pool.query<RiskScoreRow>(
      `
      SELECT merchant_id, order_id, score, signals, computed_at, expires_at
      FROM risk_scores
      WHERE merchant_id = $1 AND order_id = $2
      LIMIT 1
      `,
      [merchantId, orderId]
    );

    if (res.rows.length === 0) {
      logger.info({
        msg: "No risk score found",
        merchantId,
        orderId,
      });
      return null;
    }

    logger.info({
      msg: "Risk score found",
      merchantId,
      orderId,
      score: res.rows[0].score,
    });

    return res.rows[0];
  } catch (error) {
    logger.error({
      msg: "Error querying risk scores",
      merchantId,
      orderId,
      error,
    });
    throw error;
  }
}