import type { Pool } from "pg";
import {
  ipVelocityScore,
  deviceReuseScore,
  emailDomainReputationScore,
  binCountryMismatchScore,
  chargebackHistoryScore,
} from "@chargeflow/risk-signals";

import type { OrderSnapshotRow } from "../repositories/orderSnapshotRepo";
import {
  getKnownDevicesForMerchant,
  getRecentIpsForMerchant,
  merchantHasRecentChargebacks,
} from "../repositories/featuresRepo";

type SignalsBreakdown = Record<string, number>;

function clamp0to20(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(20, Math.round(n)));
}

function clamp0to100(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

export type RiskResult = {
  score: number;
  signals: SignalsBreakdown;
};

export async function calculateRisk(
  pool: Pool,
  snapshot: OrderSnapshotRow
): Promise<RiskResult> {
  const merchantId = snapshot.merchant_id;

  const order = snapshot.order_data as any;
  const payment = snapshot.payment_data as any;

  // Required fields from order/payment
  const ip = String(order?.ip_address ?? "");
  const deviceFingerprint = String(order?.device_fingerprint ?? "");
  const email = String(order?.email ?? "");
  const billingCountry = String(order?.billing_country ?? "");
  const binCountry = String(payment?.binCountry ?? payment?.bin_country ?? "");

  // History features (assumptions: merchant-level windows)
  const [recentIps, knownDevices, hasChargebacks] = await Promise.all([
    getRecentIpsForMerchant(pool, merchantId, 50),
    getKnownDevicesForMerchant(pool, merchantId, 200),
    merchantHasRecentChargebacks(pool, merchantId, 90),
  ]);

  const s1 = clamp0to20(ipVelocityScore(recentIps.join(","), ip)); // Pass array directly
  const s2 = clamp0to20(deviceReuseScore(knownDevices.join(","), deviceFingerprint)); // Pass array directly
  const s3 = clamp0to20(emailDomainReputationScore(email));
  const s4 = clamp0to20(binCountryMismatchScore(billingCountry, binCountry));
  const s5 = clamp0to20(chargebackHistoryScore(merchantId, hasChargebacks ? "1" : "0"));

  const signals: SignalsBreakdown = {
    ipVelocityScore: s1,
    deviceReuseScore: s2,
    emailDomainReputationScore: s3,
    binCountryMismatchScore: s4,
    chargebackHistoryScore: s5,
  };

  const total = clamp0to100(s1 + s2 + s3 + s4 + s5);

  return { score: total, signals };
}