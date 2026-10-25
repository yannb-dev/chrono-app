// @vitest-environment node

import { describe, it, expect, vi, beforeEach } from "vitest";
import { prismaMock } from "@/test/prismaMock";
import { GET, DELETE } from "@/app/api/timerrunner/[id]/route";

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

//======= GET ===========
//=======================

describe("GET /api/timerrunner/[id]", () => {
  const makeGet = () => new Request("http://localhost/api/timerrunner/123Aze");
  const makeParams = (id: string) => ({ params: Promise.resolve({ id }) });

  // ==== TEST 1 ====
  //
  it("renvoie 401 Non autorisé", async () => {
    userMock.mockResolvedValue(null as never);

    const res = await GET(makeGet(), makeParams("123Aze"));

    expect(res.status).toBe(401);
    expect(prismaMock.timerRunner.findUnique).not.toHaveBeenCalled();
  });

  // ==== TEST 2 ====
  //
  it("renvoi seance par userId et id (ownership)", async () => {
    userMock.mockResolvedValue("idtest123+" as never);
    prismaMock.timerRunner.findUnique.mockResolvedValue(
      returnTimerRunner as never,
    );

    const res = await GET(makeGet(), makeParams("123Aze"));

    expect(res.status).toBe(200);
    expect(prismaMock.timerRunner.findUnique).toHaveBeenCalledWith({
      where: { id: "123Aze", userId: "idtest123+" },
    });
  });

  //   // ==== TEST 3 ====
  //   //
  it("renvoi 404 si aucune séance", async () => {
    userMock.mockResolvedValue("idtest123+" as never);
    prismaMock.timerRunner.findUnique.mockResolvedValue(null as never);

    const res = await GET(makeGet(), makeParams("123Aze"));

    expect(res.status).toBe(404);
    expect(prismaMock.timerRunner.findUnique).toHaveBeenCalledWith({
      where: { id: "123Aze", userId: "idtest123+" },
    });
  });
});

//   //   //======= DELETE =============
//   //   //============================

describe("DELETE /api/timerrunner/123Aze", () => {
  const userId = "idtest123+";
  const makeDelete = (body: unknown) =>
    new Request("http://localhost/api/timerrunner/123Aze", {
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

  it("renvoie 404 via P20 - Aucun timerRunner", async () => {
    userMock.mockResolvedValue(userId as never);
    prismaMock.timerRunner.delete.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Séance introuvable", {
        code: "P2025",
        clientVersion: "test",
      }),
    );
    const res = await DELETE(makeDelete({}), makeParams("123Aze"));

    expect(res.status).toBe(404);
  });

  //     //     // ==== TEST 3 ====
  //     //     //
  it("renvoie 404 via P2025 - Aucun timerRunner", async () => {
    userMock.mockResolvedValue(userId as never);
    prismaMock.timerRunner.delete.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Confilt", {
        code: "P2002",
        clientVersion: "test",
      }),
    );
    const res = await DELETE(makeDelete({}), makeParams("123Aze"));

    expect(res.status).toBe(500);
  });

  //     //     // ==== TEST 4 ====
  //     //     //
  it("renvoie 204 - TimerRunner supprimé", async () => {
    userMock.mockResolvedValue(userId as never);
    prismaMock.timerRunner.delete.mockResolvedValue(returnTimerRunner as never);
    const res = await DELETE(makeDelete({}), makeParams("123Aze"));

    expect(res.status).toBe(204);
  });
});
