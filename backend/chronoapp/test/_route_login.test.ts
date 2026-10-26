// @vitest-environment node

import { describe, it, expect, vi, beforeEach } from "vitest";
import { prismaMock } from "@/test/prismaMock";
import { POST } from "@/app/api/auth/login/route";
import { loginRateLimitEmail, loginRateLimitIP } from "@/lib/rateLimit";
import bcrypt from "bcryptjs";

vi.mock("bcryptjs", () => ({
  default: {
    compare: vi.fn(),
  },
}));

vi.mock("@/lib/rateLimit", () => ({
  loginRateLimitEmail: { limit: vi.fn() },
  loginRateLimitIP: { limit: vi.fn() },
}));

//======= POST ===========
//========================

describe("POST /api/auth/login", () => {
  const makePost = (body: unknown) =>
    new Request("http://localhost/api/auth/login", {
      method: "POST",
      headers: { "x-forwarded-for": "1.2.3.4" },
      body: JSON.stringify(body),
    });

  const makePostInvalidIp = (body: unknown) =>
    new Request("http://localhost/api/auth/login", {
      method: "POST",
      headers: {},
      body: JSON.stringify(body),
    });

  const limitMockUserEmail = vi.mocked(loginRateLimitEmail.limit);
  const limitMockIp = vi.mocked(loginRateLimitIP.limit);

  const ok = { success: true, limit: 5, remaining: 4, reset: 0 };
  const blocked = { success: false, limit: 60, remaining: 0, reset: 0 };

  beforeEach(() => {
    limitMockIp.mockResolvedValue(ok as never);
    limitMockUserEmail.mockResolvedValue(ok as never);
  });

  // ==== TEST 1 ====
  //
  it("renvoie 400 - IP non présent", async () => {
    const res = await POST(
      makePostInvalidIp({ email: "test@gmail.com", password: "Azerty123+" }),
    );

    expect(res.status).toBe(400);
    expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
  });

  // ==== TEST 2 ====
  //
  it("renvoie 429 - ratelimit déclenché par IP", async () => {
    limitMockIp.mockResolvedValue(blocked as never);

    const res = await POST(
      makePost({ email: "test@gmail.com", password: "Azerty123+" }),
    );

    expect(res.status).toBe(429);
    expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
  });

  //   // ==== TEST 3 ====
  //   //
  it("renvoie 429 - ratelimit déclenché par EMAIL", async () => {
    limitMockUserEmail.mockResolvedValue(blocked as never);

    const res = await POST(
      makePost({ email: "test@gmail.com", password: "Azerty123+" }),
    );

    expect(res.status).toBe(429);
    expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
  });

  //   // ==== TEST 4 ====
  //   //
  it("renvoie 503 - ratelimit HS", async () => {
    limitMockUserEmail.mockRejectedValue(new Error("Upstash down") as never);

    const res = await POST(
      makePost({ email: "test@gmail.com", password: "Azerty123+" }),
    );

    expect(res.status).toBe(503);
    expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
  });

  //   // ==== TEST 5 ====
  //   //

  it("renvoie 4OO - mauvais format d'email", async () => {
    limitMockUserEmail.mockResolvedValue(ok as never);

    const res = await POST(
      makePost({ email: "testgmailcom", password: "Azerty123+" }),
    );

    expect(res.status).toBe(400);
    expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
  });

  //   // ==== TEST 6 ====
  //   //

  it("renvoie 4O1 - Identification invalide", async () => {
    limitMockUserEmail.mockResolvedValue(ok as never);
    prismaMock.user.findUnique.mockResolvedValue({
      password: "Aqwzsx123+",
    } as never);

    const res = await POST(
      makePost({ email: "test@gmail.com", password: "Azerty123+" }),
    );

    expect(prismaMock.user.findUnique).toHaveBeenCalled();
    expect(res.status).toBe(401);
  });

  //   // ==== TEST 7 ====
  //   //

  it("renvoie token - Identification valide", async () => {
    const compareMock = vi.mocked(bcrypt.compare);
    limitMockUserEmail.mockResolvedValue(ok as never);

    prismaMock.user.findUnique.mockResolvedValue({
      password: "Azerty123+",
      id: "u1",
      tokenVersion: 1,
    } as never);
    compareMock.mockResolvedValue(true as never);

    const res = await POST(
      makePost({ email: "test@gmail.com", password: "Azerty123+" }),
    );

    expect(prismaMock.user.findUnique).toHaveBeenCalled();

    expect(compareMock).toHaveBeenCalledWith("Azerty123+", "Azerty123+");
    expect(res.status).not.toBe(201);
  });

  //   // ==== TEST 8 ====
  //   //

  it("401 - mauvais mot de passe", async () => {
    const compareMock = vi.mocked(bcrypt.compare);
    limitMockUserEmail.mockResolvedValue(ok as never);
    compareMock.mockResolvedValue(false as never);

    const res = await POST(
      makePost({ email: "test@gmail.com", password: "Azerty123+" }),
    );

    expect(res.status).toBe(401);
  });

  //   // ==== TEST 9 ====
  //   //

  it("401 - utilisateur inconnu : bcrypt est quand même appelé avec le hash factice", async () => {
    const compareMock = vi.mocked(bcrypt.compare);
    limitMockUserEmail.mockResolvedValue(ok as never);
    prismaMock.user.findUnique.mockResolvedValue(null);
    compareMock.mockResolvedValue(false as never);

    const res = await POST(
      makePost({ email: "inconnu@gmail.com", password: "Azerty123+" }),
    );

    expect(res.status).toBe(401);
    expect(compareMock).toHaveBeenCalledWith(
      "Azerty123+",
      expect.stringMatching(/^\$2b\$10\$/),
    );
  });
});
