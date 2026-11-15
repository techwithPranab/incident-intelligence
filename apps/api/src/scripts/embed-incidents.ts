import crypto from "node:crypto";
import { redactForAi } from "@incident-intelligence/ai";
import { connectDatabase, disconnectDatabase } from "../db/connection.js";
import { IncidentEmbeddingModel, IncidentModel } from "../models/index.js";
import { getAiProvider } from "../services/ai-provider.js";
import { env } from "../config/env.js";
interface EmbeddingIncident { _id: unknown; number?: string; shortDescription?: string; description?: string; category?: string; subcategory?: string }
await connectDatabase(); const provider = getAiProvider(); const cursor = IncidentModel.find().select("number shortDescription description category subcategory").lean().cursor(); let batch: EmbeddingIncident[] = []; let total = 0;
async function flush() { if (!batch.length) return; const texts = batch.map((item) => redactForAi([item.number, item.shortDescription, item.description, item.category, item.subcategory].filter(Boolean).join("\n"), env.AI_MAX_INPUT_CHARACTERS).text); const embeddings = await provider.embed(texts); await IncidentEmbeddingModel.bulkWrite(batch.map((item, index) => ({ updateOne: { filter: { sourceId: item._id, model: embeddings[index]!.model, contentHash: crypto.createHash("sha256").update(texts[index]!).digest("hex") }, update: { $set: { vector: embeddings[index]!.vector, dimensions: embeddings[index]!.vector.length, metadata: { category: item.category, allowedRoles: ["administrator", "analyst", "viewer"] } } }, upsert: true } })), { ordered: false }); total += batch.length; process.stdout.write(`Embedded ${total} incidents\n`); batch = []; }
for await (const incident of cursor) { batch.push(incident); if (batch.length >= 50) await flush(); } await flush(); await disconnectDatabase();
