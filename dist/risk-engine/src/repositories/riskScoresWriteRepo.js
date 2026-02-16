"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.upsertRiskScore = upsertRiskScore;
async function upsertRiskScore(pool, merchantId, orderId, score, signals, computedAt, expiresAt) {
    await pool.query(`
    INSERT INTO risk_scores (
      merchant_id, order_id, score, signals, computed_at, expires_at
    ) VALUES ($1,$2,$3,$4::jsonb,$5,$6)
    ON CONFLICT (merchant_id, order_id) DO UPDATE
    SET
      score = EXCLUDED.score,
      signals = EXCLUDED.signals,
      computed_at = EXCLUDED.computed_at,
      expires_at = EXCLUDED.expires_at
    `, [
        merchantId,
        orderId,
        score,
        JSON.stringify(signals),
        computedAt,
        expiresAt,
    ]);
}
