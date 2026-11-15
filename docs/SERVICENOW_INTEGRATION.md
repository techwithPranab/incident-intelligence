# ServiceNow Integration

## Required access

Use a dedicated read-only ServiceNow integration account. It needs read access to the `incident` table and the fields listed in `.env.example`. OAuth2 client credentials are preferred; Basic authentication is supported for instances that do not expose client credentials.

## Configuration

- `SERVICENOW_INSTANCE_URL`: instance origin, such as `https://example.service-now.com`.
- `SERVICENOW_AUTH_TYPE`: `oauth2` or `basic`.
- OAuth: `SERVICENOW_CLIENT_ID`, `SERVICENOW_CLIENT_SECRET`.
- Basic: `SERVICENOW_USERNAME`, `SERVICENOW_PASSWORD`.
- `SERVICENOW_PAGE_SIZE`: records per request, 1–1000.
- `SERVICENOW_MAX_RETRIES`: retry count for timeouts, HTTP 408, 429, and 5xx responses.
- `SERVICENOW_FIELD_MAPPINGS_JSON`: optional JSON array of `{ "source", "target" }` mappings.
- `SYNC_BATCH_SIZE`: MongoDB bulk-upsert checkpoint size.

Secrets belong in Render environment variables or another secret manager, never in frontend variables or source control.

## Operation

Manual synchronization is available to Administrators and Analysts:

- `POST /api/v1/sync/start` with `{ "type": "full" }` or `{ "type": "incremental" }`.
- `GET /api/v1/sync/status` returns the latest run.
- `GET /api/v1/sync/history?page=1&limit=20` returns durable history.

Scheduled synchronization uses the dedicated `@incident-intelligence/sync-worker` process. Set `SYNC_TYPE=incremental` for recurring jobs. The worker exits after one run, making it suitable for Render cron jobs; it does not depend on an in-memory API scheduler.

Import actual ServiceNow `task_sla` records after incidents with `npm run sync:slas --workspace @incident-intelligence/api`. Records without a matching imported incident, SLA definition, or planned end time are skipped and reported. No default SLA duration is synthesized.

## Idempotency and recovery

Incidents are upserted using `(source, sourceSysId)` and additionally protected by a unique `(source, number)` index. Each batch writes a durable checkpoint. Invalid records are skipped and retained in the sync history with source ID, code, and message. A partial run can be repeated safely; successful records are updated, not duplicated.

Incremental runs use the latest successful cursor and request records ordered by `sys_updated_on` and `sys_id`. Full runs always scan the entire incident table.
