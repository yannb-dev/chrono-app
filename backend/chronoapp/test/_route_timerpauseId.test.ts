// @vitest-environment node

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { prismaMock } from "@/test/prismaMock";
import { GET, DELETE, PATCH } from "@/app/api/timerpause/[id]/route";

vi.mock("@/lib/auth", () => ({ default: vi.fn() }));
import getUserIdFromRequest from "@/lib/auth";
import { Prisma } from "@prisma/client";

const userMock = vi.mocked(getUserIdFromRequest);

const returnTimerPause = [
  {
    id: "aze123+",
    userId: "idtest123+",
    pausedAt: new Date(),
    endedAt: null,
    pauseDurationMs: null,
    seanceId: "aze123+",
  },
];

//======= GET ===========
//=======================

describe("GET /api/timerpause/[id]", () => {
  const makeGet = () => new Request("http://localhost/api/timerpause/aze123+");
  const makeParams = (id: string) => ({ params: Promise.resolve({ id }) });

  // ==== TEST 1 ====
  //
  it("renvoie 401 Non autorisé", async () => {
    userMock.mockResolvedValue(null as never);

    const res = await GET(makeGet(), makeParams("123Aze"));

    expect(res.status).toBe(401);
    expect(prismaMock.timerPause.findUnique).not.toHaveBeenCalled();
  });

  //   // ==== TEST 2 ====
  //   //
  it("renvoi timerPause par userId et id (ownership)", async () => {
    userMock.mockResolvedValue("idtest123+" as never);
    prismaMock.timerPause.findMany.mockResolvedValue(returnTimerPause as never);

    const res = await GET(makeGet(), makeParams("aze123+"));

    expect(res.status).toBe(200);
    expect(prismaMock.timerPause.findMany).toHaveBeenCalledWith({
      where: { seanceId: "aze123+", userId: "idtest123+" },
    });
  });
});

// //======= PATCH ===========
// //========================

describe("PATCH /api/timerpause[id]", () => {
  const makeParams = (id: string) => ({ params: Promise.resolve({ id }) });
  const makePatch = (body: unknown) =>
    new Request("http://localhost/api/timerpause/aze123+", {
      method: "PATCH",
      headers: { "x-forwarded-for": "1.2.3.4" },
      body: JSON.stringify(body),
    });

  const makePatchWithoutIp = (body: unknown) =>
    new Request("http://localhost/api/timerpause/aze123+", {
      method: "PATCH",
      body: JSON.stringify(body),
    });

  const NOW = new Date("2026-01-01T10:00:00Z");
  const PAUSED_AT = new Date("2026-01-01T10:00:30Z");
  const ENDED_AT_GOOD = new Date("2026-01-01T10:00:40Z");
  const ENDED_AT_BAD = new Date("2026-01-01T09:59:20Z");

  const goodValue = {
    endedAt: ENDED_AT_GOOD,
  };
  const badValue = { startedAt: "20/01/2020", state: "" };

  beforeEach(() => {
    userMock.mockResolvedValue("u1" as never);
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

    const res = await PATCH(makePatch(goodValue), makeParams("aze123+"));

    expect(res.status).toBe(401);
    expect(prismaMock.timerPause.findUnique).not.toHaveBeenCalled();
  });

  // //   // ==== TEST 5 ====
  // //   //   //
  it("renvoie 400 - erreur validation ZOD", async () => {
    const userMock = vi.mocked(getUserIdFromRequest);
    userMock.mockResolvedValue("u1" as never);

    const res = await PATCH(makePatch(badValue), makeParams("aze123+"));

    expect(res.status).toBe(400);
    expect(prismaMock.timerPause.findUnique).not.toHaveBeenCalled();
  });

  // //   //   // ==== TEST 5 ====
  // //   //   //
  it("renvoie 404 - Aucune séance trouvé", async () => {
    const userMock = vi.mocked(getUserIdFromRequest);

    const returnTimerPause = null;

    userMock.mockResolvedValue("u1" as never);
    prismaMock.seance.findUnique.mockResolvedValue(returnTimerPause as never);

    const res = await PATCH(makePatch(goodValue), makeParams("aze123+"));

    expect(res.status).toBe(404);
    expect(prismaMock.timerPause.findUnique).toHaveBeenCalled();
  });

  // //   //   // ==== TEST 5 ====
  // //   //   //
  it("renvoie 400 - valeur incohérente et négative", async () => {
    const userMock = vi.mocked(getUserIdFromRequest);

    const returnTimerPause = {
      pausedAt: PAUSED_AT,
    };

    const updateTimerPause = {
      pausedAt: ENDED_AT_BAD,
    };

    userMock.mockResolvedValue("u1" as never);

    prismaMock.timerPause.findUnique.mockResolvedValue(
      returnTimerPause as never,
    );

    const res = await PATCH(
      makePatch({ ...goodValue, endedAt: ENDED_AT_BAD }),
      makeParams("aze123+"),
    );

    expect(prismaMock.timerPause.findUnique).toHaveBeenCalled();
    expect(res.status).toBe(400);
    expect(prismaMock.timerPause.update).not.toHaveBeenCalled();
    expect(res.status).not.toBe(201);
  });

  // //   //   // ==== TEST 5 ====
  // //   //   //
  it("renvoie 201 - timerPause modifié", async () => {
    const userMock = vi.mocked(getUserIdFromRequest);

    const returnTimerPause = {
      pausedAt: PAUSED_AT,
    };

    const updateTimerPause = {
      pausedAt: ENDED_AT_GOOD,
    };

    const returnUpdateTimerPause = {
      id: "qsd",
      userId: "aze",
      endedAt: ENDED_AT_GOOD,
      seanceId: "aze",
      pausedAt: PAUSED_AT,
      pauseDurationMs: 10000,
    };

    userMock.mockResolvedValue("u1" as never);

    prismaMock.timerPause.findUnique.mockResolvedValue(
      returnTimerPause as never,
    );
    prismaMock.timerPause.update.mockResolvedValue(
      returnUpdateTimerPause as never,
    );

    const res = await PATCH(
      makePatch({ ...goodValue, pausedAt: ENDED_AT_GOOD }),
      makeParams("aze123+"),
    );

    expect(prismaMock.timerPause.findUnique).toHaveBeenCalled();
    expect(prismaMock.timerPause.update).toHaveBeenCalled();
    expect(res.status).toBe(200);
  });
});

