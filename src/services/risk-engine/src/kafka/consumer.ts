import { Kafka, logLevel } from "kafkajs";
import type { Pool } from "pg";
import { insertEventIdempotent } from "../repositories/eventsRepo";
import { parseEvent } from "../validation/parseEvent";
import { TOPICS, type TopicName } from "../validation/eventSchemas";
import { extractMerchantOrder } from "./extractKeys";

function parseBrokers(): string[] {
  const raw = process.env.KAFKA_BROKERS ?? "redpanda:9092";
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

function consumerGroupId(): string {
  return process.env.KAFKA_CONSUMER_GROUP ?? "risk-engine-v1";
}

function topicList(): TopicName[] {
  // allow override, but default to the known topics
  const raw = process.env.KAFKA_TOPICS;
  if (!raw) return [TOPICS.orders, TOPICS.payments, TOPICS.disputes];

  return raw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean) as TopicName[];
}

export async function startKafkaConsumer(pool: Pool): Promise<{
  stop: () => Promise<void>;
}> {
  const kafka = new Kafka({
    clientId: "risk-engine",
    brokers: parseBrokers(),
    logLevel: logLevel.NOTHING, // rely on our own logs; change later if needed
  });

  const consumer = kafka.consumer({ groupId: consumerGroupId() });

  await consumer.connect();

  const topics = topicList();
  for (const t of topics) {
    await consumer.subscribe({ topic: t, fromBeginning: false });
  }

  await consumer.run({
    autoCommit: true, // OK because we dedupe; if you prefer stricter control, we can manual commit later
    eachMessage: async ({ topic, partition, message }) => {
      const value = message.value?.toString("utf8");
      if (!value) return;

      const parsed = parseEvent(topic as TopicName, value);
      if (!parsed.ok) {
        // eslint-disable-next-line no-console
        console.warn(
          JSON.stringify({
            level: "warn",
            msg: "kafka message failed validation",
            topic,
            partition,
            offset: message.offset,
            error: parsed.error,
          })
        );
        return;
      }

      const event = parsed.event as any;
      const eventId: string = event.id;

      // occurred_at is a string; store as Date if parseable
      const occurredAt =
        typeof event.occurred_at === "string" ? new Date(event.occurred_at) : null;

      const { merchantId, orderId } = extractMerchantOrder(topic as TopicName, parsed.event);

      const result = await insertEventIdempotent(pool, {
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
        console.log(
          JSON.stringify({
            level: "info",
            msg: "duplicate event skipped",
            topic,
            eventId,
            merchantId,
            orderId,
          })
        );
        return;
      }

      // eslint-disable-next-line no-console
      console.log(
        JSON.stringify({
          level: "info",
          msg: "event stored",
          topic,
          partition,
          offset: message.offset,
          eventId,
          merchantId,
          orderId,
        })
      );
    },
  });

  return {
    stop: async () => {
      await consumer.disconnect();
    },
  };
}