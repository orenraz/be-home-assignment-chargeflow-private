import { Pool } from "pg";
import { upsertOrderSnapshot, getOrderSnapshot } from "./orderSnapshotRepo";
import { TOPICS } from "../validation/eventSchemas";

jest.mock("pg", () => {
  const mockPool = {
    query: jest.fn(),
  };
  return { Pool: jest.fn(() => mockPool) };
});

describe("Order Snapshot Repository", () => {
  let pool: Pool;

  beforeEach(() => {
    pool = new Pool();
    jest.clearAllMocks();
  });

  describe("upsertOrderSnapshot", () => {
    it("should upsert order snapshot for orders topic", async () => {
      await upsertOrderSnapshot(pool, {
        merchantId: "merchant-1",
        orderId: "order-1",
        topic: TOPICS.orders,
        occurredAt: new Date("2026-02-16T00:00:00Z"),
        data: { key: "value" },
      });

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO order_snapshot"),
        expect.arrayContaining([
          "merchant-1",
          "order-1",
          JSON.stringify({ key: "value" }),
          new Date("2026-02-16T00:00:00Z"),
        ])
      );
    });

    it("should upsert order snapshot for payments topic", async () => {
      await upsertOrderSnapshot(pool, {
        merchantId: "merchant-1",
        orderId: "order-1",
        topic: TOPICS.payments,
        occurredAt: new Date("2026-02-16T00:00:00Z"),
        data: { amount: 100 },
      });

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO order_snapshot"),
        expect.arrayContaining([
          "merchant-1",
          "order-1",
          JSON.stringify({ amount: 100 }),
          new Date("2026-02-16T00:00:00Z"),
        ])
      );
    });
  });

  describe("getOrderSnapshot", () => {
    it("should retrieve an order snapshot", async () => {
      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: [
          {
            merchant_id: "merchant-1",
            order_id: "order-1",
            order_data: { key: "value" },
            order_occurred_at: new Date("2026-02-16T00:00:00Z"),
            payment_data: null,
            payment_occurred_at: null,
            dispute_data: null,
            dispute_occurred_at: null,
            updated_at: new Date("2026-02-16T00:00:00Z"),
          },
        ],
      });

      const snapshot = await getOrderSnapshot(pool, "merchant-1", "order-1");

      expect(snapshot).toEqual({
        merchant_id: "merchant-1",
        order_id: "order-1",
        order_data: { key: "value" },
        order_occurred_at: new Date("2026-02-16T00:00:00Z"),
        payment_data: null,
        payment_occurred_at: null,
        dispute_data: null,
        dispute_occurred_at: null,
        updated_at: new Date("2026-02-16T00:00:00Z"),
      });
    });
  });
});