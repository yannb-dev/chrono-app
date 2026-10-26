// @vitest-environment node

import { describe, it, expect, vi, beforeEach } from "vitest";
import { prismaMock } from "@/test/prismaMock";
import { POST } from "@/app/api/auth/register/route";
import { registerRateLimitEmail, registerRateLimitIp } from "@/lib/rateLimit";
import bcrypt from "bcryptjs";

vi.mock("bcryptjs", () => ({
  default: {
    compare: vi.fn(),
    hash: vi.fn(),
  },
}));

vi.mock("@/lib/rateLimit", () => ({
  registerRateLimitEmail: { limit: vi.fn() },
  registerRateLimitIp: { limit: vi.fn() },
}));

//======= POST ===========
//========================

describe("POST /api/auth/register", () => {
  const makePost = (body: unknown) =>
    new Request("http://localhost/api/auth/register", {
      method: "POST",
      headers: { "x-forwarded-for": "1.2.3.4" },
      body: JSON.stringify(body),
    });

  const makePostInvalidIp = (body: unknown) =>
    new Request("http://localhost/api/auth/register", {
      method: "POST",
      headers: {},
      body: JSON.stringify(body),
    });

  const limitMockUserEmail = vi.mocked(registerRateLimitEmail.limit);
  const limitMockIp = vi.mocked(registerRateLimitIp.limit);

  const ok = { success: true, limit: 5, remaining: 4, reset: 0 };
  const blocked = { success: false, limit: 5, remaining: 0, reset: 0 };

  beforeEach(() => {
    limitMockIp.mockResolvedValue(ok as never);
    limitMockUserEmail.mockResolvedValue(ok as never);
  });

  //   // ==== TEST 1 ====
  //   //

  it("renvoie 4OO - mauvais format d'email", async () => {
    limitMockUserEmail.mockResolvedValue(ok as never);

    const res = await POST(
      makePost({ email: "testgmailcom", password: "Azerty123+" }),
    );

    expect(res.status).toBe(400);
    expect(prismaMock.user.create).not.toHaveBeenCalled();
  });

  // ==== TEST 2 ====
  //
  it("renvoie 400 - IP non présent", async () => {
    const res = await POST(
      makePostInvalidIp({
        email: "test@gmail.com",
        password: "Azerty123+",
        confirmPassword: "Azerty123+",
      }),
    );

    expect(res.status).toBe(400);
    expect(prismaMock.user.create).not.toHaveBeenCalled();
  });

  // ==== TEST 2 ====
  //
  it("renvoie 429 - ratelimit déclenché par IP", async () => {
    limitMockIp.mockResolvedValue(blocked as never);

    const res = await POST(
      makePost({
        email: "test@gmail.com",
        password: "Azerty123+",
        confirmPassword: "Azerty123+",
      }),
    );

    expect(res.status).toBe(429);
    expect(prismaMock.user.create).not.toHaveBeenCalled();
  });

  //   //   // ==== TEST 3 ====
  //   //   //
  it("renvoie 429 - ratelimit déclenché par EMAIL", async () => {
    limitMockUserEmail.mockResolvedValue(blocked as never);

    const res = await POST(
      makePost({
        email: "test@gmail.com",
        password: "Azerty123+",
        confirmPassword: "Azerty123+",
      }),
    );

    expect(res.status).toBe(429);
    expect(prismaMock.user.create).not.toHaveBeenCalled();
  });

  //   //   // ==== TEST 4 ====
  //   //   //
  it("renvoie 503 - ratelimit HS", async () => {
    limitMockUserEmail.mockRejectedValue(new Error("Upstash down") as never);

    const res = await POST(
      makePost({
        email: "test@gmail.com",
        password: "Azerty123+",
        confirmPassword: "Azerty123+",
      }),
    );

    expect(res.status).toBe(503);
    expect(prismaMock.user.create).not.toHaveBeenCalled();
  });

  //   //   // ==== TEST 6 ====
  //   //   //

  it("renvoie 4O9 - Compte exite déjà", async () => {
    const hashMock = vi.mocked(bcrypt.hash);
    limitMockUserEmail.mockResolvedValue(ok as never);
    hashMock.mockResolvedValue("hashed-pw" as never);
    prismaMock.user.findUnique.mockResolvedValue({
      id: "aze123+",
      createdAt: new Date(),
      name: "test",
      email: "test@gmail.com",
      password: "test",
      image: null,
      tokenVersion: 1,
    } as never);

    const res = await POST(
      makePost({
        email: "test@gmail.com",
        password: "Azerty123+",
        confirmPassword: "Azerty123+",
      }),
    );

    expect(prismaMock.user.findUnique).toHaveBeenCalled();
    expect(res.status).toBe(409);
  });

  //   //   // ==== TEST 7 ====
  //   //   //

  it("renvoie 201 - Compte crée", async () => {
    const user = null;
    const hashMock = vi.mocked(bcrypt.hash);
    limitMockUserEmail.mockResolvedValue(ok as never);
    hashMock.mockResolvedValue("hashed-pw" as never);
    prismaMock.user.findUnique.mockResolvedValue(user as never);
    prismaMock.user.create.mockResolvedValue({ id: "u1" } as never);

    const res = await POST(
      makePost({
        email: "test@gmail.com",
        password: "Azerty123+",
        confirmPassword: "Azerty123+",
      }),
    );

    expect(prismaMock.user.findUnique).toHaveBeenCalled();
    expect(prismaMock.user.create).toHaveBeenCalled();
    expect(res.status).toBe(201);
  });
});
