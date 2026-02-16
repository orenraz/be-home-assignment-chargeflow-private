import type { Pool } from "pg";
import { errorResponse, jsonResponse } from "../http";
import { findRiskScore } from "../repositories/riskScoresRepo";

export async function handleGetRiskScore(
  pool: Pool,
  merchantId: string,
  orderId: string
): Promise<Response> {
  const row = await findRiskScore(pool, merchantId, orderId);

  if (!row) {
    return errorResponse(404, "RISK_SCORE_NOT_FOUND", "Risk score not found", {
      merchantId,
      orderId,
    });
  }

  const now = new Date();
  if (row.expires_at <= now) {
    return errorResponse(
      410,
      "RISK_SCORE_EXPIRED",
      "Risk score exists but is expired",
      {
        merchantId,
        orderId,
        expiredAt: row.expires_at.toISOString(),
      }
    );
  }

  return jsonResponse({
    merchantId: row.merchant_id,
    orderId: row.order_id,
    score: row.score,
    signals: row.signals ?? {},
    computedAt: row.computed_at.toISOString(),
    expiresAt: row.expires_at.toISOString(),
  });
}