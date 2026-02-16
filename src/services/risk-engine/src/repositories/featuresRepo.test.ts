import { getRecentIpsForMerchant, getKnownDevicesForMerchant, merchantHasRecentChargebacks } from "./featuresRepo";
import { Pool } from "pg";

jest.mock("pg", () => {
  const mockPool = {
    query: jest.fn(),
  };
  return { Pool: jest.fn(() => mockPool) };
});

describe("Features Repository", () => {
  let pool: Pool;

  beforeEach(() => {
    pool = new Pool();
    jest.clearAllMocks();
  });

  it("should fetch recent IPs for a merchant", async () => {
    (pool.query as jest.Mock).mockResolvedValueOnce({
      rows: [
        { ip: "192.168.1.1" },
        { ip: "192.168.1.2" },
      ],
    });

    const ips = await getRecentIpsForMerchant(pool, "merchant-1", 50);
    expect(ips).toEqual(["192.168.1.1", "192.168.1.2"]);
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining("SELECT (order_data->>'ip_address') AS ip"),
      ["merchant-1", 50]
    );
  });

  it("should fetch known devices for a merchant", async () => {
    (pool.query as jest.Mock).mockResolvedValueOnce({
      rows: [
        { device: "device-1" },
        { device: "device-2" },
      ],
    });

    const devices = await getKnownDevicesForMerchant(pool, "merchant-1", 200);
    expect(devices).toEqual(["device-1", "device-2"]);
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining("SELECT (order_data->>'device_fingerprint') AS device"),
      ["merchant-1", 200]
    );
  });

  it("should check if a merchant has recent chargebacks", async () => {
    (pool.query as jest.Mock).mockResolvedValueOnce({
      rows: [{ exists: true }],
    });

    const hasChargebacks = await merchantHasRecentChargebacks(pool, "merchant-1", 90);
    expect(hasChargebacks).toBe(true);
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining("SELECT EXISTS"),
      ["merchant-1", "90"]
    );
  });
});