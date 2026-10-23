// @vitest-environment node

import { describe, it, expect, vi, beforeEach } from "vitest";
import { prismaMock } from "@/test/prismaMock";
import { GET, POST, DELETE } from "@/app/api/seance/route";
import {
  seanceRateLimitUserId,
  seanceRateLimitIpMobile,
} from "@/lib/rateLimit";

vi.mock("@/lib/auth", () => ({ default: vi.fn() }));
import getUserIdFromRequest from "@/lib/auth";

vi.mock("@/lib/rateLimit", () => ({
  seanceRateLimitUserId: { limit: vi.fn() },
  seanceRateLimitIpMobile: { limit: vi.fn() },
}));

const userMock = vi.mocked(getUserIdFromRequest);

//======= GET ===========
//=======================

describe("GET /api/seance", () => {
  const makeGet = () => new Request("http://localhost/api/seance");

  // ==== TEST 1 ====
  //
  it("renvoie 401 Non autorisé", async () => {
    userMock.mockResolvedValue(null as never);

    const res = await GET(makeGet());

    expect(res.status).toBe(401);
    expect(prismaMock.seance.findMany).not.toHaveBeenCalled();
  });

  // ==== TEST 2 ====
  //
  it("filtre par userId (ownership)", async () => {
    userMock.mockResolvedValue("idtest123+" as never);
    prismaMock.seance.findMany.mockResolvedValue([
      { id: "o1", name: "Test", userId: "idtest123+" },
    ] as never);

    const res = await GET(makeGet());

    expect(res.status).toBe(200);
    expect(prismaMock.seance.findMany).toHaveBeenCalledWith({
      where: { userId: "idtest123+" },
      orderBy: { createdAt: "desc" },
    });
  });
});

//======= POST ===========
//========================

describe("POST /api/seance", () => {
  const makePost = (body: unknown) =>
    new Request("http://localhost/api/seance", {
      method: "POST",
      headers: { "x-forwarded-for": "1.2.3.4" },
      body: JSON.stringify(body),
    });

  const limitMockUserId = vi.mocked(seanceRateLimitUserId.limit);
  const limitMockIp = vi.mocked(seanceRateLimitIpMobile.limit);

  const ok = { success: true, limit: 60, remaining: 59, reset: 0 };
  const blocked = { success: false, limit: 60, remaining: 0, reset: 0 };

  beforeEach(() => {
    userMock.mockResolvedValue("u1" as never);
    limitMockIp.mockResolvedValue(ok as never);
    limitMockUserId.mockResolvedValue(ok as never);
  });

  // ==== TEST 3 ====
  //
  it("renvoie 400 si le body est invalide", async () => {
    const userMock = vi.mocked(getUserIdFromRequest);
    userMock.mockResolvedValue("u1" as never);

    const res = await POST(makePost({ totalRunner: 900, colorRunner: "" }));

    expect(res.status).toBe(400);
    expect(prismaMock.seance.create).not.toHaveBeenCalled();
  });

  // ==== TEST 4 ====
  //
  it("renvoie 401 -Non autorisé", async () => {
    const userMock = vi.mocked(getUserIdFromRequest);
    userMock.mockResolvedValue(null as never);

    const res = await POST(
      makePost({ totalRunner: 15, colorRunner: "rgb(39, 91, 245)" }),
    );

    expect(res.status).toBe(401);
    expect(prismaMock.seance.create).not.toHaveBeenCalled();
  });

  // ==== TEST 5 ====
  //
  it("renvoie 429 - ratelimit déclenché par IP", async () => {
    const userMock = vi.mocked(getUserIdFromRequest);
    userMock.mockResolvedValue("idtest123+" as never);
    limitMockIp.mockResolvedValue(blocked as never);

    const res = await POST(
      makePost({ totalRunner: 15, colorRunner: "rgb(39, 91, 245)" }),
    );

    expect(res.status).toBe(429);
    expect(prismaMock.seance.create).not.toHaveBeenCalled();
  });

  // ==== TEST 6 ====
  //
  it("renvoie 503 - si limiteur", async () => {
    const userMock = vi.mocked(getUserIdFromRequest);
    userMock.mockResolvedValue("idtest123+" as never);
    limitMockUserId.mockResolvedValue(blocked as never);

    const res = await POST(
      makePost({ totalRunner: 15, colorRunner: "rgb(39, 91, 245)" }),
    );

    expect(res.status).toBe(429);
    expect(prismaMock.seance.create).not.toHaveBeenCalled();
  });

  // ==== TEST 7 ====
  //
  it("renvoie 429 - ratelimit déclenché par USERID", async () => {
    const userMock = vi.mocked(getUserIdFromRequest);
    userMock.mockResolvedValue("idtest123+" as never);
    limitMockUserId.mockRejectedValue(new Error("Upstash down") as never);

    const res = await POST(
      makePost({ totalRunner: 15, colorRunner: "rgb(39, 91, 245)" }),
    );

    expect(res.status).toBe(503);
    expect(prismaMock.seance.create).not.toHaveBeenCalled();
  });
  // ==== TEST 8 ====
  //
  it("laisse passer - limiteur non déclenché", async () => {
    const userMock = vi.mocked(getUserIdFromRequest);
    const userId = "idtest123+";
    const created = {
      id: "s1",
      totalRunner: 15,
      colorRunner: "rgb(39, 91, 245)",
      userId,
    };

    userMock.mockResolvedValue(userId as never);
    limitMockUserId.mockResolvedValue(ok as never);
    limitMockIp.mockResolvedValue(ok as never);
    prismaMock.seance.create.mockResolvedValue(created as never);

    const res = await POST(
      makePost({ totalRunner: 15, colorRunner: "rgb(39, 91, 245)" }),
    );

    expect(res.status).toBe(201);
    expect(prismaMock.seance.create).toHaveBeenCalledWith({
      data: { totalRunner: 15, colorRunner: "rgb(39, 91, 245)", userId },
    });
  });

  //======= DELETE =============
  //============================

  describe("DELETE /api/seance", () => {
    const userId = "idtest123+";
    const makeDelete = (body: unknown) =>
      new Request("http://localhost/api/seance", {
        method: "DELETE",
        headers: { "x-forwarded-for": "1.2.3.4" },
        body: JSON.stringify(body),
      });
    // ==== TEST 1 ====
    //
    it("renvoie 401 Non autorisé", async () => {
      userMock.mockResolvedValue(null as never);

      const res = await DELETE(makeDelete({}));

      expect(res.status).toBe(401);
      expect(prismaMock.seance.findMany).not.toHaveBeenCalled();
    });

    // ==== TEST 2 ====
    //

    it("renvoie 404 - Aucune séance", async () => {
      userMock.mockResolvedValue(userId as never);
      prismaMock.seance.deleteMany.mockResolvedValue({ count: 0 });
      const res = await DELETE(makeDelete({}));

      expect(res.status).toBe(404);
    });

    // ==== TEST 3 ====
    //
    it("renvoie 204 - Séance supprimé", async () => {
      userMock.mockResolvedValue(userId as never);
      prismaMock.seance.deleteMany.mockResolvedValue({ count: 4 });
      const res = await DELETE(makeDelete({}));

      expect(res.status).toBe(204);
    });
  });
});
