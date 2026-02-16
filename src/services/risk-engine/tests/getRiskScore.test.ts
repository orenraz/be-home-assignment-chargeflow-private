import { handleGetRiskScore } from "../src/handlers/getRiskScore";
import { Pool } from "pg";

jest.mock("pg", () => {
  const mockPool = {
    query: jest.fn(),
  };
  return { Pool: jest.fn(() => mockPool) };
});

describe("handleGetRiskScore", () => {
  let pool: Pool;

  beforeEach(() => {
    pool = new Pool();
  });

  it("should return 404 if the risk score is not found", async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    const response = await handleGetRiskScore(pool, "m_123", "o_456");
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body).toEqual({
      error: {
        code: "RISK_SCORE_NOT_FOUND",
        message: "Risk score not found",
        details: {
          merchantId: "m_123",
          orderId: "o_456",
        },
      },
    });
  });

  it("should return 410 if the risk score is expired", async () => {
    pool.query.mockResolvedValueOnce({
      rows: [
        {
          merchant_id: "m_123",
          order_id: "o_456",
          score: 72,
          signals: {},
          computed_at: new Date("2026-02-16T07:12:00.000Z"),
          expires_at: new Date("2026-02-16T08:12:00.000Z"),
        },
      ],
    });

    const response = await handleGetRiskScore(pool, "m_123", "o_456");
    const body = await response.json();

    expect(response.status).toBe(410);
    expect(body).toEqual({
      error: {
        code: "RISK_SCORE_EXPIRED",
        message: "Risk score exists but is expired",
        details: {
          merchantId: "m_123",
          orderId: "o_456",
          expiredAt: "2026-02-16T08:12:00.000Z",
        },
      },
    });
  });

  it("should return 200 if the risk score is valid", async () => {
    pool.query.mockResolvedValueOnce({
      rows: [
        {
          merchant_id: "m_123",
          order_id: "o_456",
          score: 72,
          signals: {
            ipVelocityScore: 20,
            deviceReuseScore: 12,
          },
          computed_at: new Date("2026-02-16T07:12:00.000Z"),
          expires_at: new Date("2026-02-16T09:12:00.000Z"),
        },
      ],
    });

    const response = await handleGetRiskScore(pool, "m_123", "o_456");
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      merchantId: "m_123",
      orderId: "o_456",
      score: 72,
      signals: {
        ipVelocityScore: 20,
        deviceReuseScore: 12,
      },
      computedAt: "2026-02-16T07:12:00.000Z",
      expiresAt: "2026-02-16T09:12:00.000Z",
    });
  });
});