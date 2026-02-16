"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recomputeRiskIfReady = recomputeRiskIfReady;
const orderSnapshotRepo_1 = require("../repositories/orderSnapshotRepo");
const isReadyToScore_1 = require("./isReadyToScore");
const calculateRisk_1 = require("./calculateRisk");
const ttl_1 = require("./ttl");
const riskScoresWriteRepo_1 = require("../repositories/riskScoresWriteRepo");
async function recomputeRiskIfReady(pool, merchantId, orderId) {
    const snapshot = await (0, orderSnapshotRepo_1.getOrderSnapshot)(pool, merchantId, orderId);
    if (!(0, isReadyToScore_1.isReadyToScore)(snapshot))
        return { recomputed: false };
    const computedAt = new Date();
    const expiresAt = (0, ttl_1.computeExpiresAt)(computedAt);
    const result = await (0, calculateRisk_1.calculateRisk)(pool, snapshot);
    await (0, riskScoresWriteRepo_1.upsertRiskScore)(pool, merchantId, orderId, result.score, result.signals, computedAt, expiresAt);
    return { recomputed: true, score: result.score };
}
