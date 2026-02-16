"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseEvent = parseEvent;
const zod_1 = require("zod");
const eventSchemas_1 = require("./eventSchemas");
function parseEvent(topic, raw) {
    let json;
    try {
        json = JSON.parse(raw);
    }
    catch (error) {
        return {
            ok: false,
            error: { code: "INVALID_JSON", message: "Message is not valid JSON", details: error },
        };
    }
    try {
        if (topic === eventSchemas_1.TOPICS.orders)
            return { ok: true, event: eventSchemas_1.orderEventSchema.parse(json) };
        if (topic === eventSchemas_1.TOPICS.payments)
            return { ok: true, event: eventSchemas_1.paymentEventSchema.parse(json) };
        if (topic === eventSchemas_1.TOPICS.disputes)
            return { ok: true, event: eventSchemas_1.disputeEventSchema.parse(json) };
        return {
            ok: false,
            error: {
                code: "INVALID_EVENT",
                message: `Unknown topic: ${topic}`,
            },
        };
    }
    catch (error) {
        if (error instanceof zod_1.ZodError) {
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
