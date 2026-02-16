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

function handleUpsertQuery(topic: TopicName, occurredAt: Date | null, data: unknown) {
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

export async function upsertOrderSnapshot(
  pool: Pool,
  input: UpsertSnapshotInput
): Promise<void> {
  const occurredAt = isValidDate(input.occurredAt) ? input.occurredAt : null;

  if (input.topic === TOPICS.orders) {
    await pool.query(
      handleUpsertQuery(TOPICS.orders, occurredAt, input.data)
    );
    return;
  }

  if (input.topic === TOPICS.payments) {
    await pool.query(
      handleUpsertQuery(TOPICS.payments, occurredAt, input.data)
    );
    return;
  }

  if (input.topic === TOPICS.disputes) {
    await pool.query(
      handleUpsertQuery(TOPICS.disputes, occurredAt, input.data)
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