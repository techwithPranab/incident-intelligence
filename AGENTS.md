# Repository Conventions

## Scope

These conventions apply to the entire repository.

## Architecture

- `apps/web`: Next.js App Router frontend. Never expose server secrets through `NEXT_PUBLIC_*` variables.
- `apps/api`: Express REST API, authentication, persistence, and orchestration.
- `packages/shared`: Runtime-safe Zod contracts and framework-neutral utilities.
- `packages/ai`: AI provider abstractions and implementations.
- `packages/servicenow`: ServiceNow client, normalization, and mapping.
- `workers/sync`: Dedicated synchronization worker; scheduling must not live in the API process.
- `infrastructure`: Hosting configuration.
- `tests`: Cross-package and end-to-end tests.

## Engineering Rules

- TypeScript remains strict; do not introduce `any` without a documented boundary.
- Validate environment variables and all external inputs with Zod.
- Keep route handlers thin; business logic belongs in services.
- Database models own indexes and persistence invariants.
- Preserve ServiceNow source payloads while storing normalized fields separately.
- AI output must be structured, schema-validated, attributable, and redact sensitive data.
- Never execute arbitrary database queries or code emitted by an LLM.
- Add tests for changes and run `npm run validate` before handoff.
- Use structured logging; never log secrets, tokens, passwords, or raw authorization headers.
- API routes are versioned under `/api/v1` except health endpoints, which are also versioned.

## Git and Delivery

- Use conventional commits when commits are requested.
- Do not deploy without explicit approval.
- Keep `.env` files untracked and update `.env.example` for new settings.
- Do not modify unrelated user changes.
