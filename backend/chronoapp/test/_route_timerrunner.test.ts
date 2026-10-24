// @vitest-environment node

import { describe, it, expect, vi, beforeEach } from "vitest";
import { prismaMock } from "@/test/prismaMock";
import { POST } from "@/app/api/timerrunner/route";
import {
  timerrunnerRateLimitUserId,
  timerrunnerRateLimitIpMobile,
} from "@/lib/rateLimit";

vi.mock("@/lib/auth", () => ({ default: vi.fn() }));
import getUserIdFromRequest from "@/lib/auth";
import { afterEach } from "node:test";

vi.mock("@/lib/rateLimit", () => ({
  timerrunnerRateLimitUserId: { limit: vi.fn() },
  timerrunnerRateLimitIpMobile: { limit: vi.fn() },
}));

const userMock = vi.mocked(getUserIdFromRequest);

//======= POST ===========
//========================

describe("POST /api/timerrunner", () => {
  const makePost = (body: unknown) =>
    new Request("http://localhost/api/timerrunner", {
      method: "POST",
      headers: { "x-forwarded-for": "1.2.3.4" },
      body: JSON.stringify(body),
    });

  const limitMockUserId = vi.mocked(timerrunnerRateLimitUserId.limit);
  const limitMockIp = vi.mocked(timerrunnerRateLimitIpMobile.limit);

  const ok = { success: true, limit: 60, remaining: 59, reset: 0 };
  const blocked = { success: false, limit: 60, remaining: 0, reset: 0 };

  const valuePost = {
    numberRunner: 10,
    endedAt: new Date(),
    seanceId: "test123+",
  };

  const valuePostInvalid = {
    numberRunner: "10",
    endedAt: new Date("2026-01-01T10:00:00Z"),
    seanceId: "test123+",
  };

  beforeEach(() => {
    userMock.mockResolvedValue("u1" as never);
    prismaMock.$transaction.mockImplementation(async (cb: any) =>
      cb(prismaMock),
    );
    limitMockIp.mockResolvedValue(ok as never);
    limitMockUserId.mockResolvedValue(ok as never);
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T10:00:20Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  //   // ==== TEST 1 ====
  //   //
  it("renvoie 401 -Non autorisé", async () => {
    const userMock = vi.mocked(getUserIdFromRequest);
    userMock.mockResolvedValue(null as never);

    const res = await POST(makePost(valuePost));

    expect(res.status).toBe(401);
    expect(prismaMock.timerRunner.create).not.toHaveBeenCalled();
  });

  //   // ==== TEST 2 ====
  //   //
  it("renvoie 429 - ratelimit déclenché par IP", async () => {
    const userMock = vi.mocked(getUserIdFromRequest);
    userMock.mockResolvedValue("idtest123+" as never);
    limitMockIp.mockResolvedValue(blocked as never);

    const res = await POST(makePost(valuePost));

    expect(res.status).toBe(429);
    expect(prismaMock.timerRunner.create).not.toHaveBeenCalled();
  });

  //   // ==== TEST 3 ====
  //   //
  it("renvoie 429 - ratelimit déclenché par USERID", async () => {
    const userMock = vi.mocked(getUserIdFromRequest);
    userMock.mockResolvedValue("idtest123+" as never);
    limitMockUserId.mockResolvedValue(blocked as never);

    const res = await POST(makePost(valuePost));

    expect(res.status).toBe(429);
    expect(prismaMock.timerRunner.create).not.toHaveBeenCalled();
  });

  //   // ==== TEST 4 ====
  //   //
  it("renvoie 503 - si limiteur indisponible", async () => {
    const userMock = vi.mocked(getUserIdFromRequest);
    userMock.mockResolvedValue("idtest123+" as never);
    limitMockUserId.mockRejectedValue(new Error("Upstash down") as never);

    const res = await POST(makePost(valuePost));

    expect(res.status).toBe(503);
    expect(prismaMock.timerRunner.create).not.toHaveBeenCalled();
  });

  // ==== TEST 5 ====
  //
  it("renvoie 400 si le body est invalide", async () => {
    const userMock = vi.mocked(getUserIdFromRequest);
    userMock.mockResolvedValue("u1" as never);

    const res = await POST(makePost(valuePostInvalid));

    expect(res.status).toBe(400);
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  // ==== TEST 6 ====
  //
  it("400 si endedAt est vieux de plus d'une heure", async () => {
    const body = {
      numberRunner: 10,
      endedAt: new Date("2026-01-01T08:00:00Z"),
      seanceId: "s1",
    };
    const res = await POST(makePost(body));
    expect(res.status).toBe(400);
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  //   // ==== TEST 7 ====
  //   //
  it("201 - enregistre un coureur", async () => {
    const userId = "idtest123+";
    const startedAt = new Date("2026-01-01T10:00:00Z");
    const endedAt = new Date("2026-01-01T10:00:18Z"); // +18 000 ms
    const body = { numberRunner: 10, endedAt, seanceId: "test123+" };

    const created = { id: "t1", ...body, duration: 12000, userId };

    userMock.mockResolvedValue(userId as never);
    prismaMock.seance.findUnique.mockResolvedValue({
      startedAt,
      timerpauses: [],
      state: "InProgress",
    } as never);
    prismaMock.timerPause.aggregate.mockResolvedValue({
      _sum: { pauseDurationMs: 6000 }, // 18 000 - 6 000 = 12 000
    } as never);
    prismaMock.timerRunner.create.mockResolvedValue(created as never);

    const res = await POST(makePost(body));

    expect(res.status).toBe(201);
    expect(await res.json()).toEqual(JSON.parse(JSON.stringify(created)));
    expect(prismaMock.seance.findUnique).toHaveBeenCalledWith({
      where: { id: "test123+", userId },
      select: { startedAt: true, timerpauses: true, state: true },
    });
    expect(prismaMock.timerRunner.create).toHaveBeenCalledWith({
      data: {
        numberRunner: 10,
        endedAt,
        seanceId: "test123+",
        duration: 12000,
        userId,
      },
    });
  });
});
