# Chargeflow Risk Engine — Solution

## Overview
This service consumes order/payment/dispute events from Kafka (Redpanda), correlates them by merchant + order, computes a 0–100 risk score using `@chargeflow/risk-signals`, stores state in PostgreSQL, and exposes a REST API to query the latest score.

## How to run
1. Create env file:
   - `cp env.example .env`

2. Start the stack:
   - `docker compose up --build`

## Useful URLs
- Redpanda Console (Kafka UI): http://localhost:8080
- risk-engine service: http://localhost:3001
- healthcheck: http://localhost:3001/health

## How to verify the stack is working (baseline)
1. Confirm containers are up:
   - `docker compose ps`

2. Confirm generator is producing:
   - `docker compose logs -f event-generator`

3. Confirm Kafka topics exist:
   - In Redpanda Console → Topics:
     - `orders.v1`
     - `payments.v1`
     - `disputes.v1`

4. Confirm risk-engine is alive:
   - `curl -i http://localhost:3001/health`

## Assumptions and External Dependencies

## Assumptions
1. **Bun as a Dependency Manager**:
   - The project assumes that `bun` is installed locally for dependency management and runtime.
   - Developers must install Bun by following the [Bun installation guide](https://bun.sh/docs/installation).

2. **Zod for Validation**:
   - The `zod` library is used for schema validation of Kafka topic payloads.
   - It must be installed as a dependency using `bun add zod`.

3. **Dockerized Environment**:
   - The project is designed to run in a Dockerized environment.
   - Ensure Docker is installed and running locally.

4. **Database Configuration**:
   - The PostgreSQL database must be accessible with the correct `DATABASE_URL` environment variable.
   - The `.env` file must be configured appropriately.

## External Dependencies
1. **Bun**:
   - Used for dependency management and runtime.

2. **Zod**:
   - Used for schema validation.

3. **PostgreSQL**:
   - Used as the database for storing and querying risk scores.

4. **Docker**:
   - Used to containerize the application and its dependencies.

## API (planned)
- `GET /merchants/:merchantId/orders/:orderId/risk`
  - 200: found and not expired
  - 404: missing / never computed
  - 410: expired

## Data model (planned)
- `events` (raw ingested events, dedupe by `event_id`)
- `order_snapshot` (latest order/payment/dispute state by merchant+order)
- `risk_scores` (score + breakdown + computed_at + expires_at)

## Notes
- Implementation is built in vertical slices with small commits (chore/feat/fix).
- Ensure all dependencies are installed and configured before running the project.
- Refer to the `README.md` file for setup instructions.
