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

## Assumptions (to be finalized)
- When to compute a score (e.g., after order+payment exist; dispute updates later)
- Duplicate events are expected; ingestion must be idempotent (event-level dedupe)
- Out-of-order delivery is expected; partial state is stored and recomputed when missing parts arrive
- Scores expire after TTL via `expires_at` and are treated as expired on read

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
