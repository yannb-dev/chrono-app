// lib/rateLimit.ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

export const loginRateLimitIP = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "60 s"),
  prefix: "ratelimit:loginIP",
});

export const loginRateLimitEmail = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "60 s"),
  prefix: "ratelimit:loginEMAIL",
});

export const resetPasswordRateLimitIpEmail = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, "60 s"),
  prefix: "ratelimit:loginPassword",
});

export const registerRateLimitEmail = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(1, "600 s"),
  prefix: "ratelimit:loginEMAIL",
});

export const registerRateLimitIp = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(1, "600 s"),
  prefix: "ratelimit:loginEMAIL",
});
