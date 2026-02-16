# SOLUTION.md

## Architecture Overview

### Diagram
```
+-------------------+     +-------------------+     +-------------------+
|   HTTP Server     | --> |   Kafka Consumer   | --> |   PostgreSQL DB    |
+-------------------+     +-------------------+     +-------------------+
```

### Components
- **HTTP Server**: Handles API requests for risk scores.
- **Kafka Consumer**: Processes events and updates snapshots.
- **PostgreSQL DB**: Stores snapshots and risk scores.

## Assumptions
- Risk scores expire after `RISK_SCORE_TTL_SECONDS`.
- Kafka events are deduplicated by `event_id`.
- Scoring happens synchronously during event processing.

## Schema Summary
- **snapshots**: Stores merchant snapshots.
- **risk_scores**: Stores computed risk scores.

## API Specification
- **GET /risk-score/:merchantId**
  - **200**: Returns risk score.
  - **404**: Risk score not found.
  - **500**: Internal error.

## Tradeoffs
- **Zod**: Chosen for schema validation due to simplicity.
- **node-pg-migrate**: Used for database migrations.
- **Deduplication**: Ensures idempotency for event processing.

## How to Run
1. Set up `.env` file based on `.env.example`.
2. Run `docker compose up --build`.

## How to Verify
1. Run `bun test` to ensure all tests pass.
2. Use `curl` or Postman to test API endpoints.

## Optional Cleanup Job
- Deletes expired risk scores every 10 minutes.
- Controlled by `ENABLE_CLEANUP` environment variable.
