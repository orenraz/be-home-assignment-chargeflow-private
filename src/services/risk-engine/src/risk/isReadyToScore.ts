import type { OrderSnapshotRow } from "../repositories/orderSnapshotRepo.js";

export function isReadyToScore(snapshot: OrderSnapshotRow | null): boolean {
  if (!snapshot) return false;

  // Minimum: order + payment exist.
  return !!snapshot.order_data && !!snapshot.payment_data;
}