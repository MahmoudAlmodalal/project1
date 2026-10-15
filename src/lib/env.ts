import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().url().default("postgresql://postgres:postgres@localhost:5432/borrowhub?schema=public"),
  JWT_SECRET: z.string().min(16).default("super-secret-borrowhub-jwt-token-key-32-chars"),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_DEFAULT_LOCALE: z.enum(["ar", "en"]).default("ar"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:", JSON.stringify(parsed.error.format(), null, 2));
  throw new Error("Invalid environment variables");
}

export const env = parsed.data;
