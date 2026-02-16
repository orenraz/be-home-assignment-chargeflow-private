import type { Pool } from "pg";

export async function getRecentIpsForMerchant(
  pool: Pool,
  merchantId: string,
  limit = 50
): Promise<string[]> {
  const res = await pool.query<{ ip: string }>(
    `
    SELECT (order_data->>'ip_address') AS ip
    FROM order_snapshot
    WHERE merchant_id = $1
      AND order_data IS NOT NULL
      AND (order_data->>'ip_address') IS NOT NULL
    ORDER BY updated_at DESC
    LIMIT $2
    `,
    [merchantId, limit]
  );
  return res.rows.map((r) => r.ip).filter(Boolean);
}

export async function getKnownDevicesForMerchant(
  pool: Pool,
  merchantId: string,
  limit = 200
): Promise<string[]> {
  const res = await pool.query<{ device: string }>(
    `
    SELECT (order_data->>'device_fingerprint') AS device
    FROM order_snapshot
    WHERE merchant_id = $1
      AND order_data IS NOT NULL
      AND (order_data->>'device_fingerprint') IS NOT NULL
    ORDER BY updated_at DESC
    LIMIT $2
    `,
    [merchantId, limit]
  );
  return res.rows.map((r) => r.device).filter(Boolean);
}

export async function merchantHasRecentChargebacks(
  pool: Pool,
  merchantId: string,
  days = 90
): Promise<boolean> {
  const res = await pool.query<{ exists: boolean }>(
    `
    SELECT EXISTS (
      SELECT 1
      FROM order_snapshot
      WHERE merchant_id = $1
        AND dispute_data IS NOT NULL
        AND updated_at >= now() - ($2::text || ' days')::interval
    ) AS exists
    `,
    [merchantId, String(days)]
  );
  return !!res.rows[0]?.exists;
}