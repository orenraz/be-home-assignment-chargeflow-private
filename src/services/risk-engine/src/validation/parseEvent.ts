import { ZodError } from "zod";
import {
  disputeEventSchema,
  orderEventSchema,
  paymentEventSchema,
  type AnyEvent,
  type TopicName,
  TOPICS,
} from "./eventSchemas";

export type ParseOk = { ok: true; event: AnyEvent };
export type ParseErr = {
  ok: false;
  error: {
    code: "INVALID_JSON" | "INVALID_EVENT";
    message: string;
    details?: unknown;
  };
};

export function parseEvent(topic: TopicName, raw: string): ParseOk | ParseErr {
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch (error) {
    return {
      ok: false,
      error: { code: "INVALID_JSON", message: "Message is not valid JSON", details: error },
    };
  }

  try {
    if (topic === TOPICS.orders) return { ok: true, event: orderEventSchema.parse(json) };
    if (topic === TOPICS.payments) return { ok: true, event: paymentEventSchema.parse(json) };
    if (topic === TOPICS.disputes) return { ok: true, event: disputeEventSchema.parse(json) };

    return {
      ok: false,
      error: {
        code: "INVALID_EVENT",
        message: `Unknown topic: ${topic}`,
      },
    };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        ok: false,
        error: {
          code: "INVALID_EVENT",
          message: "Event validation failed",
          details: error.errors,
        },
      };
    }

    return {
      ok: false,
      error: {
        code: "INVALID_EVENT",
        message: "Unexpected error during validation",
        details: error,
      },
    };
  }
}