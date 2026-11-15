# Incident Intelligence Implementation Plan

## Architecture

The platform is an npm-workspaces monorepo. A Next.js application communicates with a versioned Express API. The API owns authentication, authorization, MongoDB access, analytics, and AI orchestration. ServiceNow synchronization runs in a separately deployable worker. Shared Zod schemas provide runtime contracts across applications.

Production boundaries:

- Web: Vercel, with only the public API base URL exposed.
- API: Render web service, stateless JWT authentication, MongoDB Atlas persistence.
- Sync: Render background worker or cron job, independently scalable and restartable.
- Data: MongoDB Atlas, including Atlas Vector Search where supported.
- AI: provider interface backed by OpenAI initially; all output schema-validated.

## Phase Status

| Phase | Scope | Status |
| --- | --- | --- |
| 1 | Monorepo, web/API foundations, MongoDB models, authentication, configuration, initial tests | Complete |
| 2 | ServiceNow connector, sync engine, normalization, 500-record seed | Complete |
| 3 | Incident APIs, dashboard, explorer, detail pages | Complete |
| 4 | OpenAI, classification, embeddings, RAG, RCA | Complete |
| 5 | Assistant, conversations, analytics, SLA, feedback | Planned |
| 6 | Full test suite, hardening, CI/CD, deployment validation | Planned |

## Phase 1 Deliverables

- [x] Inspect existing workspace and preserve user files.
- [x] Define repository conventions and architecture.
- [x] Create required directory structure.
- [x] Configure npm workspaces, strict TypeScript, linting, testing, and formatting.
- [x] Implement Express application, health/readiness endpoints, error handling, and security middleware.
- [x] Implement environment validation and MongoDB connection lifecycle.
- [x] Define initial schemas and indexes for all required collections.
- [x] Implement password authentication, JWT sessions, and Administrator/Analyst/Viewer RBAC.
- [x] Configure Next.js, Tailwind, TanStack Query, accessible login and authenticated shell.
- [x] Add unit and API integration coverage.
- [x] Install dependencies and pass lint, typecheck, tests, and builds.

## Key Decisions

- Access tokens are short-lived signed JWTs sent in the `Authorization` header. The frontend stores them in session storage for the Phase 1 local flow; production refresh-token cookies will be added with rotation before external release.
- Readiness checks validate MongoDB connectivity; liveness does not depend on external systems.
- Initial models include required indexes now so migrations are deterministic when Atlas is connected.
- SLA values will only be computed from imported ServiceNow task SLA records and configured definitions; no default targets are fabricated.
- Vector search index definitions are infrastructure artifacts because Mongoose cannot create Atlas Search indexes through ordinary collection indexes.
- Synchronization uses stable `sys_updated_on` plus `sys_id` ordering, batch checkpoints, and idempotent `(source, sourceSysId)` upserts. Recurring execution belongs to the dedicated worker/cron process.

## Phase 2 Deliverables

- [x] Implement OAuth2 and Basic-auth ServiceNow REST client.
- [x] Implement pagination, timeout handling, rate-limit awareness, and exponential-backoff retries.
- [x] Implement full and cursor-based incremental incident reads.
- [x] Normalize all required incident fields with configurable mappings while preserving raw records.
- [x] Implement batch upserts, duplicate constraints, checkpoints, sync history, and failed-record capture.
- [x] Implement authenticated manual start, current status, and paginated history endpoints.
- [x] Implement a separately deployable one-run synchronization worker for scheduled execution.
- [x] Generate and persist 500 realistic deterministic incidents with valid priority/state/date relationships.
- [x] Validate repeated seed idempotency against an isolated MongoDB instance.
- [x] Add connector, retry, normalization, synchronization, and mock-generation tests.

## Phase 3 Deliverables

- [x] Implement authenticated incident list and detail APIs.
- [x] Implement MongoDB full-text search, server pagination, sorting, and category, priority, assignment group, state, and inclusive date-range filters.
- [x] Implement incident detail history, related incidents, verified resolution display, and stored AI analysis display.
- [x] Implement overview aggregation for totals, open/resolved/critical incidents, priorities, categories, workload, and source-backed SLA counts.
- [x] Implement gap-filled daily incident trend aggregation.
- [x] Replace dashboard placeholders with responsive Recharts visualizations and metric cards.
- [x] Build responsive incident explorer table, filters, pagination, loading, error, and empty states.
- [x] Build incident detail page with source fields, lifecycle, related incidents, resolutions, and analysis records.
- [x] Add client authentication guard, active navigation, user display, and sign-out flow.
- [x] Validate search, combined filters, detail lookup, overview, and trends against 500 persisted incidents.

