// lib/env.ts
import { z } from "zod";

const EnvSchema = z.object({
  JWT_SECRET: z
    .string()
    .min(32, "JWT_SECRET doit faire au moins 32 caractères"),
  DATABASE_URL: z.string().url(),
  RESEND_TOKEN: z
    .string()
    .min(32, "RESEND_TOKEN doit faire au moins 32 caractères"),
  APP_URL: z.string(),
  UPSTASH_REDIS_REST_TOKEN: z
    .string()
    .min(32, "UPSTASH_REDIS_REST_TOKEN doit faire au moins 32 caractères"),
  UPSTASH_REDIS_REST_URL: z.string().url(),
});

export const env = EnvSchema.parse(process.env);
