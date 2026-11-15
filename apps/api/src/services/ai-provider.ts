import { OpenAiProvider, type AiProvider } from "@incident-intelligence/ai";
import { env } from "../config/env.js";
import { ApiError } from "../middleware/error.js";
let provider: AiProvider | undefined;
export function getAiProvider(): AiProvider { if (env.AI_PROVIDER === "disabled") throw new ApiError(503, "AI_PROVIDER_DISABLED", "AI provider is not configured"); if (!env.OPENAI_API_KEY) throw new ApiError(503, "AI_PROVIDER_NOT_CONFIGURED", "OPENAI_API_KEY is not configured"); provider ??= new OpenAiProvider({ apiKey: env.OPENAI_API_KEY, model: env.OPENAI_MODEL, embeddingModel: env.OPENAI_EMBEDDING_MODEL }); return provider; }
