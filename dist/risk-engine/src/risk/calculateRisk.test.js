"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const calculateRisk_1 = require("./calculateRisk");
const risk_signals_1 = require("@chargeflow/risk-signals");
jest.mock("@chargeflow/risk-signals", () => ({
    ipVelocityScore: jest.fn(() => 10),
    deviceReuseScore: jest.fn(() => 15),
    emailDomainReputationScore: jest.fn(() => 20),
    binCountryMismatchScore: jest.fn(() => 5),
    chargebackHistoryScore: jest.fn(() => 0),
}));
jest.mock("../repositories/featuresRepo", () => ({
    getRecentIpsForMerchant: jest.fn(() => ["192.168.1.1"]),
    getKnownDevicesForMerchant: jest.fn(() => ["device-1"]),
    merchantHasRecentChargebacks: jest.fn(() => false),
}));
describe("Risk Calculator", () => {
    let pool;
    beforeEach(() => {
        pool = {}; // Mocked pool
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
        };
        const result = await (0, calculateRisk_1.calculateRisk)(pool, snapshot);
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
        expect(risk_signals_1.ipVelocityScore).toHaveBeenCalledWith(["192.168.1.1"], "192.168.1.1");
        expect(risk_signals_1.deviceReuseScore).toHaveBeenCalledWith(["device-1"], "device-1");
        expect(risk_signals_1.emailDomainReputationScore).toHaveBeenCalledWith("test@example.com");
        expect(risk_signals_1.binCountryMismatchScore).toHaveBeenCalledWith("US", "US");
        expect(risk_signals_1.chargebackHistoryScore).toHaveBeenCalledWith(false);
    });
});
