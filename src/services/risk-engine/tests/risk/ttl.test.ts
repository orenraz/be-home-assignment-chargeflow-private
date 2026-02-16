import { calculateExpiresAt } from "../../src/risk/ttl";

describe("TTL Helper Functions", () => {
  it("should calculate expiresAt correctly", () => {
    const createdAt = new Date("2026-02-16T00:00:00Z");
    const ttlSeconds = 86400; // 1 day

    const expiresAt = calculateExpiresAt(createdAt, ttlSeconds);

    expect(expiresAt.toISOString()).toBe("2026-02-17T00:00:00.000Z");
  });

  it("should handle zero TTL correctly", () => {
    const createdAt = new Date("2026-02-16T00:00:00Z");
    const ttlSeconds = 0;

    const expiresAt = calculateExpiresAt(createdAt, ttlSeconds);

    expect(expiresAt).toBeNull();
  });
});