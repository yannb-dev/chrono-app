// @vitest-environment node

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { prismaMock } from "@/test/prismaMock";
import { GET, PATCH, DELETE } from "@/app/api/seance/[id]/route";

vi.mock("@/lib/auth", () => ({ default: vi.fn() }));
import getUserIdFromRequest from "@/lib/auth";
import { Prisma } from "@prisma/client";

const userMock = vi.mocked(getUserIdFromRequest);

const returnSeance = {
  id: "123Aze",
  createdAt: new Date(),
  totalRunner: 20,
  colorRunner: "rgb(39, 91, 245)",
  startedAt: null,
  state: "NoStart",
  userId: "idtest123+",
  timerRunners: [],
  timerpauses: [],
};

//======= GET ===========
//=======================

describe("GET /api/seance/[id]", () => {
  const makeGet = () => new Request("http://localhost/api/seance/123Aze");
  const makeParams = (id: string) => ({ params: Promise.resolve({ id }) });

  // ==== TEST 1 ====
  //
  it("renvoie 401 Non autorisé", async () => {
    userMock.mockResolvedValue(null as never);

    const res = await GET(makeGet(), makeParams("123Aze"));

    expect(res.status).toBe(401);
    expect(prismaMock.seance.findMany).not.toHaveBeenCalled();
  });

  // ==== TEST 2 ====
  //
  it("renvoi seance par userId et id (ownership)", async () => {
    userMock.mockResolvedValue("idtest123+" as never);
    prismaMock.seance.findUnique.mockResolvedValue(returnSeance as never);

    const res = await GET(makeGet(), makeParams("123Aze"));

    expect(res.status).toBe(200);
    expect(prismaMock.seance.findUnique).toHaveBeenCalledWith({
      where: { id: "123Aze", userId: "idtest123+" },
      include: { timerRunners: true, timerpauses: true },
    });
  });

  // ==== TEST 3 ====
  //
  it("renvoi 404 si aucune séance", async () => {
    userMock.mockResolvedValue("idtest123+" as never);
    prismaMock.seance.findUnique.mockResolvedValue(null as never);

    const res = await GET(makeGet(), makeParams("123Aze"));

    expect(res.status).toBe(404);
    expect(prismaMock.seance.findUnique).toHaveBeenCalledWith({
      where: { id: "123Aze", userId: "idtest123+" },
      include: { timerRunners: true, timerpauses: true },
    });
  });
});

// //======= PATCH ===========
// //========================

