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

jest.mock("../../src/repositories/featuresRepo", () => ({
  getRecentIpsForMerchant: jest.fn(() => ["192.168.1.1"]),
  getKnownDevicesForMerchant: jest.fn(() => ["device-1"]),
  merchantHasRecentChargebacks: jest.fn(() => false),
}));

describe("Risk Calculator", () => {
  let pool: Pool;

  beforeEach(() => {
    pool = {} as Pool; // Mocked pool
    jest.clearAllMocks();
  });

  it("should calculate risk score and signals", async () => {
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

    expect(result).toEqual({
      score: 50,
      signals: {
        ipVelocityScore: 10,
        deviceReuseScore: 15,
        emailDomainReputationScore: 20,
        binCountryMismatchScore: 5,
        chargebackHistoryScore: 0,
      },
    });

    expect(ipVelocityScore).toHaveBeenCalledWith(["192.168.1.1"], "192.168.1.1");
    expect(deviceReuseScore).toHaveBeenCalledWith(["device-1"], "device-1");
    expect(emailDomainReputationScore).toHaveBeenCalledWith("test@example.com");
    expect(binCountryMismatchScore).toHaveBeenCalledWith("US", "US");
    expect(chargebackHistoryScore).toHaveBeenCalledWith(false);
  });
});