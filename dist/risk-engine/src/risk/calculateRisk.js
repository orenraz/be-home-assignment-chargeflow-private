"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateRisk = calculateRisk;
const risk_signals_1 = require("@chargeflow/risk-signals");
const featuresRepo_1 = require("../repositories/featuresRepo");
function clamp0to20(n) {
    if (!Number.isFinite(n))
        return 0;
    return Math.max(0, Math.min(20, Math.round(n)));
}
function clamp0to100(n) {
    if (!Number.isFinite(n))
        return 0;
    return Math.max(0, Math.min(100, Math.round(n)));
}
async function calculateRisk(pool, snapshot) {
    const merchantId = snapshot.merchant_id;
    const order = snapshot.order_data;
    const payment = snapshot.payment_data;
    // Required fields from order/payment
    const ip = String(order?.ip_address ?? "");
    const deviceFingerprint = String(order?.device_fingerprint ?? "");
    const email = String(order?.email ?? "");
    const billingCountry = String(order?.billing_country ?? "");
    const binCountry = String(payment?.binCountry ?? payment?.bin_country ?? "");
    // History features (assumptions: merchant-level windows)
    const [recentIps, knownDevices, hasChargebacks] = await Promise.all([
        (0, featuresRepo_1.getRecentIpsForMerchant)(pool, merchantId, 50),
        (0, featuresRepo_1.getKnownDevicesForMerchant)(pool, merchantId, 200),
        (0, featuresRepo_1.merchantHasRecentChargebacks)(pool, merchantId, 90),
    ]);
    const s1 = clamp0to20((0, risk_signals_1.ipVelocityScore)(recentIps, ip));
    const s2 = clamp0to20((0, risk_signals_1.deviceReuseScore)(knownDevices, deviceFingerprint));
    const s3 = clamp0to20((0, risk_signals_1.emailDomainReputationScore)(email));
    const s4 = clamp0to20((0, risk_signals_1.binCountryMismatchScore)(billingCountry, binCountry));
    const s5 = clamp0to20((0, risk_signals_1.chargebackHistoryScore)(hasChargebacks));
    const signals = {
        ipVelocityScore: s1,
        deviceReuseScore: s2,
        emailDomainReputationScore: s3,
        binCountryMismatchScore: s4,
        chargebackHistoryScore: s5,
    };
    const total = clamp0to100(s1 + s2 + s3 + s4 + s5);
    return { score: total, signals };
}
