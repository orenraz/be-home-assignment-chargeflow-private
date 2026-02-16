import "dotenv/config";
import { run as migrate } from "node-pg-migrate";

export async function runMigrations() {
  try {
    await migrate({
      databaseUrl: process.env.DATABASE_URL,
      migrationsTable: "pgmigrations",
      dir: "migrations",
      direction: "up",
      count: Infinity,
    });
    console.log("Migrations applied successfully.");
  } catch (error) {
    console.error("Migration failed:", error);
    throw new Error("Migration failed");
  }
}