import request from "supertest";
import { app } from "../../src/index";
import { Pool } from "pg";
import { getRiskScore } from "../../src/repositories/riskScoresReadRepo";

jest.mock("../../src/repositories/riskScoresReadRepo", () => ({
  getRiskScore: jest.fn(),
}));

jest.mock("pg", () => {
  const mockPool = {
    query: jest.fn().mockResolvedValue({ rows: [] }),
  };
  return { Pool: jest.fn(() => mockPool) };
});

describe("Risk Score Handler", () => {
  let pool: Pool;

  beforeEach(() => {
    pool = {} as Pool; // Mocked pool
    jest.clearAllMocks();
  });

  it("should return 200 with risk score when found", async () => {
    (getRiskScore as jest.Mock).mockResolvedValue({
      score: 75,
      signals: {
        ipVelocityScore: 10,
        deviceReuseScore: 15,
        emailDomainReputationScore: 20,
        binCountryMismatchScore: 5,
        chargebackHistoryScore: 25,
      },
    });

    const response = await request(app).get("/risk-score/merchant-1");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      score: 75,
      signals: {
        ipVelocityScore: 10,
        deviceReuseScore: 15,
        emailDomainReputationScore: 20,
        binCountryMismatchScore: 5,
        chargebackHistoryScore: 25,
      },
    });
  });

  it("should return 404 when risk score is not found", async () => {
    (getRiskScore as jest.Mock).mockResolvedValue(null);

    const response = await request(app).get("/risk-score/merchant-1");

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      error: {
        code: "NOT_FOUND",
        message: "Risk score not found.",
      },
    });
  });

  it("should return 500 on unexpected error", async () => {
    (getRiskScore as jest.Mock).mockRejectedValue(new Error("Unexpected error"));

    const response = await request(app).get("/risk-score/merchant-1");

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred.",
      },
    });
  });
});