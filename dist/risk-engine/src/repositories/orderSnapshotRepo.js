"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.upsertOrderSnapshot = upsertOrderSnapshot;
exports.getOrderSnapshot = getOrderSnapshot;
const eventSchemas_1 = require("../validation/eventSchemas");
function isValidDate(d) {
    return !!d && !Number.isNaN(d.getTime());
}
function handleUpsertQuery(topic, occurredAt, data) {
    return `
    INSERT INTO order_snapshot (
      merchant_id, order_id,
      ${topic}_data, ${topic}_occurred_at,
      updated_at
    ) VALUES ($1, $2, $3::jsonb, $4, now())
    ON CONFLICT (merchant_id, order_id) DO UPDATE
    SET
      ${topic}_data = CASE
        WHEN order_snapshot.${topic}_occurred_at IS NULL OR $4 IS NULL OR $4 >= order_snapshot.${topic}_occurred_at
        THEN EXCLUDED.${topic}_data
        ELSE order_snapshot.${topic}_data
      END,
      ${topic}_occurred_at = CASE
        WHEN order_snapshot.${topic}_occurred_at IS NULL OR $4 IS NULL OR $4 >= order_snapshot.${topic}_occurred_at
        THEN EXCLUDED.${topic}_occurred_at
        ELSE order_snapshot.${topic}_occurred_at
      END,
      updated_at = now()
  `;
}
async function upsertOrderSnapshot(pool, input) {
    const occurredAt = isValidDate(input.occurredAt) ? input.occurredAt : null;
    if (input.topic === eventSchemas_1.TOPICS.orders) {
        await pool.query(handleUpsertQuery(eventSchemas_1.TOPICS.orders, occurredAt, input.data));
        return;
    }
    if (input.topic === eventSchemas_1.TOPICS.payments) {
        await pool.query(handleUpsertQuery(eventSchemas_1.TOPICS.payments, occurredAt, input.data));
        return;
    }
    if (input.topic === eventSchemas_1.TOPICS.disputes) {
        await pool.query(handleUpsertQuery(eventSchemas_1.TOPICS.disputes, occurredAt, input.data));
        return;
    }
}
async function getOrderSnapshot(pool, merchantId, orderId) {
    const res = await pool.query(`
    SELECT merchant_id, order_id,
           order_data, order_occurred_at,
           payment_data, payment_occurred_at,
           dispute_data, dispute_occurred_at,
           updated_at
    FROM order_snapshot
    WHERE merchant_id = $1 AND order_id = $2
    LIMIT 1
    `, [merchantId, orderId]);
    return res.rows[0] ?? null;
}
