"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.findRiskScore = findRiskScore;
const pino_1 = __importDefault(require("pino"));
const logger = (0, pino_1.default)();
async function findRiskScore(pool, merchantId, orderId) {
    try {
        const res = await pool.query(`
      SELECT merchant_id, order_id, score, signals, computed_at, expires_at
      FROM risk_scores
      WHERE merchant_id = $1 AND order_id = $2
      LIMIT 1
      `, [merchantId, orderId]);
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
    }
    catch (error) {
        logger.error({
            msg: "Error querying risk scores",
            merchantId,
            orderId,
            error,
        });
        throw error;
    }
}
