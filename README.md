# Incident Intelligence

AI-powered ServiceNow incident analytics and assistance, built as a strict TypeScript monorepo.

## Quick start

1. Copy `.env.example` to `.env` and set `MONGODB_URI` and `JWT_SECRET`.
2. Run `npm install`.
3. Run `npm run dev` to start the API and web app.
4. Open `http://localhost:3000`; the API listens on `http://localhost:4000`.

MongoDB is required for authentication and readiness. Liveness is available at `GET /api/v1/health` without a database.

## Validation

```sh
npm run validate
npm run build
```

See [docs/IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md) and [docs/OPERATIONS.md](docs/OPERATIONS.md).

ServiceNow setup and synchronization operation are described in [docs/SERVICENOW_INTEGRATION.md](docs/SERVICENOW_INTEGRATION.md).

AI provider, safety, embeddings, and vector index operations are described in [docs/AI_OPERATIONS.md](docs/AI_OPERATIONS.md).
