"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const index_1 = require("../../src/index");
const riskScoresReadRepo_1 = require("../../src/repositories/riskScoresReadRepo");
jest.mock("../../src/repositories/riskScoresReadRepo", () => ({
    getRiskScore: jest.fn(),
}));
describe("Risk Score Handler", () => {
    let pool;
    beforeEach(() => {
        pool = {}; // Mocked pool
        jest.clearAllMocks();
    });
    it("should return 200 with risk score when found", async () => {
        riskScoresReadRepo_1.getRiskScore.mockResolvedValue({
            score: 75,
            signals: {
                ipVelocityScore: 10,
                deviceReuseScore: 15,
                emailDomainReputationScore: 20,
                binCountryMismatchScore: 5,
                chargebackHistoryScore: 25,
            },
        });
        const response = await (0, supertest_1.default)(index_1.app).get("/risk-score/merchant-1");
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
        riskScoresReadRepo_1.getRiskScore.mockResolvedValue(null);
        const response = await (0, supertest_1.default)(index_1.app).get("/risk-score/merchant-1");
        expect(response.status).toBe(404);
        expect(response.body).toEqual({
            error: {
                code: "NOT_FOUND",
                message: "Risk score not found.",
            },
        });
    });
    it("should return 500 on unexpected error", async () => {
        riskScoresReadRepo_1.getRiskScore.mockRejectedValue(new Error("Unexpected error"));
        const response = await (0, supertest_1.default)(index_1.app).get("/risk-score/merchant-1");
        expect(response.status).toBe(500);
        expect(response.body).toEqual({
            error: {
                code: "INTERNAL_ERROR",
                message: "An unexpected error occurred.",
            },
        });
    });
});
