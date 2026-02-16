"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startKafkaConsumer = startKafkaConsumer;
const kafkajs_1 = require("kafkajs");
const eventsRepo_1 = require("../repositories/eventsRepo");
const parseEvent_1 = require("../validation/parseEvent");
const eventSchemas_1 = require("../validation/eventSchemas");
const extractKeys_1 = require("./extractKeys");
const orderSnapshotRepo_1 = require("../repositories/orderSnapshotRepo");
const isReadyToScore_1 = require("../risk/isReadyToScore");
const recomputeRisk_1 = require("../risk/recomputeRisk");
const pino_1 = __importDefault(require("pino"));
const logger = (0, pino_1.default)();
function parseBrokers() {
    const raw = process.env.KAFKA_BROKERS ?? "redpanda:9092";
    return raw.split(",").map((s) => s.trim()).filter(Boolean);
}
function consumerGroupId() {
    return process.env.KAFKA_CONSUMER_GROUP ?? "risk-engine-v1";
}
function topicList() {
    // allow override, but default to the known topics
    const raw = process.env.KAFKA_TOPICS;
    if (!raw)
        return [eventSchemas_1.TOPICS.orders, eventSchemas_1.TOPICS.payments, eventSchemas_1.TOPICS.disputes];
    return raw
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
}
async function startKafkaConsumer(pool) {
    const kafka = new kafkajs_1.Kafka({
        clientId: "risk-engine",
        brokers: parseBrokers(),
        logLevel: kafkajs_1.logLevel.NOTHING, // rely on our own logs; change later if needed
    });
    const consumer = kafka.consumer({ groupId: consumerGroupId() });
    try {
        await consumer.connect();
    }
    catch (error) {
        logger.error({ level: "error", msg: "Failed to connect Kafka consumer", error });
        throw error;
    }
    const topics = topicList();
    for (const t of topics) {
        await consumer.subscribe({ topic: t, fromBeginning: false });
    }
    await consumer.run({
        autoCommit: true, // OK because we dedupe; if you prefer stricter control, we can manual commit later
        eachMessage: async ({ topic, partition, message }) => {
            const value = message.value?.toString("utf8");
            if (!value)
                return;
            const parsed = (0, parseEvent_1.parseEvent)(topic, value);
            if (!parsed.ok) {
                // eslint-disable-next-line no-console
                logger.warn(JSON.stringify({
                    level: "warn",
                    msg: "kafka message failed validation",
                    topic,
                    partition,
                    offset: message.offset,
                    error: parsed.error,
                }));
                return;
            }
            const event = parsed.event;
            const eventId = event.id;
            // occurred_at is a string; store as Date if parseable
            const occurredAt = typeof event.occurred_at === "string" ? new Date(event.occurred_at) : null;
            const { merchantId, orderId } = (0, extractKeys_1.extractMerchantOrder)(topic, parsed.event);
            const result = await (0, eventsRepo_1.insertEventIdempotent)(pool, {
                eventId,
                topic,
                partition,
                offset: message.offset,
                occurredAt: occurredAt && !Number.isNaN(occurredAt.getTime()) ? occurredAt : null,
                merchantId,
                orderId,
                payload: parsed.event, // store validated envelope
            });
            if (!result.inserted) {
                // duplicate event_id
                // eslint-disable-next-line no-console
                logger.info(JSON.stringify({
                    level: "info",
                    msg: "duplicate event skipped",
                    topic,
                    eventId,
                    merchantId,
                    orderId,
                }));
                return;
            }
            if (!merchantId || !orderId) {
                logger.warn(JSON.stringify({
                    level: "warn",
                    msg: "missing merchant/order keys; skipping snapshot update",
                    topic,
                    eventId,
                }));
                return;
            }
            await (0, orderSnapshotRepo_1.upsertOrderSnapshot)(pool, {
                merchantId: merchantId ?? "UNKNOWN",
                orderId: orderId ?? "UNKNOWN",
                topic: topic,
                occurredAt: occurredAt && !Number.isNaN(occurredAt.getTime()) ? occurredAt : null,
                data: parsed.event.data,
            });
            const snapshot = await (0, orderSnapshotRepo_1.getOrderSnapshot)(pool, merchantId, orderId);
            const ready = (0, isReadyToScore_1.isReadyToScore)(snapshot);
            const rr = await (0, recomputeRisk_1.recomputeRiskIfReady)(pool, merchantId, orderId);
            logger.info(JSON.stringify({
                level: "info",
                msg: "snapshot updated",
                topic,
                eventId,
                merchantId,
                orderId,
                readyToScore: ready,
            }));
            console.log(JSON.stringify({
                level: "info",
                msg: rr.recomputed ? "risk score recomputed" : "snapshot updated (not ready)",
                topic,
                eventId,
                merchantId,
                orderId,
                score: rr.score ?? null,
            }));
        },
    });
    return {
        stop: async () => {
            await consumer.disconnect();
        },
    };
}
