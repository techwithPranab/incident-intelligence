import http from "node:http";
import { createApp } from "./app.js";
import { connectDatabase, disconnectDatabase } from "./db/connection.js";
import { env } from "./config/env.js";
import { logger } from "./lib/logger.js";

const server = http.createServer(createApp());
async function start() { await connectDatabase(); server.listen(env.API_PORT, "0.0.0.0", () => logger.info({ port: env.API_PORT }, "API listening")); }
async function shutdown(signal: string) { logger.info({ signal }, "Shutting down"); server.close(async () => { await disconnectDatabase(); process.exit(0); }); setTimeout(() => process.exit(1), 10_000).unref(); }
process.on("SIGTERM", () => void shutdown("SIGTERM")); process.on("SIGINT", () => void shutdown("SIGINT"));
start().catch((error: unknown) => { logger.fatal({ err: error }, "Startup failed"); process.exit(1); });
