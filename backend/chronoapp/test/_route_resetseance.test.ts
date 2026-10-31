// @vitest-environment node

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { prismaMock } from "@/test/prismaMock";
import { DELETE } from "@/app/api/resetseance/[id]/route";

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

// //======= PATCH ===========
// //========================

describe("DELETE /api/resetseance/[id]", () => {
  const makePatch = (body: unknown) =>
    new Request("http://localhost/api/resetseance/123Aze", {
      method: "DELETE",
      headers: { "x-forwarded-for": "1.2.3.4" },
    });
  const makeParams = (id: string) => ({ params: Promise.resolve({ id }) });

  beforeEach(() => {
    userMock.mockResolvedValue("u1" as never);
    prismaMock.$transaction.mockImplementation(async (cb: any) =>
      cb(prismaMock),
    );
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

    const res = await DELETE(makePatch({}), makeParams("123Aze"));

    expect(res.status).toBe(401);
    expect(prismaMock.seance.findUnique).not.toHaveBeenCalled();
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

    const res = await DELETE(makePatch({}), makeParams("123Aze"));
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

    const seance = {
      id: "123Aze",
      totalRunner: 15,
      colorRunner: "rgb(39, 91, 245)",
      userId,
      startedAt: new Date("2026-01-01T10:10:20Z"),
      state: "InProgress",
      createdAt: new Date("2026-01-01T10:10:20Z"),
    };

    const created = {
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
    prismaMock.seance.update.mockResolvedValue(created as never);

    const res = await DELETE(makePatch({}), makeParams("123Aze"));

    expect(res.status).toBe(200);
    expect(prismaMock.$transaction).toHaveBeenCalled();
    expect(prismaMock.seance.findUnique).toHaveBeenCalledWith({
      where: { id: "123Aze", userId },
    });
    expect(prismaMock.timerRunner.deleteMany).toHaveBeenCalledWith({
      where: { seanceId: "123Aze", userId },
    });
    expect(prismaMock.timerPause.deleteMany).toHaveBeenCalledWith({
      where: { seanceId: "123Aze", userId },
    });
    expect(prismaMock.seance.update).toHaveBeenCalledWith({
      where: { id: "123Aze", userId },
      data: { startedAt: null, state: "NoStart" },
    });
  });
});
