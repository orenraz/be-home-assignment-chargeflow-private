"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const recomputeRisk_1 = require("./recomputeRisk");
const riskScoresWriteRepo_1 = require("../repositories/riskScoresWriteRepo");
const calculateRisk_1 = require("./calculateRisk");
jest.mock("../repositories/riskScoresWriteRepo", () => ({
    upsertRiskScore: jest.fn(),
}));
jest.mock("./calculateRisk", () => ({
    calculateRisk: jest.fn(() => ({
        score: 50,
        signals: {
            ipVelocityScore: 10,
            deviceReuseScore: 15,
            emailDomainReputationScore: 20,
            binCountryMismatchScore: 5,
            chargebackHistoryScore: 0,
        },
    })),
}));
describe("Recompute Risk", () => {
    let pool;
    beforeEach(() => {
        pool = {}; // Mocked pool
        jest.clearAllMocks();
    });
    it("should recompute risk and upsert the score", async () => {
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
        };
        await (0, recomputeRisk_1.recomputeRisk)(pool, snapshot);
        expect(calculateRisk_1.calculateRisk).toHaveBeenCalledWith(pool, snapshot);
        expect(riskScoresWriteRepo_1.upsertRiskScore).toHaveBeenCalledWith(pool, "merchant-1", {
            score: 50,
            signals: {
                ipVelocityScore: 10,
                deviceReuseScore: 15,
                emailDomainReputationScore: 20,
                binCountryMismatchScore: 5,
                chargebackHistoryScore: 0,
            },
        });
    });
});
