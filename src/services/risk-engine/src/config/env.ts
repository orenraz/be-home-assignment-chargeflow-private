import * as dotenv from "dotenv";
import pino from "pino";

dotenv.config();
const logger = pino();

const requiredEnvVars = ["DATABASE_URL", "KAFKA_BROKERS", "PORT"];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    logger.error(`Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

export const config = {
  databaseUrl: process.env.DATABASE_URL!,
  kafkaBrokers: process.env.KAFKA_BROKERS!.split(","),
  port: Number(process.env.PORT || 3001),
};