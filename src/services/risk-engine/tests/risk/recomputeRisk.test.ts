import { recomputeRiskIfReady as recomputeRisk } from "../../src/risk/recomputeRisk";
import { Pool } from "pg";
import { upsertRiskScore } from "../../src/repositories/riskScoresWriteRepo";
import { calculateRisk } from "../../src/risk/calculateRisk";
import { Kafka } from "kafkajs";

jest.mock("../../src/repositories/riskScoresWriteRepo", () => ({
  upsertRiskScore: jest.fn(),
}));

jest.mock("../../src/risk/calculateRisk", () => ({
  calculateRisk: jest.fn(() => ({
    score: 50,
    signals: {
      ipVelocityScore: 10,
      deviceReuseScore: 15,
      emailDomainReputationScore: 20,
      binCountryMismatchScore: 5,
      chargebackHistoryScore: 0,
    },
  })),
}));

jest.mock("kafkajs", () => {
  return {
    Kafka: jest.fn(() => ({
      consumer: jest.fn(() => ({
        connect: jest.fn(),
        subscribe: jest.fn(),
        run: jest.fn(),
      })),
    })),
  };
});

describe("Recompute Risk", () => {
  let pool: Pool;

  beforeEach(() => {
    pool = {} as Pool; // Mocked pool
    jest.clearAllMocks();
  });

  it("should recompute risk and upsert the score", async () => {
    const snapshot = {
      merchant_id: "merchant-1",
      order_data: {
        ip_address: "192.168.1.1",
        device_fingerprint: "device-1",
        email: "test@example.com",
        billing_country: "US",
      },
      payment_data: {
        binCountry: "US",
      },
    } as any;

    const merchantId = snapshot.merchantId;
    const orderId = snapshot.orderId;
    await recomputeRisk(pool, merchantId, orderId);

    expect(calculateRisk).toHaveBeenCalledWith(pool, snapshot);
    expect(upsertRiskScore).toHaveBeenCalledWith(pool, "merchant-1", {
      score: 50,
      signals: {
        ipVelocityScore: 10,
        deviceReuseScore: 15,
        emailDomainReputationScore: 20,
        binCountryMismatchScore: 5,
        chargebackHistoryScore: 0,
      },
    });
  });
});