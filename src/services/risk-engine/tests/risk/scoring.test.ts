import { calculateRisk } from "../../src/risk/calculateRisk.js";
import { Pool } from "pg";
import { ipVelocityScore, deviceReuseScore, emailDomainReputationScore, binCountryMismatchScore, chargebackHistoryScore } from "@chargeflow/risk-signals";

jest.mock("@chargeflow/risk-signals", () => ({
  ipVelocityScore: jest.fn(() => 10),
  deviceReuseScore: jest.fn(() => 15),
  emailDomainReputationScore: jest.fn(() => 20),
  binCountryMismatchScore: jest.fn(() => 5),
  chargebackHistoryScore: jest.fn(() => 0),
}));

describe("Risk Scoring", () => {
  let pool: Pool;

  beforeEach(() => {
    pool = {} as Pool; // Mocked pool
    jest.clearAllMocks();
  });

  it("should calculate risk score within 0-100 range", async () => {
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

    const result = await calculateRisk(pool, snapshot);

    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(Object.keys(result.signals)).toEqual([
      "ipVelocityScore",
      "deviceReuseScore",
      "emailDomainReputationScore",
      "binCountryMismatchScore",
      "chargebackHistoryScore",
    ]);
  });
});