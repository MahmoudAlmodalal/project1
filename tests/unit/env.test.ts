import { describe, it, expect } from "vitest";
import { env } from "@/lib/env";

describe("Environment Configuration", () => {
  it("should have valid default environment settings", () => {
    expect(env.NODE_ENV).toBeDefined();
    expect(env.DATABASE_URL).toContain("postgresql://");
    expect(env.NEXT_PUBLIC_DEFAULT_LOCALE).toBe("ar");
  });
});
