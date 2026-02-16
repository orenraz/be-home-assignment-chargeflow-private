import { z } from "zod";

/**
 * Common envelope shape from docs: { id, type, occurred_at, data }
 * We validate strictly enough to be safe, but allow unknown extra fields
 * by default to avoid brittleness if generator adds fields.
 */

const occurredAt = z
  .string()
  .datetime({ offset: true })
  .or(z.string()); // if generator emits without offset sometimes

const baseEnvelope = z.object({
  id: z.string().min(1),
  type: z.string().min(1),
  occurred_at: occurredAt,
  data: z.unknown(),
});

/** orders.v1 */
export const orderDataSchema = z.object({
  merchant_id: z.string().min(1),
  order_id: z.string().min(1),
  txn_id: z.string().min(1),
  customer_id: z.string().min(1),
  amt: z.number(),
  billing_country: z.string().min(2),
  ip_address: z.string().min(3),
  device_fingerprint: z.string().min(3),
  email: z.string().email(),
});

export const orderEventSchema = baseEnvelope.extend({
  data: orderDataSchema,
});

/** payments.v1 (note camelCase fields in examples) */
export const paymentDataSchema = z.object({
  merchantId: z.string().min(1),
  orderId: z.string().min(1),
  paymentId: z.string().min(1),
  binCountry: z.string().min(2),
});

export const paymentEventSchema = baseEnvelope.extend({
  data: paymentDataSchema,
});

/** disputes.v1 */
export const disputeDataSchema = z.object({
  merchant_id: z.string().min(1),
  order_id: z.string().min(1),
  dispute_id: z.string().min(1),
  reason_code: z.string().min(1),
});

export const disputeEventSchema = baseEnvelope.extend({
  data: disputeDataSchema,
});

export type OrderEvent = z.infer<typeof orderEventSchema>;
export type PaymentEvent = z.infer<typeof paymentEventSchema>;
export type DisputeEvent = z.infer<typeof disputeEventSchema>;

export type AnyEvent = OrderEvent | PaymentEvent | DisputeEvent;

export const TOPICS = {
  orders: "orders.v1",
  payments: "payments.v1",
  disputes: "disputes.v1",
} as const;

export type TopicName = (typeof TOPICS)[keyof typeof TOPICS];