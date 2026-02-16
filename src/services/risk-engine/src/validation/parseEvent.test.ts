import { describe, expect, it } from "@jest/globals";
import { parseEvent } from "./parseEvent";
import { TOPICS } from "./eventSchemas";

describe("parseEvent", () => {
  it("rejects invalid JSON", () => {
    const res = parseEvent(TOPICS.orders, "{not json}");
    expect(res.ok).toBe(false);
    expect(res.error.code).toBe("INVALID_JSON");
  });

  it("accepts a valid order event shape", () => {
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

    const res = parseEvent(TOPICS.orders, payload);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.event.data.merchant_id).toBe("m_1");
    }
  });

  it("rejects an unknown topic", () => {
    const payload = JSON.stringify({
      id: "evt_1",
      type: "unknown.event",
      occurred_at: "2025-01-01T10:00:00.000Z",
      data: {},
    });

    const res = parseEvent("unknown.topic" as any, payload);
    expect(res.ok).toBe(false);
    expect(res.error.code).toBe("INVALID_EVENT");
  });
});