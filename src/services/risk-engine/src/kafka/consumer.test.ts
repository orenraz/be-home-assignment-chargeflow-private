import { Kafka, logLevel } from "kafkajs";
import { Pool } from "pg";
import { startKafkaConsumer } from "./consumer.js";
import { insertEventIdempotent } from "../repositories/eventsRepo.js";
import { parseEvent } from "../validation/parseEvent.js";
import { extractMerchantOrder } from "./extractKeys.js";

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

jest.mock("../repositories/eventsRepo.js", () => ({
  insertEventIdempotent: jest.fn(),
}));

jest.mock("../validation/parseEvent.js", () => ({
  parseEvent: jest.fn(),
}));

jest.mock("./extractKeys.js", () => ({
  extractMerchantOrder: jest.fn(),
}));

describe("Kafka Consumer", () => {
  let pool: Pool;

  beforeEach(() => {
    pool = {} as Pool; // Mocked pool
    jest.clearAllMocks();
  });

  it("should start the Kafka consumer and process messages", async () => {
    const mockRun = jest.fn();
    (Kafka as jest.Mock).mockImplementation(() => ({
      consumer: jest.fn().mockReturnValue({
        connect: jest.fn(),
        subscribe: jest.fn(),
        run: mockRun,
        disconnect: jest.fn(),
      }),
    }));

    (parseEvent as jest.Mock).mockImplementation(() => ({ ok: true, event: { id: "event-id" } }));
    (extractMerchantOrder as jest.Mock).mockImplementation(() => ({ merchantId: "merchant-id", orderId: "order-id" }));
    (insertEventIdempotent as jest.Mock).mockImplementation(() => ({ inserted: true }));

    const { stop } = await startKafkaConsumer(pool);

    expect(mockRun).toHaveBeenCalledWith(
      expect.objectContaining({
        eachMessage: expect.any(Function),
      })
    );

    const eachMessage = mockRun.mock.calls[0][0].eachMessage;

    await eachMessage({
      topic: "orders",
      partition: 0,
      message: {
        value: Buffer.from(JSON.stringify({ id: "event-id" })),
        offset: "0",
      },
    });

    expect(parseEvent).toHaveBeenCalledWith("orders", expect.any(String));
    expect(insertEventIdempotent).toHaveBeenCalledWith(pool, expect.objectContaining({
      eventId: "event-id",
      merchantId: "merchant-id",
      orderId: "order-id",
    }));

    await stop();
  });

  it("should skip invalid messages", async () => {
    const mockRun = jest.fn();
    (Kafka as jest.Mock).mockImplementation(() => ({
      consumer: jest.fn().mockReturnValue({
        connect: jest.fn(),
        subscribe: jest.fn(),
        run: mockRun,
        disconnect: jest.fn(),
      }),
    }));

    (parseEvent as jest.Mock).mockImplementation(() => ({ ok: false, error: "Invalid event" }));

    const { stop } = await startKafkaConsumer(pool);

    const eachMessage = mockRun.mock.calls[0][0].eachMessage;

    await eachMessage({
      topic: "orders",
      partition: 0,
      message: {
        value: Buffer.from(JSON.stringify({ id: "event-id" })),
        offset: "0",
      },
    });

    expect(parseEvent).toHaveBeenCalledWith("orders", expect.any(String));
    expect(insertEventIdempotent).not.toHaveBeenCalled();

    await stop();
  });
});