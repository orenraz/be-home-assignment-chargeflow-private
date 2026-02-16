import { serve } from "bun";
import { getPool, closePool } from "./db";
import { errorResponse } from "./http";
import { handleGetRiskScore } from "./handlers/getRiskScore";
import { startKafkaConsumer } from "./kafka/consumer";

const PORT = Number(process.env.PORT ?? 3001);

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

async function main() {
  const kafkaConsumer = await startKafkaConsumer(pool);

  process.on("SIGINT", async () => {
    await kafkaConsumer.stop();
    process.exit(0);
  });

  process.on("SIGTERM", async () => {
    await kafkaConsumer.stop();
    process.exit(0);
  });
}

main().catch((err) => {
  console.error("Error starting application:", err);
  process.exit(1);
});

function shutdown(signal: string) {
  console.log(`Shutting down on ${signal}`);
  try {
    server.stop(true);
  } finally {
    void closePool().finally(() => process.exit(0));
  }
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));


