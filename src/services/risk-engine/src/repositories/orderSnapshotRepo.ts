import type { Pool } from "pg";
import { TOPICS, type TopicName } from "../validation/eventSchemas";

export type UpsertSnapshotInput = {
  merchantId: string;
  orderId: string;
  topic: TopicName;
  occurredAt: Date | null;
  data: unknown; // topic-specific data payload (event.data)
};

function isValidDate(d: Date | null): d is Date {
  return !!d && !Number.isNaN(d.getTime());
}

export async function upsertOrderSnapshot(
  pool: Pool,
  input: UpsertSnapshotInput
): Promise<void> {
  const occurredAt = isValidDate(input.occurredAt) ? input.occurredAt : null;

  if (input.topic === TOPICS.orders) {
    await pool.query(
      `
      INSERT INTO order_snapshot (
        merchant_id, order_id,
        order_data, order_occurred_at,
        updated_at
      ) VALUES ($1, $2, $3::jsonb, $4, now())
      ON CONFLICT (merchant_id, order_id) DO UPDATE
      SET
        order_data = CASE
          WHEN order_snapshot.order_occurred_at IS NULL OR $4 IS NULL OR $4 >= order_snapshot.order_occurred_at
          THEN EXCLUDED.order_data
          ELSE order_snapshot.order_data
        END,
        order_occurred_at = CASE
          WHEN order_snapshot.order_occurred_at IS NULL OR $4 IS NULL OR $4 >= order_snapshot.order_occurred_at
          THEN EXCLUDED.order_occurred_at
          ELSE order_snapshot.order_occurred_at
        END,
        updated_at = now()
      `,
      [input.merchantId, input.orderId, JSON.stringify(input.data), occurredAt]
    );
    return;
  }

  if (input.topic === TOPICS.payments) {
    await pool.query(
      `
      INSERT INTO order_snapshot (
        merchant_id, order_id,
        payment_data, payment_occurred_at,
        updated_at
      ) VALUES ($1, $2, $3::jsonb, $4, now())
      ON CONFLICT (merchant_id, order_id) DO UPDATE
      SET
        payment_data = CASE
          WHEN order_snapshot.payment_occurred_at IS NULL OR $4 IS NULL OR $4 >= order_snapshot.payment_occurred_at
          THEN EXCLUDED.payment_data
          ELSE order_snapshot.payment_data
        END,
        payment_occurred_at = CASE
          WHEN order_snapshot.payment_occurred_at IS NULL OR $4 IS NULL OR $4 >= order_snapshot.payment_occurred_at
          THEN EXCLUDED.payment_occurred_at
          ELSE order_snapshot.payment_occurred_at
        END,
        updated_at = now()
      `,
      [input.merchantId, input.orderId, JSON.stringify(input.data), occurredAt]
    );
    return;
  }

  if (input.topic === TOPICS.disputes) {
    await pool.query(
      `
      INSERT INTO order_snapshot (
        merchant_id, order_id,
        dispute_data, dispute_occurred_at,
        updated_at
      ) VALUES ($1, $2, $3::jsonb, $4, now())
      ON CONFLICT (merchant_id, order_id) DO UPDATE
      SET
        dispute_data = CASE
          WHEN order_snapshot.dispute_occurred_at IS NULL OR $4 IS NULL OR $4 >= order_snapshot.dispute_occurred_at
          THEN EXCLUDED.dispute_data
          ELSE order_snapshot.dispute_data
        END,
        dispute_occurred_at = CASE
          WHEN order_snapshot.dispute_occurred_at IS NULL OR $4 IS NULL OR $4 >= order_snapshot.dispute_occurred_at
          THEN EXCLUDED.dispute_occurred_at
          ELSE order_snapshot.dispute_occurred_at
        END,
        updated_at = now()
      `,
      [input.merchantId, input.orderId, JSON.stringify(input.data), occurredAt]
    );
    return;
  }
}

export type OrderSnapshotRow = {
  merchant_id: string;
  order_id: string;
  order_data: unknown | null;
  order_occurred_at: Date | null;
  payment_data: unknown | null;
  payment_occurred_at: Date | null;
  dispute_data: unknown | null;
  dispute_occurred_at: Date | null;
  updated_at: Date;
};

export async function getOrderSnapshot(
  pool: Pool,
  merchantId: string,
  orderId: string
): Promise<OrderSnapshotRow | null> {
  const res = await pool.query<OrderSnapshotRow>(
    `
    SELECT merchant_id, order_id,
           order_data, order_occurred_at,
           payment_data, payment_occurred_at,
           dispute_data, dispute_occurred_at,
           updated_at
    FROM order_snapshot
    WHERE merchant_id = $1 AND order_id = $2
    LIMIT 1
    `,
    [merchantId, orderId]
  );
  return res.rows[0] ?? null;
}