// @vitest-environment node

import { describe, it, expect, vi, beforeEach } from "vitest";
import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { prismaMock } from "@/test/prismaMock";
import { DELETE } from "@/app/api/user/route";
import getUserIdFromRequest from "@/lib/auth";
import {
  userRateLimitIpMobil,
  userRateLimitIpWeb,
  userRateLimitEmailWeb,
} from "@/lib/rateLimit";

// ---------- MOCKS ----------
vi.mock("bcryptjs", () => ({
  default: {
    compare: vi.fn(),
    hash: vi.fn(),
  },
}));

vi.mock("@/lib/auth", () => ({
  default: vi.fn(),
}));

vi.mock("@/lib/rateLimit", () => ({
  userRateLimitIpMobil: { limit: vi.fn() },
  userRateLimitIpWeb: { limit: vi.fn() },
  userRateLimitEmailWeb: { limit: vi.fn() },
}));

// ---------- TESTS ----------
describe("DELETE /api/user/delete", () => {
  const makeDelete = (body: unknown) =>
    new Request("http://localhost/api/user", {
      method: "DELETE",
      headers: { "x-forwarded-for": "1.2.3.4" },
      body: JSON.stringify(body),
    });

  const makeDeleteNoIp = (body: unknown) =>
    new Request("http://localhost/api/user", {
      method: "DELETE",
      headers: {},
      body: JSON.stringify(body),
    });

  const validBody = { password: "Azerty123+" };

  const userIdMock = vi.mocked(getUserIdFromRequest);
  const limitIpMobil = vi.mocked(userRateLimitIpMobil.limit);
  const compareMock = vi.mocked(bcrypt.compare);

  const ok = { success: true, limit: 3, remaining: 1, reset: 0 };
  const blocked = { success: false, limit: 3, remaining: 0, reset: 0 };

  const dbUser = {
    id: "u1",
    email: "test@gmail.com",
    password: "hashed-pw",
    name: "test",
    image: null,
    tokenVersion: 1,
    createdAt: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    userIdMock.mockResolvedValue("u1" as never);
    limitIpMobil.mockResolvedValue(ok as never);
  });

  // ==== TEST 1 : non authentifié ====
  it("401 - utilisateur non authentifié", async () => {
    userIdMock.mockResolvedValue(null as never);

    const res = await DELETE(makeDelete(validBody));

    expect(res.status).toBe(401);
    expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
    expect(prismaMock.user.delete).not.toHaveBeenCalled();
  });

  // ==== TEST 2 : validation Zod ====
  it("400 - format du body non conforme", async () => {
    const res = await DELETE(makeDelete({ password: 123 }));

    expect(res.status).toBe(400);
    expect(limitIpMobil).not.toHaveBeenCalled();
    expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
  });

  // ==== TEST 3 : IP absente ====
  it("400 - IP non identifiable", async () => {
    const res = await DELETE(makeDeleteNoIp(validBody));

    expect(res.status).toBe(400);
    expect(limitIpMobil).not.toHaveBeenCalled();
    expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
  });

  // ==== TEST 4 : rate limit ====
  it("429 - rate limit déclenché par IP", async () => {
    limitIpMobil.mockResolvedValue(blocked as never);

    const res = await DELETE(makeDelete(validBody));

    expect(res.status).toBe(429);
    expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
    expect(prismaMock.user.delete).not.toHaveBeenCalled();
  });

  // ==== TEST 5 : utilisateur introuvable (comportement actuel) ====
  it("204 - utilisateur introuvable : rien n'est supprimé", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null as never);

    const res = await DELETE(makeDelete(validBody));

    expect(res.status).toBe(204);
    expect(compareMock).not.toHaveBeenCalled();
    expect(prismaMock.user.delete).not.toHaveBeenCalled();
  });

  // ==== TEST 6 : mauvais mot de passe ====
  it("403 - mot de passe incorrect : aucune suppression", async () => {
    prismaMock.user.findUnique.mockResolvedValue(dbUser as never);
    compareMock.mockResolvedValue(false as never);

    const res = await DELETE(makeDelete(validBody));

    expect(res.status).toBe(403);
    expect(compareMock).toHaveBeenCalledWith("Azerty123+", "hashed-pw");
    expect(prismaMock.user.delete).not.toHaveBeenCalled();
  });

  // ==== TEST 7 : succès ====
  it("204 - mot de passe correct : compte supprimé", async () => {
    prismaMock.user.findUnique.mockResolvedValue(dbUser as never);
    compareMock.mockResolvedValue(true as never);
    prismaMock.user.delete.mockResolvedValue(dbUser as never);

    const res = await DELETE(makeDelete(validBody));

    expect(res.status).toBe(204);
    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
      where: { id: "u1" },
    });
    expect(compareMock).toHaveBeenCalledWith("Azerty123+", "hashed-pw");
    expect(prismaMock.user.delete).toHaveBeenCalledWith({
      where: { id: "u1", email: "test@gmail.com" },
    });
  });

  // ==== TEST 8 : P2025 ====
  it("404 - P2025 pendant la suppression", async () => {
    prismaMock.user.findUnique.mockResolvedValue(dbUser as never);
    compareMock.mockResolvedValue(true as never);
    prismaMock.user.delete.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("not found", {
        code: "P2025",
        clientVersion: "test",
      }),
    );

    const res = await DELETE(makeDelete(validBody));

    expect(res.status).toBe(404);
  });

  // ==== TEST 9 : erreur inattendue ====
  it("500 - erreur inattendue pendant la suppression", async () => {
    prismaMock.user.findUnique.mockResolvedValue(dbUser as never);
    compareMock.mockResolvedValue(true as never);
    prismaMock.user.delete.mockRejectedValue(new Error("DB down") as never);

    const res = await DELETE(makeDelete(validBody));

    expect(res.status).toBe(500);
  });
});
