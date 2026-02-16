import type { Pool } from "pg";

export type InsertEventInput = {
  eventId: string;
  topic: string;
  partition?: number;
  offset?: string; // KafkaJS offset is string
  occurredAt?: Date | null;
  merchantId?: string | null;
  orderId?: string | null;
  payload: unknown; // full parsed JSON
};

// Add validation for InsertEventInput
function validateInsertEventInput(input: InsertEventInput): boolean {
  if (!input.eventId || !input.topic || !input.payload) {
    throw new Error("Invalid event input: Missing required fields");
  }
  return true;
}

export async function insertEventIdempotent(
  pool: Pool,
  input: InsertEventInput
): Promise<{ inserted: boolean }> {
  try {
    const res = await pool.query(
      `
      INSERT INTO events (
        event_id, topic, partition, offset, occurred_at, merchant_id, order_id, payload
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb)
      ON CONFLICT (event_id) DO NOTHING
      `,
      [
        input.eventId,
        input.topic,
        input.partition ?? null,
        input.offset ?? null,
        input.occurredAt ?? null,
        input.merchantId ?? null,
        input.orderId ?? null,
        JSON.stringify(input.payload),
      ]
    );

    return { inserted: res.rowCount === 1 };
  } catch (error) {
    console.error("Failed to insert event", error);
    throw error;
  }
}