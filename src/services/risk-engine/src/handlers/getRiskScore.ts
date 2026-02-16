import type { Pool } from "pg";
import { errorResponse, jsonResponse } from "../http";
import { findRiskScore } from "../repositories/riskScoresRepo";
import pino from "pino";

const logger = pino();

// Update the Json type to include undefined
export type Json = { [key: string]: Json } | string | number | boolean | null | undefined;

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
      signals: row.signals && Object.keys(row.signals).length > 0 ? (row.signals as Json) : undefined, // Ensure compatibility with Json type
      computedAt: row.computed_at.toISOString(), // Convert Date to string
      expiresAt: row.expires_at.toISOString(), // Convert Date to string
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