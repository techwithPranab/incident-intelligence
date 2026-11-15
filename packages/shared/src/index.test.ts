import { describe, expect, it } from "vitest";
import { loginRequestSchema, roleSchema } from "./index.js";

describe("shared contracts", () => {
  it("normalizes login email", () => {
    expect(loginRequestSchema.parse({ email: " Admin@Example.com ", password: "password123" }).email).toBe("admin@example.com");
  });

  it("rejects unknown roles", () => expect(() => roleSchema.parse("owner")).toThrow());
});
