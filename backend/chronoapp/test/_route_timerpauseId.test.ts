// @vitest-environment node

import { describe, it, expect, vi, beforeEach } from "vitest";
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
    it("renvoie 404 - Aucun timerPause", async () => {
      userMock.mockResolvedValue(userId as never);
      prismaMock.timerPause.deleteMany.mockResolvedValue({ count: 0 } as never);

      const res = await DELETE(makeDelete({}), makeParams("aze123+"));

      expect(res.status).toBe(404);
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
});
