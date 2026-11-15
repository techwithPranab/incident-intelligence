import type { ErrorRequestHandler, RequestHandler } from "express";
import { ZodError } from "zod";
import { logger } from "../lib/logger.js";
export class ApiError extends Error { constructor(public status: number, public code: string, message: string, public details?: unknown) { super(message); } }
export const notFound: RequestHandler = (req, _res, next) => next(new ApiError(404, "NOT_FOUND", `Route ${req.method} ${req.path} was not found`));
export const errorHandler: ErrorRequestHandler = (error: unknown, req, res, _next) => {
  void _next;
  const normalized = error instanceof ApiError ? error : error instanceof ZodError ? new ApiError(400, "VALIDATION_ERROR", "Request validation failed", error.flatten()) : new ApiError(500, "INTERNAL_ERROR", "An unexpected error occurred");
  if (normalized.status >= 500) logger.error({ err: error, requestId: req.id }, "Request failed");
  res.status(normalized.status).json({ error: { code: normalized.code, message: normalized.message, requestId: req.id, ...(normalized.details === undefined ? {} : { details: normalized.details }) } });
};
