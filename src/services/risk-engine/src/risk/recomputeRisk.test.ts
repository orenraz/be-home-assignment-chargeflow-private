import { recomputeRisk } from "./recomputeRisk";
import { Pool } from "pg";
import { upsertRiskScore } from "../repositories/riskScoresWriteRepo";
import { calculateRisk } from "./calculateRisk";

jest.mock("../repositories/riskScoresWriteRepo", () => ({
  upsertRiskScore: jest.fn(),
}));

jest.mock("./calculateRisk", () => ({
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

    await recomputeRisk(pool, snapshot);

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