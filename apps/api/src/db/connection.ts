import mongoose from "mongoose";
import { env } from "../config/env.js";
import { logger } from "../lib/logger.js";

export async function connectDatabase(): Promise<void> {
  if (mongoose.connection.readyState === 1) return;
  mongoose.set("strictQuery", true);
  await mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 10_000, maxPoolSize: 20, minPoolSize: 1 });
  logger.info("MongoDB connected");
}
export async function disconnectDatabase(): Promise<void> { await mongoose.disconnect(); }
export function isDatabaseReady(): boolean { return mongoose.connection.readyState === 1; }
