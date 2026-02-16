"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bun_test_1 = require("bun:test");
const parseEvent_1 = require("./parseEvent");
const eventSchemas_1 = require("./eventSchemas");
(0, bun_test_1.describe)("parseEvent", () => {
    (0, bun_test_1.it)("rejects invalid JSON", () => {
        const res = (0, parseEvent_1.parseEvent)(eventSchemas_1.TOPICS.orders, "{not json}");
        (0, bun_test_1.expect)(res.ok).toBe(false);
        (0, bun_test_1.expect)(res.error.code).toBe("INVALID_JSON");
    });
    (0, bun_test_1.it)("accepts a valid order event shape", () => {
        const payload = JSON.stringify({
            id: "evt_1",
            type: "order.created",
            occurred_at: "2025-01-01T10:00:00.000Z",
            data: {
                merchant_id: "m_1",
                order_id: "o_1",
                txn_id: "t_1",
                customer_id: "c_1",
                amt: 100,
                billing_country: "US",
                ip_address: "1.2.3.4",
                device_fingerprint: "dev_1",
                email: "a@b.com",
            },
        });
        const res = (0, parseEvent_1.parseEvent)(eventSchemas_1.TOPICS.orders, payload);
        (0, bun_test_1.expect)(res.ok).toBe(true);
        if (res.ok) {
            (0, bun_test_1.expect)(res.event.data.merchant_id).toBe("m_1");
        }
    });
    (0, bun_test_1.it)("rejects an unknown topic", () => {
        const payload = JSON.stringify({
            id: "evt_1",
            type: "unknown.event",
            occurred_at: "2025-01-01T10:00:00.000Z",
            data: {},
        });
        const res = (0, parseEvent_1.parseEvent)("unknown.topic", payload);
        (0, bun_test_1.expect)(res.ok).toBe(false);
        (0, bun_test_1.expect)(res.error.code).toBe("INVALID_EVENT");
    });
});
