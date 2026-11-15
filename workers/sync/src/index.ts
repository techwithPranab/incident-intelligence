import crypto from "node:crypto";
import mongoose from "mongoose";
import { z } from "zod";
import { ServiceNowClient, parseFieldMappings, synchronizeIncidents, type IncidentSyncRepository } from "@incident-intelligence/servicenow";

const env = z.object({
  MONGODB_URI: z.string().min(1), SERVICENOW_INSTANCE_URL: z.string().url(), SERVICENOW_AUTH_TYPE: z.enum(["oauth2", "basic"]).default("oauth2"),
  SERVICENOW_CLIENT_ID: z.string().optional(), SERVICENOW_CLIENT_SECRET: z.string().optional(), SERVICENOW_USERNAME: z.string().optional(), SERVICENOW_PASSWORD: z.string().optional(),
  SERVICENOW_PAGE_SIZE: z.coerce.number().int().min(1).max(1000).default(100), SERVICENOW_MAX_RETRIES: z.coerce.number().int().min(0).max(10).default(5),
  SERVICENOW_FIELD_MAPPINGS_JSON: z.string().optional(), SYNC_BATCH_SIZE: z.coerce.number().int().min(1).max(1000).default(100), SYNC_TYPE: z.enum(["full", "incremental"]).default("incremental"),
}).parse(process.env);
const syncId = crypto.randomUUID();
async function main(): Promise<void> {
  await mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 10_000, maxPoolSize: 10 }); const db = mongoose.connection.db; if (!db) throw new Error("MongoDB connection is unavailable");
  const histories = db.collection("incidentsynchistories"); const incidents = db.collection("incidents");
  await histories.insertOne({ syncId, type: env.SYNC_TYPE, status: "running", startedAt: new Date(), recordsRead: 0, recordsUpserted: 0, recordsFailed: 0, initiatedBy: "scheduled-worker", createdAt: new Date(), updatedAt: new Date() });
  try {
    const auth = env.SERVICENOW_AUTH_TYPE === "oauth2" ? { type: "oauth2" as const, ...(env.SERVICENOW_CLIENT_ID ? { clientId: env.SERVICENOW_CLIENT_ID } : {}), ...(env.SERVICENOW_CLIENT_SECRET ? { clientSecret: env.SERVICENOW_CLIENT_SECRET } : {}) } : { type: "basic" as const, ...(env.SERVICENOW_USERNAME ? { username: env.SERVICENOW_USERNAME } : {}), ...(env.SERVICENOW_PASSWORD ? { password: env.SERVICENOW_PASSWORD } : {}) };
    const client = new ServiceNowClient({ instanceUrl: env.SERVICENOW_INSTANCE_URL, auth, pageSize: env.SERVICENOW_PAGE_SIZE, maxRetries: env.SERVICENOW_MAX_RETRIES });
    const latest = env.SYNC_TYPE === "incremental" ? await histories.findOne({ status: { $in: ["completed", "partial"] }, cursor: { $exists: true } }, { sort: { completedAt: -1 } }) : null;
    const cursor = latest?.cursor ? new Date(String(latest.cursor).replace(" ", "T") + "Z") : undefined;
    const repository: IncidentSyncRepository = {
      upsertBatch: async (items) => { await incidents.bulkWrite(items.map((item) => ({ updateOne: { filter: { source: "servicenow", sourceSysId: item.sourceSysId }, update: { $set: { ...item, updatedAt: new Date() }, $setOnInsert: { createdAt: new Date() } }, upsert: true } })), { ordered: false }); return items.length; },
      checkpoint: async (progress, failures) => { await histories.updateOne({ syncId }, { $set: { recordsRead: progress.read, recordsUpserted: progress.upserted, recordsFailed: progress.failed, ...(progress.cursor ? { cursor: progress.cursor } : {}), failures: failures.slice(-1000), updatedAt: new Date() } }); },
    };
    const result = await synchronizeIncidents({ client, repository, ...(cursor && !Number.isNaN(cursor.valueOf()) ? { query: { updatedAfter: cursor } } : {}), mappings: parseFieldMappings(env.SERVICENOW_FIELD_MAPPINGS_JSON), batchSize: env.SYNC_BATCH_SIZE });
    await histories.updateOne({ syncId }, { $set: { status: result.failed ? "partial" : "completed", completedAt: new Date(), updatedAt: new Date() } }); process.stdout.write(JSON.stringify({ syncId, status: result.failed ? "partial" : "completed", ...result }) + "\n");
  } catch (error) { await histories.updateOne({ syncId }, { $set: { status: "failed", completedAt: new Date(), updatedAt: new Date(), failures: [{ sourceId: "sync", code: "SYNC_ERROR", message: error instanceof Error ? error.message : "Unknown error" }] } }); throw error; }
  finally { await mongoose.disconnect(); }
}
main().catch((error: unknown) => { process.stderr.write(JSON.stringify({ syncId, status: "failed", message: error instanceof Error ? error.message : "Unknown error" }) + "\n"); process.exit(1); });
