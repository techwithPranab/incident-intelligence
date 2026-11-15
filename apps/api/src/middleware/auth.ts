import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { roleSchema, type Role } from "@incident-intelligence/shared";
import { env } from "../config/env.js";
import { ApiError } from "./error.js";

export const authenticate: RequestHandler = (req, _res, next) => {
  const [scheme, token] = req.header("authorization")?.split(" ") ?? [];
  if (scheme !== "Bearer" || !token) return next(new ApiError(401, "UNAUTHENTICATED", "A valid bearer token is required"));
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET, { issuer: env.JWT_ISSUER, audience: env.JWT_AUDIENCE });
    if (typeof decoded === "string" || !decoded.sub || typeof decoded.email !== "string" || !Array.isArray(decoded.roles)) throw new Error("Invalid claims");
    req.auth = { userId: decoded.sub, email: decoded.email, roles: decoded.roles.map((role) => roleSchema.parse(role)) };
    next();
  } catch { next(new ApiError(401, "INVALID_TOKEN", "The access token is invalid or expired")); }
};
export const authorize = (...allowed: Role[]): RequestHandler => (req, _res, next) => req.auth?.roles.some((role) => allowed.includes(role)) ? next() : next(new ApiError(403, "FORBIDDEN", "You do not have permission to perform this action"));
