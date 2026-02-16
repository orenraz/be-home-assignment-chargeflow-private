"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TOPICS = exports.disputeEventSchema = exports.disputeDataSchema = exports.paymentEventSchema = exports.paymentDataSchema = exports.orderEventSchema = exports.orderDataSchema = void 0;
const zod_1 = require("zod");
/**
 * Common envelope shape from docs: { id, type, occurred_at, data }
 * We validate strictly enough to be safe, but allow unknown extra fields
 * by default to avoid brittleness if generator adds fields.
 */
const occurredAt = zod_1.z
    .string()
    .datetime({ offset: true })
    .or(zod_1.z.string()); // if generator emits without offset sometimes
const baseEnvelope = zod_1.z.object({
    id: zod_1.z.string().min(1),
    type: zod_1.z.string().min(1),
    occurred_at: occurredAt,
    data: zod_1.z.unknown(),
});
/** orders.v1 */
exports.orderDataSchema = zod_1.z.object({
    merchant_id: zod_1.z.string().min(1),
    order_id: zod_1.z.string().min(1),
    txn_id: zod_1.z.string().min(1),
    customer_id: zod_1.z.string().min(1),
    amt: zod_1.z.number(),
    billing_country: zod_1.z.string().min(2),
    ip_address: zod_1.z.string().min(3),
    device_fingerprint: zod_1.z.string().min(3),
    email: zod_1.z.string().email(),
});
exports.orderEventSchema = baseEnvelope.extend({
    data: exports.orderDataSchema,
});
/** payments.v1 (note camelCase fields in examples) */
exports.paymentDataSchema = zod_1.z.object({
    merchantId: zod_1.z.string().min(1),
    orderId: zod_1.z.string().min(1),
    paymentId: zod_1.z.string().min(1),
    binCountry: zod_1.z.string().min(2),
});
exports.paymentEventSchema = baseEnvelope.extend({
    data: exports.paymentDataSchema,
});
/** disputes.v1 */
exports.disputeDataSchema = zod_1.z.object({
    merchant_id: zod_1.z.string().min(1),
    order_id: zod_1.z.string().min(1),
    dispute_id: zod_1.z.string().min(1),
    reason_code: zod_1.z.string().min(1),
});
exports.disputeEventSchema = baseEnvelope.extend({
    data: exports.disputeDataSchema,
});
exports.TOPICS = {
    orders: "orders.v1",
    payments: "payments.v1",
    disputes: "disputes.v1",
};
