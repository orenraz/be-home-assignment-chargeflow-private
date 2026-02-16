import { migrate } from "node-pg-migrate";
import "dotenv/config";

export async function runMigrations() {
  try {
    await migrate({
      databaseUrl: process.env.DATABASE_URL,
      dir: "migrations",
      direction: "up",
      migrationsTable: "pgmigrations",
      count: Infinity,
    });
    console.log("Migrations applied successfully.");
  } catch (error) {
    console.error("Migration failed:", error);
    throw new Error("Migration failed");
  }
}