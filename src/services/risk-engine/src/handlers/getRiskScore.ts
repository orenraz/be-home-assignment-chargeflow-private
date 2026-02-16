import type { Pool } from "pg";
import { errorResponse, jsonResponse } from "../http";
import { findRiskScore } from "../repositories/riskScoresRepo";
import pino from "pino";

const logger = pino();

export async function handleGetRiskScore(
  pool: Pool,
  merchantId: string,
  orderId: string
): Promise<Response> {
  try {
    const row = await findRiskScore(pool, merchantId, orderId);

    if (!row) {
      logger.warn({
        msg: "Risk score not found",
        merchantId,
        orderId,
      });
      return errorResponse(404, "RISK_SCORE_NOT_FOUND", "Risk score not found", {
        merchantId,
        orderId,
      });
    }

    const now = new Date();
    if (row.expires_at <= now) {
      logger.warn({
        msg: "Risk score expired",
        merchantId,
        orderId,
        expiredAt: row.expires_at.toISOString(),
      });
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

    logger.info({
      msg: "Risk score retrieved",
      merchantId,
      orderId,
      score: row.score,
    });

    return jsonResponse({
      merchantId: row.merchant_id,
      orderId: row.order_id,
      score: row.score,
      signals: row.signals ?? {},
      computedAt: row.computed_at.toISOString(),
      expiresAt: row.expires_at.toISOString(),
    });
  } catch (error) {
    logger.error({
      msg: "Error retrieving risk score",
      merchantId,
      orderId,
      error,
    });
    return errorResponse(500, "INTERNAL_ERROR", "Unexpected server error");
  }
}