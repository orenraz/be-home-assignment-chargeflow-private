import { serve } from "bun";
import { getPool, closePool } from "./db";
import { errorResponse } from "./http";
import { handleGetRiskScore } from "./handlers/getRiskScore";
import { startKafkaConsumer } from "./kafka/consumer";
import { config } from "./config/env";
import { createServer } from "http";
import { Kafka } from "kafkajs";
import { Pool } from "pg";
import express, { Request, Response, NextFunction } from "express";
import pino from "pino";

const PORT = config.port;

let shuttingDown = false;

const pool = getPool();

const server = serve({
  port: PORT,
  async fetch(req: Request) {
    const url = new URL(req.url);

    if (url.pathname === "/health") {
      return new Response("ok", { status: 200 });
    }

    // GET /merchants/:merchantId/orders/:orderId/risk
    const match = url.pathname.match(
      /^\/merchants\/([^/]+)\/orders\/([^/]+)\/risk$/
    );
    if (req.method === "GET" && match) {
      const merchantId = decodeURIComponent(match[1]);
      const orderId = decodeURIComponent(match[2]);
      try {
        return await handleGetRiskScore(pool, merchantId, orderId);
      } catch (err) {
        console.error(err);
        return errorResponse(
          500,
          "INTERNAL_ERROR",
          "Unexpected server error"
        );
      }
    }

    return errorResponse(404, "NOT_FOUND", "Route not found", {
      method: req.method,
      path: url.pathname,
    });
  },
});

const kafka = new Kafka({
  clientId: "risk-engine",
  brokers: process.env.KAFKA_BROKERS?.split(",") || [],
});
const consumer = kafka.consumer({
  groupId: process.env.KAFKA_CONSUMER_GROUP || "risk-engine-group",
});

// Middleware for error handling
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error("Unhandled error:", err);

  const statusCode = err.status || 500;
  const errorResponse = {
    error: {
      code: err.code || "INTERNAL_ERROR",
      message: err.message || "An unexpected error occurred.",
      details: err.details || null,
    },
  };

  res.status(statusCode).json(errorResponse);
});

async function shutdown() {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log("Shutting down...");

  try {
    console.log("Stopping HTTP server...");
    await new Promise((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve(null)));
    });
    console.log("HTTP server stopped.");
  } catch (err) {
    console.error("Error stopping HTTP server:", err);
  }

  try {
    console.log("Stopping Kafka consumer...");
    await consumer.disconnect();
    console.log("Kafka consumer stopped.");
  } catch (err) {
    console.error("Error stopping Kafka consumer:", err);
  }

  try {
    console.log("Closing database pool...");
    await pool.end();
    console.log("Database pool closed.");
  } catch (err) {
    console.error("Error closing database pool:", err);
  }

  console.log("Shutdown complete.");
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  transport: process.env.NODE_ENV !== "production" ? {
    target: "pino-pretty",
    options: { colorize: true },
  } : undefined,
});

// Replace console.log with logger
logger.info("Starting HTTP server...");
server.listen(process.env.PORT || 3000, () => {
  logger.info(`Server running on port ${process.env.PORT || 3000}`);
});

logger.info("Connecting Kafka consumer...");
await consumer.connect();
logger.info("Kafka consumer connected.");

logger.info("Application started successfully.");

// Update shutdown logs
logger.info("Stopping HTTP server...");
logger.info("HTTP server stopped.");
logger.info("Stopping Kafka consumer...");
logger.info("Kafka consumer stopped.");
logger.info("Closing database pool...");
logger.info("Database pool closed.");
logger.info("Shutdown complete.");