// //   //   //======= DELETE =============
// //   //   //============================
describe("DELETE /api/timerpause/aze123+", () => {
  const userId = "idtest123+";
  const makeDelete = (body: unknown) =>
    new Request("http://localhost/api/timerrunner/aze123+", {
      method: "DELETE",
      headers: { "x-forwarded-for": "1.2.3.4" },
      body: JSON.stringify(body),
    });
  const makeParams = (id: string) => ({ params: Promise.resolve({ id }) });

  //     // ==== TEST 1 ====
  //     //
  it("renvoie 401 Non autorisé", async () => {
    userMock.mockResolvedValue(null as never);

    const res = await DELETE(makeDelete({}), makeParams("aze123+"));

    expect(res.status).toBe(401);
    expect(prismaMock.timerPause.deleteMany).not.toHaveBeenCalled();
  });

  //     //     // ==== TEST 3 ====
  //     //     //
  it("renvoie 500 via P2002 - Conflit", async () => {
    userMock.mockResolvedValue(userId as never);
    prismaMock.timerPause.deleteMany.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Conflit", {
        code: "P2002",
        clientVersion: "test",
      }),
    );
    const res = await DELETE(makeDelete({}), makeParams("aze123+"));

    expect(res.status).toBe(500);
  });

  //     //     // ==== TEST 3 ====
  //     //     //
  it("renvoie 204  - Aucun timerPause", async () => {
    userMock.mockResolvedValue(userId as never);
    prismaMock.timerPause.deleteMany.mockResolvedValue({ count: 0 } as never);

    const res = await DELETE(makeDelete({}), makeParams("aze123+"));

    expect(res.status).toBe(204);
  });

  //     //     // ==== TEST 4 ====
  //     //     //
  it("renvoie 204 - TimerPause supprimé", async () => {
    userMock.mockResolvedValue(userId as never);
    prismaMock.timerPause.deleteMany.mockResolvedValue({
      count: 3,
    } as never);
    const res = await DELETE(makeDelete({}), makeParams("aze123+"));

    expect(res.status).toBe(204);
  });
});