## Phase 4 Deliverables

- [x] Implement configurable AI provider interface and official OpenAI Responses/Embeddings provider.
- [x] Implement strict Zod structured-output schemas for classification, RCA, and priority recommendations.
- [x] Implement sensitive-data redaction, input limits, untrusted-content boundaries, and prompt-injection defenses.
- [x] Implement AI classification with confidence, model version, prompt version, usage, persistence, and human review.
- [x] Implement incident and knowledge embedding backfills with model/content-hash idempotency.
- [x] Add Atlas Vector Search definitions with role metadata filters.
- [x] Implement semantic similar-incident retrieval with scores and explicitly labeled lexical fallback.
- [x] Implement RAG root-cause analysis with separate facts/hypotheses, troubleshooting, evidence citations, and verified-resolution enforcement.
- [x] Implement impact/urgency recommendations with priority calculated only from a validated organization matrix.
- [x] Add AI analysis, classification, priority, similar-incident, analysis-history, and human-review endpoints.
- [x] Add incident-detail AI actions and structured result displays.
- [x] Add AI observability fields for tokens, provider request ID, model/prompt versions, evidence, redactions, and review state.

## Risks and Blockers

- Atlas credentials, ServiceNow OAuth credentials, OpenAI credentials, Render, and Vercel projects are intentionally not required for local mock development.
- Vector search validation requires a MongoDB Atlas deployment.
- Live integration and production deployment require explicit credentials and approval.

## Validation Log

### Phase 1 — 2026-11-15

- `npm install`: completed; 683 packages audited after security upgrades.
- `npm run validate`: passed lint and strict type checks across all workspaces; 5 tests passed in 2 files.
- `npm run build`: passed API, web, shared, AI, ServiceNow, and sync-worker production builds; Next generated all 12 application routes.
- `npm audit --omit=dev`: 0 vulnerabilities.
- MongoDB persistence was not exercised because no local or Atlas MongoDB URI was provided. Model compilation, indexes, connection lifecycle, and readiness behavior are covered by build/type/API checks.

### Phase 2 — 2026-11-15

- Implemented ServiceNow connector, normalization, synchronization orchestration, manual API endpoints, and scheduled worker.
- `npm run seed:incidents --workspace @incident-intelligence/api -- 500`: first run inserted 500; second run inserted 0 and updated the same 500.
- MongoDB verification: 500 documents, 500 unique incident numbers, 204 resolved incidents, 84 incidents with relationships, and required unique/text/compound indexes present.
- An ESM-only Mongoose model-registry issue discovered during real persistence testing was corrected before final validation.
- `npm run validate`: passed lint and strict type checks across all workspaces; 12 tests passed in 4 files.
- `npm run build`: passed production builds for API, web, shared, AI, ServiceNow, and sync worker.
- `npm audit --omit=dev`: 0 vulnerabilities.

### Phase 3 — 2026-11-15

- Live authenticated API validation against 500 incidents: Network/P2 combined filter returned 44 matches with a 10-item page; VPN full-text search returned 68 matches with a 5-item page.
- Incident detail lookup by `INC1000001` returned its normalized record and lifecycle history.
- Overview aggregation returned 500 total, 296 open, 204 resolved, and 167 critical incidents. SLA totals remained zero because mock records contain no fabricated source SLA definitions.
- Trend aggregation returned a complete, gap-filled 30-day series.
- `npm run validate`: passed lint and strict type checks across all workspaces; 14 tests passed in 4 files.
- `npm run build`: passed all production builds and generated all 12 Next application routes.
- `npm audit --omit=dev`: 0 vulnerabilities.

### Phase 4 — 2026-11-15

- Implemented the OpenAI provider with the Responses API structured-output parser and embeddings API through the official JavaScript SDK.
- Added incident and knowledge vector pipelines plus Atlas index definitions. Local MongoDB uses a clearly labeled lexical fallback because it does not provide Atlas Vector Search.
- Added evidence allow-listing: unsupported citations are removed and historical resolution suggestions require a retrieved incident with actual resolution notes.
- Added fail-closed validation: unconfigured AI returns HTTP 503; an absent or incomplete organization priority matrix returns HTTP 409.
- `npm run validate`: passed lint and strict type checks across all workspaces; 18 tests passed in 5 files.
- `npm run build`: passed all production builds and generated all 12 Next routes.
- `npm audit --omit=dev`: 0 vulnerabilities.
- Live OpenAI generation and Atlas Vector Search were not executed because no API key or Atlas deployment/index was supplied.
