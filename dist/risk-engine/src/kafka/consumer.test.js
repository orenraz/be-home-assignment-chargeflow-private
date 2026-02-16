"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const kafkajs_1 = require("kafkajs");
const consumer_1 = require("./consumer");
const eventsRepo_1 = require("../repositories/eventsRepo");
const parseEvent_1 = require("../validation/parseEvent");
const extractKeys_1 = require("./extractKeys");
jest.mock("kafkajs", () => ({
    Kafka: jest.fn().mockImplementation(() => ({
        consumer: jest.fn().mockReturnValue({
            connect: jest.fn(),
            subscribe: jest.fn(),
            run: jest.fn(),
            disconnect: jest.fn(),
        }),
    })),
    logLevel: { NOTHING: "NOTHING" },
}));
jest.mock("../repositories/eventsRepo", () => ({
    insertEventIdempotent: jest.fn(),
}));
jest.mock("../validation/parseEvent", () => ({
    parseEvent: jest.fn(),
}));
jest.mock("./extractKeys", () => ({
    extractMerchantOrder: jest.fn(),
}));
describe("Kafka Consumer", () => {
    let pool;
    beforeEach(() => {
        pool = {}; // Mocked pool
        jest.clearAllMocks();
    });
    it("should start the Kafka consumer and process messages", async () => {
        const mockRun = jest.fn();
        kafkajs_1.Kafka.mockImplementation(() => ({
            consumer: jest.fn().mockReturnValue({
                connect: jest.fn(),
                subscribe: jest.fn(),
                run: mockRun,
                disconnect: jest.fn(),
            }),
        }));
        parseEvent_1.parseEvent.mockImplementation(() => ({ ok: true, event: { id: "event-id" } }));
        extractKeys_1.extractMerchantOrder.mockImplementation(() => ({ merchantId: "merchant-id", orderId: "order-id" }));
        eventsRepo_1.insertEventIdempotent.mockImplementation(() => ({ inserted: true }));
        const { stop } = await (0, consumer_1.startKafkaConsumer)(pool);
        expect(mockRun).toHaveBeenCalledWith(expect.objectContaining({
            eachMessage: expect.any(Function),
        }));
        const eachMessage = mockRun.mock.calls[0][0].eachMessage;
        await eachMessage({
            topic: "orders",
            partition: 0,
            message: {
                value: Buffer.from(JSON.stringify({ id: "event-id" })),
                offset: "0",
            },
        });
        expect(parseEvent_1.parseEvent).toHaveBeenCalledWith("orders", expect.any(String));
        expect(eventsRepo_1.insertEventIdempotent).toHaveBeenCalledWith(pool, expect.objectContaining({
            eventId: "event-id",
            merchantId: "merchant-id",
            orderId: "order-id",
        }));
        await stop();
    });
    it("should skip invalid messages", async () => {
        const mockRun = jest.fn();
        kafkajs_1.Kafka.mockImplementation(() => ({
            consumer: jest.fn().mockReturnValue({
                connect: jest.fn(),
                subscribe: jest.fn(),
                run: mockRun,
                disconnect: jest.fn(),
            }),
        }));
        parseEvent_1.parseEvent.mockImplementation(() => ({ ok: false, error: "Invalid event" }));
        const { stop } = await (0, consumer_1.startKafkaConsumer)(pool);
        const eachMessage = mockRun.mock.calls[0][0].eachMessage;
        await eachMessage({
            topic: "orders",
            partition: 0,
            message: {
                value: Buffer.from(JSON.stringify({ id: "event-id" })),
                offset: "0",
            },
        });
        expect(parseEvent_1.parseEvent).toHaveBeenCalledWith("orders", expect.any(String));
        expect(eventsRepo_1.insertEventIdempotent).not.toHaveBeenCalled();
        await stop();
    });
});
