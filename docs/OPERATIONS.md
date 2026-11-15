# Operations

## Configuration

Copy `.env.example` to `.env`. Secrets must be injected by the hosting platform in production and must never be committed.

The API fails fast when configuration is invalid. `JWT_SECRET` must contain at least 32 characters outside tests. CORS accepts only configured origins. MongoDB connection readiness is exposed separately from liveness.

## Local services

- `npm run dev`: starts all development processes.
- `npm run dev --workspace @incident-intelligence/api`: API only.
- `npm run dev --workspace @incident-intelligence/web`: web only.

## Health

- `GET /api/v1/health`: process liveness.
- `GET /api/v1/ready`: dependency readiness; returns 503 until MongoDB is connected.

## Initial administrator

Set `ADMIN_EMAIL` and `ADMIN_PASSWORD`, then run `npm run seed:admin --workspace @incident-intelligence/api`. Rotate or remove bootstrap credentials afterward.

## Mock incident data

With MongoDB available, run `npm run seed:incidents --workspace @incident-intelligence/api -- 500`. The deterministic seed uses idempotent upserts and verifies the persisted document count before exiting.

## Shutdown

The API handles `SIGTERM` and `SIGINT`, stops accepting connections, drains the HTTP server, closes MongoDB, and exits.
