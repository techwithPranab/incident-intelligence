import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import type { z } from "zod";
export interface TokenUsage { inputTokens: number; outputTokens: number; totalTokens: number }
export interface StructuredResult<T> { data: T; model: string; usage: TokenUsage; requestId?: string }
export interface EmbeddingResult { vector: number[]; model: string; tokenCount: number }
export interface GenerateStructuredInput<TSchema extends z.ZodType> { schema: TSchema; schemaName: string; system: string; prompt: string; maxOutputTokens?: number }
export interface AiProvider { generateStructured<TSchema extends z.ZodType>(input: GenerateStructuredInput<TSchema>): Promise<StructuredResult<z.infer<TSchema>>>; embed(texts: string[]): Promise<EmbeddingResult[]> }
export interface OpenAiProviderConfig { apiKey: string; model: string; embeddingModel: string; timeoutMs?: number }
export class OpenAiProvider implements AiProvider {
  private readonly client: OpenAI;
  constructor(private readonly config: OpenAiProviderConfig) { this.client = new OpenAI({ apiKey: config.apiKey, timeout: config.timeoutMs ?? 60_000, maxRetries: 2 }); }
  async generateStructured<TSchema extends z.ZodType>(input: GenerateStructuredInput<TSchema>): Promise<StructuredResult<z.infer<TSchema>>> {
    const response = await this.client.responses.parse({ model: this.config.model, instructions: input.system, input: input.prompt, text: { format: zodTextFormat(input.schema, input.schemaName) }, max_output_tokens: input.maxOutputTokens ?? 1600 });
    if (!response.output_parsed) throw new Error("The AI provider did not return a valid structured response");
    const usage = response.usage; return { data: input.schema.parse(response.output_parsed), model: response.model, usage: { inputTokens: usage?.input_tokens ?? 0, outputTokens: usage?.output_tokens ?? 0, totalTokens: usage?.total_tokens ?? 0 }, ...(response._request_id ? { requestId: response._request_id } : {}) };
  }
  async embed(texts: string[]): Promise<EmbeddingResult[]> { if (!texts.length) return []; const response = await this.client.embeddings.create({ model: this.config.embeddingModel, input: texts, encoding_format: "float" }); const perItem = Math.ceil(response.usage.prompt_tokens / texts.length); return response.data.sort((a, b) => a.index - b.index).map((item) => ({ vector: item.embedding, model: response.model, tokenCount: perItem })); }
}
