import { Router } from "express";
import { z } from "zod";
import { authenticate, authorize } from "../middleware/auth.js";
import { IncidentSyncHistoryModel } from "../models/index.js";
import { startIncidentSync } from "../services/incident-sync.js";

export const syncRouter = Router(); syncRouter.use(authenticate);
syncRouter.post("/start", authorize("administrator", "analyst"), async (req, res, next) => { try { const { type } = z.object({ type: z.enum(["full", "incremental"]).default("incremental") }).parse(req.body); const active = await IncidentSyncHistoryModel.exists({ status: { $in: ["queued", "running"] } }); if (active) { res.status(409).json({ error: { code: "SYNC_IN_PROGRESS", message: "A synchronization is already active", requestId: req.id } }); return; } const syncId = await startIncidentSync(type, req.auth!.userId); res.status(202).json({ syncId, status: "queued" }); } catch (error) { next(error); } });
syncRouter.get("/status", async (_req, res, next) => { try { const current = await IncidentSyncHistoryModel.findOne().sort({ createdAt: -1 }).lean(); res.json({ sync: current }); } catch (error) { next(error); } });
syncRouter.get("/history", async (req, res, next) => { try { const input = z.object({ page: z.coerce.number().int().min(1).default(1), limit: z.coerce.number().int().min(1).max(100).default(20) }).parse(req.query); const [items, total] = await Promise.all([IncidentSyncHistoryModel.find().sort({ createdAt: -1 }).skip((input.page - 1) * input.limit).limit(input.limit).lean(), IncidentSyncHistoryModel.countDocuments()]); res.json({ items, pagination: { page: input.page, limit: input.limit, total, pages: Math.ceil(total / input.limit) } }); } catch (error) { next(error); } });
