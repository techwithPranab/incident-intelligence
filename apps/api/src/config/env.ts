import "dotenv/config";
import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  API_PORT: z.coerce.number().int().positive().default(4000),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),
  MONGODB_URI: z.string().min(1).default("mongodb://127.0.0.1:27017/incident_intelligence"),
  JWT_SECRET: z.string().min(32).default("development-only-secret-change-me-12345"),
  JWT_ISSUER: z.string().default("incident-intelligence-api"),
  JWT_AUDIENCE: z.string().default("incident-intelligence-web"),
  JWT_EXPIRES_IN: z.string().default("15m"),
  CORS_ORIGINS: z.string().default("http://localhost:3000"),
  ADMIN_EMAIL: z.string().email().optional(),
  ADMIN_PASSWORD: z.string().min(12).optional(),
  SERVICENOW_INSTANCE_URL: z.string().url().optional(),
  SERVICENOW_CLIENT_ID: z.string().optional(),
  SERVICENOW_CLIENT_SECRET: z.string().optional(),
  SERVICENOW_AUTH_TYPE: z.enum(["oauth2", "basic"]).default("oauth2"),
  SERVICENOW_USERNAME: z.string().optional(),
  SERVICENOW_PASSWORD: z.string().optional(),
  SERVICENOW_PAGE_SIZE: z.coerce.number().int().min(1).max(1000).default(100),
  SERVICENOW_MAX_RETRIES: z.coerce.number().int().min(0).max(10).default(5),
  SERVICENOW_FIELD_MAPPINGS_JSON: z.string().optional(),
  SYNC_BATCH_SIZE: z.coerce.number().int().min(1).max(1000).default(100),
  AI_PROVIDER: z.enum(["openai", "disabled"]).default("disabled"),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default("gpt-4.1-mini"),
  OPENAI_EMBEDDING_MODEL: z.string().default("text-embedding-3-small"),
  AI_CLASSIFICATION_PROMPT_VERSION: z.string().default("classification-v1"),
  AI_RCA_PROMPT_VERSION: z.string().default("rca-v1"),
  AI_MAX_INPUT_CHARACTERS: z.coerce.number().int().min(1000).max(100_000).default(12_000),
  MONGODB_VECTOR_INDEX: z.string().default("incident_embedding_vector"),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) throw new Error(`Invalid environment: ${parsed.error.message}`);
export const env = { ...parsed.data, corsOrigins: parsed.data.CORS_ORIGINS.split(",").map((v) => v.trim()).filter(Boolean) };