describe("PATCH /api/seance/[id]", () => {
  const makePatch = (body: unknown) =>
    new Request("http://localhost/api/seance/123Aze", {
      method: "PATCH",
      headers: { "x-forwarded-for": "1.2.3.4" },
      body: JSON.stringify(body),
    });
  const makeParams = (id: string) => ({ params: Promise.resolve({ id }) });

  const goodValue = {
    startedAt: new Date("2026-01-01T10:00:20Z"),
    state: "InProgress",
  };
  const badValue = { startedAt: "20/01/2020", state: "" };

  beforeEach(() => {
    userMock.mockResolvedValue("u1" as never);
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

    const res = await PATCH(makePatch(goodValue), makeParams("123Aze"));

    expect(res.status).toBe(401);
    expect(prismaMock.seance.findUnique).not.toHaveBeenCalled();
  });

  //   // ==== TEST 2 ====
  //   //
  it("renvoie 400 si le body est invalide", async () => {
    const userMock = vi.mocked(getUserIdFromRequest);
    userMock.mockResolvedValue("u1" as never);

    const res = await PATCH(makePatch(badValue), makeParams("123Aze"));

    expect(res.status).toBe(400);
    expect(prismaMock.seance.findUnique).not.toHaveBeenCalled();
  });

  //   // ==== TEST 4 ====
  //   //
  it("renvoi 409, la séance a déjà une valeur startedAt", async () => {
    const userMock = vi.mocked(getUserIdFromRequest);
    const userId = "idtest123+";
    const seance = {
      id: "s1",
      totalRunner: 15,
      colorRunner: "rgb(39, 91, 245)",
      userId,
      startedAt: new Date("2026-01-01T10:10:20Z"),
      state: "InProgress",
      createdAt: new Date("2026-01-01T10:10:20Z"),
    };

    userMock.mockResolvedValue(userId as never);
    prismaMock.seance.findUnique.mockResolvedValue(seance as never);

    const res = await PATCH(makePatch(goodValue), makeParams("123Aze"));
    const body = await res.json();

    expect(res.status).toBe(409);
    expect(body.message).toBe("La séance est déjà lancé");
    expect(prismaMock.seance.findUnique).toHaveBeenCalledWith({
      where: { id: "123Aze", userId },
    });
  });

  //   // ==== TEST 3 ====
  //   //
  it("renvoi 409, la séance est déjà FINISH", async () => {
    const userMock = vi.mocked(getUserIdFromRequest);
    const userId = "idtest123+";
    const seance = {
      id: "123Aze",
      totalRunner: 15,
      colorRunner: "rgb(39, 91, 245)",
      userId,
      startedAt: new Date("2026-01-01T10:10:20Z"),
      state: "Finish",
      createdAt: new Date("2026-01-01T10:10:20Z"),
    };

    userMock.mockResolvedValue(userId as never);
    prismaMock.seance.findUnique.mockResolvedValue(seance as never);

    const res = await PATCH(makePatch(goodValue), makeParams("123Aze"));
    const body = await res.json();

    expect(res.status).toBe(409);
    expect(body.message).toBe(
      "La séance est terminé, elle ne peut être modifiée",
    );
    expect(prismaMock.seance.findUnique).toHaveBeenCalledWith({
      where: { id: "123Aze", userId },
    });
  });

  //   // ==== TEST 5 ====
  //   //
  it("valide, renvoi un 200", async () => {
    const userMock = vi.mocked(getUserIdFromRequest);
    const userId = "idtest123+";
    const created = {
      id: "s1",
      totalRunner: 15,
      colorRunner: "rgb(39, 91, 245)",
      userId,
      startedAt: new Date("2026-01-01T10:10:20Z"),
      state: "Finish",
      createdAt: new Date("2026-01-01T10:10:20Z"),
    };

    userMock.mockResolvedValue(userId as never);

    prismaMock.seance.update.mockResolvedValue(created as never);

    const res = await PATCH(makePatch(goodValue), makeParams("123Aze"));

    expect(res.status).toBe(200);
    expect(prismaMock.seance.update).toHaveBeenCalledWith({
      where: { id: "123Aze", userId },
      data: goodValue,
    });
  });

  //   //======= DELETE =============
  //   //============================

  describe("DELETE /api/seance/[id]", () => {
    const userId = "idtest123+";
    const makeDelete = (body: unknown) =>
      new Request("http://localhost/api/seance/123Aze", {
        method: "DELETE",
        headers: { "x-forwarded-for": "1.2.3.4" },
        body: JSON.stringify(body),
      });
    //     // ==== TEST 1 ====
    //     //
    it("renvoie 401 Non autorisé", async () => {
      userMock.mockResolvedValue(null as never);

      const res = await DELETE(makeDelete({}), makeParams("123Aze"));

      expect(res.status).toBe(401);
      expect(prismaMock.seance.findMany).not.toHaveBeenCalled();
    });

    //     // ==== TEST 2 ====
    //     //

    it("renvoie 404 via P2025 - Aucune séance", async () => {
      userMock.mockResolvedValue(userId as never);
      prismaMock.seance.delete.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError("Séance introuvable", {
          code: "P2025",
          clientVersion: "test",
        }),
      );
      const res = await DELETE(makeDelete({}), makeParams("123Aze"));

      expect(res.status).toBe(404);
    });

    //     // ==== TEST 3 ====
    //     //
    it("renvoie 404 via P2025 - Aucune séance", async () => {
      userMock.mockResolvedValue(userId as never);
      prismaMock.seance.delete.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError("Confilt", {
          code: "P2002",
          clientVersion: "test",
        }),
      );
      const res = await DELETE(makeDelete({}), makeParams("123Aze"));

      expect(res.status).toBe(500);
    });

    //     // ==== TEST 4 ====
    //     //
    it("renvoie 204 - Séance supprimé", async () => {
      userMock.mockResolvedValue(userId as never);
      prismaMock.seance.delete.mockResolvedValue(returnSeance as never);
      const res = await DELETE(makeDelete({}), makeParams("123Aze"));

      expect(res.status).toBe(204);
    });
  });
});
