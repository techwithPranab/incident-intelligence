# AI Operations

## Provider configuration

Set `AI_PROVIDER=openai`, `OPENAI_API_KEY`, `OPENAI_MODEL`, and `OPENAI_EMBEDDING_MODEL` only on the API and worker services. The browser never receives provider credentials. With `AI_PROVIDER=disabled`, AI endpoints fail closed with HTTP 503 while non-AI incident functionality remains available.

The integration uses the OpenAI Responses API with strict structured outputs and the embeddings API. Every structured response is validated with Zod before persistence or display.

## Safety and evidence

- Incident content is truncated to `AI_MAX_INPUT_CHARACTERS` and common emails, IPs, phone numbers, secrets, and bearer tokens are redacted.
- External content is wrapped as untrusted data. Prompts explicitly prohibit following instructions found in incident or knowledge content.
- Root-cause facts and hypotheses are separate.
- Citations not present in the retrieved evidence set are removed.
- Suggested historical resolutions are retained only when they cite a retrieved incident that actually has resolution notes.
- Priority is calculated exclusively through the `priority_matrix` system setting. AI recommends impact and urgency but cannot override the matrix.

## Embeddings and Atlas Vector Search

Create the Atlas indexes from `infrastructure/mongodb/atlas-vector-indexes.json`. The supplied dimensions are for `text-embedding-3-small`; update `numDimensions` if a different embedding model is selected.

Backfill incident embeddings with:

```sh
npm run embed:incidents --workspace @incident-intelligence/api
npm run embed:knowledge --workspace @incident-intelligence/api
```

Embedding documents are content-hash and model keyed, so repeated runs are idempotent. Role metadata is stored with each vector and applied as an Atlas Vector Search pre-filter. If Atlas Vector Search is unavailable, similarity falls back to clearly labeled lexical similarity; it never presents fallback scores as semantic vector scores.

## Observability

AI analysis records store model version, prompt version, token usage, provider request ID, redaction counts, evidence, status, and human-review fields. Logs contain operation metadata and usage but not raw prompts or source descriptions.

## Priority matrix

Create a `system_settings` document with key `priority_matrix`. Its value must map all nine `impact:urgency` combinations to priorities 1–5. The API returns HTTP 409 rather than inventing a matrix when the setting is absent.
