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

export const resetPasswordRateLimitIp = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, "1 h"),
  prefix: "ratelimit:resetPasswordIp",
});

export const resetPasswordRateLimitEmail = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, "1 h"),
  prefix: "ratelimit:resetPasswordEmail",
});

export const registerRateLimitEmail = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "1 h"),
  prefix: "ratelimit:registerMAIL",
});

export const registerRateLimitIp = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "1 h"),
  prefix: "ratelimit:registerIp",
});

export const userRateLimitIpMobil = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "60 s"),
  prefix: "ratelimit:userIpMobil",
});

export const userRateLimitEmailWeb = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "60 s"),
  prefix: "ratelimit:userEmailWeb",
});

export const userRateLimitIpWeb = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "60 s"),
  prefix: "ratelimit:userIpWeb",
});

export const seanceRateLimitUserIdPOST = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(60, "60 s"),
  prefix: "ratelimit:seanceUserIdPOST",
});

export const seanceRateLimitIpMobilePOST = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(60, "60 s"),
  prefix: "ratelimit:seanceIpMobilePOST",
});

export const seanceRateLimitUserIdGET = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(60, "60 s"),
  prefix: "ratelimit:seanceUserIdGET",
});

export const seanceRateLimitIpMobileGET = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(60, "60 s"),
  prefix: "ratelimit:seanceIpMobileGET",
});

export const timerrunnerRateLimitUserId = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(60, "60 s"),
  prefix: "ratelimit:timerrunnerUserId",
});

export const timerrunnerRateLimitIpMobile = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(60, "60 s"),
  prefix: "ratelimit:timerrunnerIpMobile",
});

export const timerpauseRateLimitUserId = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(60, "60 s"),
  prefix: "ratelimit:timerpauseUserId",
});

export const timerpauseRateLimitIpMobile = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(60, "60 s"),
  prefix: "ratelimit:timerpauseIpMobile",
});
