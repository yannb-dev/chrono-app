// @vitest-environment node

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { prismaMock } from "@/test/prismaMock";
import { POST } from "@/app/api/timerpause/route";
import getUserIdFromRequest from "@/lib/auth";

import {
  timerpauseRateLimitIpMobile,
  timerpauseRateLimitUserId,
} from "@/lib/rateLimit";

vi.mock("@/lib/auth", () => ({ default: vi.fn() }));

vi.mock("@/lib/rateLimit", () => ({
  timerpauseRateLimitUserId: { limit: vi.fn() },
  timerpauseRateLimitIpMobile: { limit: vi.fn() },
}));

const userMock = vi.mocked(getUserIdFromRequest);

// //======= POST ===========
// //========================

describe("POST /api/timerpause", () => {
  const makePost = (body: unknown) =>
    new Request("http://localhost/api/timerpause", {
      method: "POST",
      headers: { "x-forwarded-for": "1.2.3.4" },
      body: JSON.stringify(body),
    });

  const makePostWithoutIp = (body: unknown) =>
    new Request("http://localhost/api/timerpause", {
      method: "POST",
      body: JSON.stringify(body),
    });

  const NOW = new Date("2026-01-01T10:00:00Z");
  const STARTED_AT = new Date("2026-01-01T10:00:30Z");
  const PAUSE_AT_GOOD = new Date("2026-01-01T10:00:40Z");
  const PAUSE_AT_BAD = new Date("2026-01-01T09:59:20Z");

  const goodValue = {
    seanceId: "aze123+",
    pausedAt: PAUSE_AT_GOOD,
  };
  const badValue = { startedAt: "20/01/2020", state: "" };

  const limitMockUserId = vi.mocked(timerpauseRateLimitUserId.limit);
  const limitMockIp = vi.mocked(timerpauseRateLimitIpMobile.limit);

  const ok = { success: true, limit: 60, remaining: 59, reset: 0 };
  const blocked = { success: false, limit: 60, remaining: 0, reset: 0 };

  beforeEach(() => {
    userMock.mockResolvedValue("u1" as never);
    limitMockIp.mockResolvedValue(ok as never);
    limitMockUserId.mockResolvedValue(ok as never);
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  //   //   // ==== TEST 1 ====
  //   //   //
  it("renvoie 401 -Non autorisé", async () => {
    const userMock = vi.mocked(getUserIdFromRequest);
    userMock.mockResolvedValue(null as never);

    const res = await POST(makePost(goodValue));

    expect(res.status).toBe(401);
    expect(prismaMock.timerPause.create).not.toHaveBeenCalled();
  });

  //   //   // ==== TEST 2 ====
  //   //   //
  it("renvoie 400 - Headers sans IP", async () => {
    const userMock = vi.mocked(getUserIdFromRequest);
    userMock.mockResolvedValue("ul" as never);

    const res = await POST(makePostWithoutIp(goodValue));

    expect(res.status).toBe(400);
    expect(prismaMock.timerPause.create).not.toHaveBeenCalled();
  });

  //   // ==== TEST 3 ====
  //   //   //
  it("renvoie 429 - ratelimit IP", async () => {
    const userMock = vi.mocked(getUserIdFromRequest);
    userMock.mockResolvedValue("u1" as never);
    limitMockIp.mockResolvedValue(blocked as never);

    const res = await POST(makePost(badValue));

    expect(res.status).toBe(429);
    expect(prismaMock.timerPause.create).not.toHaveBeenCalled();
  });

  //   // ==== TEST 4 ====
  //   //   //
  it("renvoie 429 - ratelimit USERID", async () => {
    const userMock = vi.mocked(getUserIdFromRequest);
    userMock.mockResolvedValue("u1" as never);
    limitMockUserId.mockResolvedValue(blocked as never);

    const res = await POST(makePost(badValue));

    expect(res.status).toBe(429);
    expect(prismaMock.timerPause.create).not.toHaveBeenCalled();
  });

  //   // ==== TEST 4 ====
  //   //   //
  it("renvoie 503 - ratelimit HS", async () => {
    const userMock = vi.mocked(getUserIdFromRequest);
    userMock.mockResolvedValue("u1" as never);
    limitMockUserId.mockRejectedValue(new Error("Uptash down") as never);

    const res = await POST(makePost(badValue));

    expect(res.status).toBe(503);
    expect(prismaMock.timerPause.create).not.toHaveBeenCalled();
  });

  //   // ==== TEST 5 ====
  //   //   //
  it("renvoie 400 - erreur validation ZOD", async () => {
    const userMock = vi.mocked(getUserIdFromRequest);
    userMock.mockResolvedValue("u1" as never);
    limitMockUserId.mockResolvedValue(ok as never);

    const res = await POST(makePost(badValue));

    expect(res.status).toBe(400);
    expect(prismaMock.timerPause.create).not.toHaveBeenCalled();
  });

  //   //   // ==== TEST 5 ====
  //   //   //
  it("renvoie 404 - Aucune séance trouvé", async () => {
    const userMock = vi.mocked(getUserIdFromRequest);

    const returnSeance = null;

    userMock.mockResolvedValue("u1" as never);
    limitMockUserId.mockResolvedValue(ok as never);
    prismaMock.seance.findUnique.mockResolvedValue(returnSeance as never);

    const res = await POST(makePost(goodValue));

    expect(res.status).toBe(404);
    expect(prismaMock.seance.findUnique).toHaveBeenCalled();
  });

  //   //   // ==== TEST 5 ====
  //   //   //
  it("renvoie 403 - Une séance trouvé mais startedAt : Null", async () => {
    const userMock = vi.mocked(getUserIdFromRequest);

    const returnSeance = {
      id: "aze123++",
      createdAt: NOW,
      totalRunner: 20,
      colorRunner: "rgb",
      startedAt: null,
      state: "NoStart",
      userId: "ul",
    };

    userMock.mockResolvedValue("u1" as never);
    limitMockUserId.mockResolvedValue(ok as never);
    prismaMock.seance.findUnique.mockResolvedValue(returnSeance as never);

    const res = await POST(makePost(goodValue));

    expect(res.status).toBe(403);
    expect(prismaMock.seance.findUnique).toHaveBeenCalled();
  });

  //   //   // ==== TEST 5 ====
  //   //   //
  it("renvoie 400 - valeur incohérente et négative", async () => {
    const userMock = vi.mocked(getUserIdFromRequest);

    const returnSeance = {
      id: "aze123+",
      createdAt: NOW,
      totalRunner: 20,
      colorRunner: "rgb",
      startedAt: STARTED_AT,
      state: "InProgress",
      userId: "u1",
    };

    const returnSeanceNull = null;

    const newTimerPause = {
      id: "oiu789+",
      userId: "u1",
      pausedAt: PAUSE_AT_BAD,
      endedAt: null,
      pauseDurationMs: null,
      seanceId: "aze123+",
    };

    userMock.mockResolvedValue("u1" as never);
    limitMockUserId.mockResolvedValue(ok as never);
    prismaMock.seance.findUnique.mockResolvedValue(returnSeance as never);
    prismaMock.timerPause.create.mockResolvedValue(newTimerPause as never);

    const res = await POST(makePost({ ...goodValue, pausedAt: PAUSE_AT_BAD }));

    expect(prismaMock.seance.findUnique).toHaveBeenCalled();
    expect(res.status).toBe(400);
    expect(prismaMock.timerPause.create).not.toHaveBeenCalled();
    expect(res.status).not.toBe(201);
  });

  //   //   // ==== TEST 5 ====
  //   //   //
  it("renvoie 201 - timerPause crée", async () => {
    const userMock = vi.mocked(getUserIdFromRequest);

    const returnSeance = {
      id: "aze123+",
      createdAt: NOW,
      totalRunner: 20,
      colorRunner: "rgb",
      startedAt: STARTED_AT,
      state: "InProgress",
      userId: "u1",
    };

    const newTimerPause = {
      id: "oiu789+",
      userId: "u1",
      pausedAt: PAUSE_AT_GOOD,
      endedAt: null,
      pauseDurationMs: null,
      seanceId: "aze123+",
    };

    userMock.mockResolvedValue("u1" as never);
    limitMockUserId.mockResolvedValue(ok as never);
    prismaMock.seance.findUnique.mockResolvedValue(returnSeance as never);
    prismaMock.timerPause.create.mockResolvedValue(newTimerPause as never);

    const res = await POST(makePost({ ...goodValue, pausedAt: PAUSE_AT_GOOD }));

    expect(prismaMock.seance.findUnique).toHaveBeenCalled();
    expect(prismaMock.timerPause.create).toHaveBeenCalled();
    expect(res.status).toBe(201);
  });
});
