"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTtlSeconds = getTtlSeconds;
exports.computeExpiresAt = computeExpiresAt;
function getTtlSeconds() {
    const raw = process.env.RISK_SCORE_TTL_SECONDS;
    const parsed = raw ? Number(raw) : 3600;
    if (!Number.isFinite(parsed) || parsed <= 0)
        return 3600;
    return Math.floor(parsed);
}
function computeExpiresAt(computedAt) {
    const ttlSec = getTtlSeconds();
    return new Date(computedAt.getTime() + ttlSec * 1000);
}
