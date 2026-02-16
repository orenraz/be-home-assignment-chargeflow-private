"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ttl_1 = require("./ttl");
describe("TTL Helper", () => {
    beforeEach(() => {
        delete process.env.RISK_SCORE_TTL_SECONDS;
    });
    it("should return default TTL if environment variable is not set", () => {
        expect((0, ttl_1.getTtlSeconds)()).toBe(3600);
    });
    it("should return the TTL from environment variable if valid", () => {
        process.env.RISK_SCORE_TTL_SECONDS = "7200";
        expect((0, ttl_1.getTtlSeconds)()).toBe(7200);
    });
    it("should return default TTL if environment variable is invalid", () => {
        process.env.RISK_SCORE_TTL_SECONDS = "invalid";
        expect((0, ttl_1.getTtlSeconds)()).toBe(3600);
    });
    it("should compute expiresAt correctly", () => {
        const computedAt = new Date("2026-02-16T00:00:00Z");
        process.env.RISK_SCORE_TTL_SECONDS = "3600";
        const expiresAt = (0, ttl_1.computeExpiresAt)(computedAt);
        expect(expiresAt.toISOString()).toBe("2026-02-16T01:00:00.000Z");
    });
});
