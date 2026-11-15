import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt, { type SignOptions } from "jsonwebtoken";
import { loginRequestSchema } from "@incident-intelligence/shared";
import { env } from "../config/env.js";
import { UserModel, AuditLogModel } from "../models/index.js";
import { ApiError } from "../middleware/error.js";

export const authRouter = Router();
authRouter.post("/login", async (req, res, next) => {
  try {
    const input = loginRequestSchema.parse(req.body);
    const user = await UserModel.findOne({ email: input.email, active: true }).select("+passwordHash");
    if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) throw new ApiError(401, "INVALID_CREDENTIALS", "Email or password is incorrect");
    const roles = user.roles ?? [];
    const options: SignOptions = { issuer: env.JWT_ISSUER, audience: env.JWT_AUDIENCE, subject: user.id, expiresIn: env.JWT_EXPIRES_IN as NonNullable<SignOptions["expiresIn"]> };
    const accessToken = jwt.sign({ email: user.email, roles }, env.JWT_SECRET, options);
    user.lastLoginAt = new Date(); await user.save();
    await AuditLogModel.create({ actorId: user._id, action: "auth.login", resourceType: "user", resourceId: user.id, outcome: "success", ip: req.ip, requestId: req.id });
    res.json({ accessToken, expiresIn: 900, user: { id: user.id, email: user.email, displayName: user.displayName, roles } });
  } catch (error) { next(error); }
});
