import bcrypt from "bcryptjs";
import { connectDatabase, disconnectDatabase } from "../db/connection.js";
import { env } from "../config/env.js";
import { RoleModel, UserModel } from "../models/index.js";

if (!env.ADMIN_EMAIL || !env.ADMIN_PASSWORD) throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD are required");
await connectDatabase();
const role = await RoleModel.findOneAndUpdate({ name: "administrator" }, { $set: { permissions: ["*"] } }, { upsert: true, new: true });
const passwordHash = await bcrypt.hash(env.ADMIN_PASSWORD, 12);
await UserModel.findOneAndUpdate({ email: env.ADMIN_EMAIL }, { $set: { displayName: "Administrator", passwordHash, roles: ["administrator"], roleIds: [role._id], active: true } }, { upsert: true });
await disconnectDatabase();
process.stdout.write(`Administrator ${env.ADMIN_EMAIL} is ready\n`);
