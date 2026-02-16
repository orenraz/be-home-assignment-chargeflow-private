import type { Pool } from "pg";
import { getOrderSnapshot } from "../repositories/orderSnapshotRepo";
import { isReadyToScore } from "./isReadyToScore";
import { calculateRisk } from "./calculateRisk";
import { computeExpiresAt } from "./ttl";
import { upsertRiskScore } from "../repositories/riskScoresWriteRepo";

export async function recomputeRiskIfReady(
  pool: Pool,
  merchantId: string,
  orderId: string
): Promise<{ recomputed: boolean; score?: number }> {
  const snapshot = await getOrderSnapshot(pool, merchantId, orderId);
  if (!isReadyToScore(snapshot)) return { recomputed: false };

  const computedAt = new Date();
  const expiresAt = computeExpiresAt(computedAt);

  const result = await calculateRisk(pool, snapshot!);
  await upsertRiskScore(
    pool,
    merchantId,
    orderId,
    result.score,
    result.signals,
    computedAt,
    expiresAt
  );

  return { recomputed: true, score: result.score };
}