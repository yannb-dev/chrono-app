// @vitest-environment node

import { describe, it, expect, vi, beforeEach } from "vitest";
import { prismaMock } from "@/test/prismaMock";
import { DELETE } from "@/app/api/timerrunner/byseance/[id]/route";

vi.mock("@/lib/auth", () => ({ default: vi.fn() }));
import getUserIdFromRequest from "@/lib/auth";
import { Prisma } from "@prisma/client";

const userMock = vi.mocked(getUserIdFromRequest);

const returnTimerRunner = {
  id: "123Aze",
  userId: "idtest123+",
  numberRunner: 2,
  endedAt: new Date(),
  duration: 12000,
  seanceId: "aze123+",
};

//   //   //======= DELETE =============
//   //   //============================

describe("DELETE /api/timerrunner/byseance/123Aze", () => {
  const userId = "idtest123+";
  const makeDelete = (body: unknown) =>
    new Request("http://localhost/api/timerrunner/byseance/123Aze", {
      method: "DELETE",
      headers: { "x-forwarded-for": "1.2.3.4" },
      body: JSON.stringify(body),
    });
  const makeParams = (id: string) => ({ params: Promise.resolve({ id }) });

  //     // ==== TEST 1 ====
  //     //
  it("renvoie 401 Non autorisé", async () => {
    userMock.mockResolvedValue(null as never);

    const res = await DELETE(makeDelete({}), makeParams("123Aze"));

    expect(res.status).toBe(401);
    expect(prismaMock.timerRunner.deleteMany).not.toHaveBeenCalled();
  });

  //     //     // ==== TEST 2 ====
  //     //     //

  it("renvoie 204 - Aucun timerRunner", async () => {
    userMock.mockResolvedValue(userId as never);
    prismaMock.timerRunner.deleteMany.mockResolvedValue({ count: 0 });
    const res = await DELETE(makeDelete({}), makeParams("123Aze"));

    expect(res.status).toBe(204);
  });

  //     //     // ==== TEST 3 ====
  //     //     //
  it("renvoie 500 err Prisma - Aucun timerRunner", async () => {
    userMock.mockResolvedValue(userId as never);
    prismaMock.timerRunner.deleteMany.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Conflit", {
        code: "P2002",
        clientVersion: "test",
      }),
    );
    const res = await DELETE(makeDelete({}), makeParams("123Aze"));

    expect(res.status).toBe(500);
  });

  //   //     //     // ==== TEST 4 ====
  //   //     //     //
  it("renvoie 204 - TimerRunner supprimés", async () => {
    userMock.mockResolvedValue(userId as never);
    prismaMock.timerRunner.deleteMany.mockResolvedValue([
      returnTimerRunner,
    ] as never);
    const res = await DELETE(makeDelete({}), makeParams("123Aze"));

    expect(res.status).toBe(204);
  });
});
