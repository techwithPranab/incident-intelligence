import crypto from "node:crypto";
import { redactForAi } from "@incident-intelligence/ai";
import { connectDatabase, disconnectDatabase } from "../db/connection.js";
import { KnowledgeArticleModel, KnowledgeEmbeddingModel } from "../models/index.js";
import { getAiProvider } from "../services/ai-provider.js";
import { env } from "../config/env.js";
interface Article { _id: unknown; number?: string; title: string; body?: string; categories?: string[] }
await connectDatabase(); const provider = getAiProvider(); const cursor = KnowledgeArticleModel.find().select("number title body categories").lean().cursor(); let batch: Article[] = []; let total = 0;
async function flush() { if (!batch.length) return; const texts = batch.map((item) => redactForAi([item.number, item.title, item.body, item.categories?.join(", ")].filter(Boolean).join("\n"), env.AI_MAX_INPUT_CHARACTERS).text); const embeddings = await provider.embed(texts); await KnowledgeEmbeddingModel.bulkWrite(batch.map((item, index) => ({ updateOne: { filter: { sourceId: item._id, model: embeddings[index]!.model, contentHash: crypto.createHash("sha256").update(texts[index]!).digest("hex") }, update: { $set: { vector: embeddings[index]!.vector, dimensions: embeddings[index]!.vector.length, metadata: { categories: item.categories, allowedRoles: ["administrator", "analyst", "viewer"] } } }, upsert: true } })), { ordered: false }); total += batch.length; process.stdout.write(`Embedded ${total} knowledge articles\n`); batch = []; }
for await (const article of cursor) { batch.push(article as unknown as Article); if (batch.length >= 50) await flush(); } await flush(); await disconnectDatabase();
