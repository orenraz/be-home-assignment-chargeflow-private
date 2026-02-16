"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pg_1 = require("pg");
const orderSnapshotRepo_1 = require("./orderSnapshotRepo");
const eventSchemas_1 = require("../validation/eventSchemas");
jest.mock("pg", () => {
    const mockPool = {
        query: jest.fn(),
    };
    return { Pool: jest.fn(() => mockPool) };
});
describe("Order Snapshot Repository", () => {
    let pool;
    beforeEach(() => {
        pool = new pg_1.Pool();
        jest.clearAllMocks();
    });
    describe("upsertOrderSnapshot", () => {
        it("should upsert order snapshot for orders topic", async () => {
            await (0, orderSnapshotRepo_1.upsertOrderSnapshot)(pool, {
                merchantId: "merchant-1",
                orderId: "order-1",
                topic: eventSchemas_1.TOPICS.orders,
                occurredAt: new Date("2026-02-16T00:00:00Z"),
                data: { key: "value" },
            });
            expect(pool.query).toHaveBeenCalledWith(expect.stringContaining("INSERT INTO order_snapshot"), expect.arrayContaining([
                "merchant-1",
                "order-1",
                JSON.stringify({ key: "value" }),
                new Date("2026-02-16T00:00:00Z"),
            ]));
        });
        it("should upsert order snapshot for payments topic", async () => {
            await (0, orderSnapshotRepo_1.upsertOrderSnapshot)(pool, {
                merchantId: "merchant-1",
                orderId: "order-1",
                topic: eventSchemas_1.TOPICS.payments,
                occurredAt: new Date("2026-02-16T00:00:00Z"),
                data: { amount: 100 },
            });
            expect(pool.query).toHaveBeenCalledWith(expect.stringContaining("INSERT INTO order_snapshot"), expect.arrayContaining([
                "merchant-1",
                "order-1",
                JSON.stringify({ amount: 100 }),
                new Date("2026-02-16T00:00:00Z"),
            ]));
        });
    });
    describe("getOrderSnapshot", () => {
        it("should retrieve an order snapshot", async () => {
            pool.query.mockResolvedValueOnce({
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
            const snapshot = await (0, orderSnapshotRepo_1.getOrderSnapshot)(pool, "merchant-1", "order-1");
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
