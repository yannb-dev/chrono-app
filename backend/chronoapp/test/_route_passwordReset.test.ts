// @vitest-environment node

import { describe, it, expect, vi, beforeEach } from "vitest";
import { prismaMock } from "@/test/prismaMock";
import { POST, PATCH } from "@/app/api/auth/passwordresettoken/route";
import { Prisma } from "@prisma/client";
import { sendVerificationEmail } from "@/lib/mail";
import {
  resetPasswordRateLimitEmail,
  resetPasswordRateLimitIp,
} from "@/lib/rateLimit";
import bcrypt from "bcryptjs";
import crypto from "crypto";

vi.mock("bcryptjs", () => ({
  default: {
    compare: vi.fn(),
    hash: vi.fn(),
  },
}));

vi.mock("next/server", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/server")>();
  return {
    ...actual, // garde NextResponse
    after: vi.fn((cb: () => unknown) => cb()),
  };
});

vi.mock("@/lib/rateLimit", () => ({
  resetPasswordRateLimitEmail: { limit: vi.fn() },
  resetPasswordRateLimitIp: { limit: vi.fn() },
}));

vi.mock("@/lib/mail", () => ({
  sendVerificationEmail: vi.fn(),
}));

//======= POST ===========
//========================

describe("POST /api/auth/passwordresettoken", () => {
  const makePost = (body: unknown) =>
    new Request("http://localhost/api/auth/passwordresettoken", {
      method: "POST",
      headers: { "x-forwarded-for": "1.2.3.4" },
      body: JSON.stringify(body),
    });

  const makePostInvalidIp = (body: unknown) =>
    new Request("http://localhost/api/auth/passwordresettoken", {
      method: "POST",
      headers: {},
      body: JSON.stringify(body),
    });

  const limitMockUserEmail = vi.mocked(resetPasswordRateLimitEmail.limit);
  const limitMockIp = vi.mocked(resetPasswordRateLimitIp.limit);

  const ok = { success: true, limit: 3, remaining: 1, reset: 0 };
  const blocked = { success: false, limit: 3, remaining: 0, reset: 0 };

  const sendMailMock = vi.mocked(sendVerificationEmail);

  beforeEach(() => {
    vi.clearAllMocks();
    limitMockIp.mockResolvedValue(ok as never);
    limitMockUserEmail.mockResolvedValue(ok as never);
    prismaMock.$transaction.mockImplementation(async (cb: any) =>
      cb(prismaMock),
    );
    sendMailMock.mockResolvedValue(undefined as never);
  });

  //   // ==== TEST 1 ====
  //   //

  it("renvoie 4OO - mauvais format d'email", async () => {
    limitMockUserEmail.mockResolvedValue(ok as never);

    const res = await POST(makePost({ email: "testgmailcom" }));

    expect(res.status).toBe(400);

    expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
  });

  // ==== TEST 2 ====
  //
  it("renvoie 400 - IP non présent", async () => {
    const res = await POST(
      makePostInvalidIp({
        email: "test@gmail.com",
      }),
    );

    expect(res.status).toBe(400);
    expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
  });

  //   // ==== TEST 2 ====
  //   //
  it("renvoie 429 - ratelimit déclenché par IP", async () => {
    limitMockIp.mockResolvedValue(blocked as never);

    const res = await POST(
      makePost({
        email: "test@gmail.com",
      }),
    );

    expect(res.status).toBe(429);
    expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
  });

  //   //   //   // ==== TEST 3 ====
  //   //   //   //
  it("renvoie 429 - ratelimit déclenché par EMAIL", async () => {
    limitMockUserEmail.mockResolvedValue(blocked as never);

    const res = await POST(
      makePost({
        email: "test@gmail.com",
      }),
    );

    expect(res.status).toBe(429);
    expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
  });

  //   //   //   // ==== TEST 4 ====
  //   //   //   //
  it("renvoie 503 - ratelimit HS", async () => {
    limitMockUserEmail.mockRejectedValue(new Error("Upstash down") as never);

    const res = await POST(
      makePost({
        email: "test@gmail.com",
      }),
    );

    expect(res.status).toBe(503);
    expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
  });

  //   //   //   // ==== TEST 6 ====
  //   //   //   //

  it("200 générique - aucun compte : pas de token, pas de mail", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    const res = await POST(makePost({ email: "inconnu@gmail.com" }));

    expect(res.status).toBe(200);
    expect(prismaMock.user.findUnique).toHaveBeenCalled();
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
    expect(sendMailMock).not.toHaveBeenCalled();
  });

  //   //   //   // ==== TEST 7 ====
  //   //   //   //

  it("200 générique - compte existant : token haché stocké + mail envoyé", async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: "u1",
      email: "test@gmail.com",
    } as never);

    const res = await POST(makePost({ email: "test@gmail.com" }));

    expect(res.status).toBe(200);
    expect(prismaMock.passwordResetToken.deleteMany).toHaveBeenCalledWith({
      where: { userId: "u1", usedAt: null },
    });
    expect(prismaMock.passwordResetToken.create).toHaveBeenCalled();
    expect(sendMailMock).toHaveBeenCalledWith(
      "test@gmail.com",
      expect.any(String),
    );

    // le token en clair part par mail, seul son hash est stocké
    const rawToken = sendMailMock.mock.calls[0][1];
    const stored = prismaMock.passwordResetToken.create.mock.calls[0][0].data;
    expect(stored.tokenHash).not.toBe(rawToken);
    expect(stored.tokenHash).toBe(
      crypto.createHash("sha256").update(rawToken).digest("hex"),
    );
  });
});

//======= PATCH ===========
//=========================

describe("PATCH /api/auth/passwordresettoken", () => {
  const makePatch = (body: unknown) =>
    new Request("http://localhost/api/auth/passwordresettoken", {
      method: "PATCH",
      headers: { "x-forwarded-for": "1.2.3.4" },
      body: JSON.stringify(body),
    });

  const makePatchInvalidIp = (body: unknown) =>
    new Request("http://localhost/api/auth/passwordresettoken", {
      method: "POST",
      headers: {},
      body: JSON.stringify(body),
    });

  beforeEach(() => {
    prismaMock.$transaction.mockImplementation(async (cb: any) =>
      cb(prismaMock),
    );
  });

  //   // ==== TEST 1 ====
  //   //

  it("renvoie 4OO - erreur validation ZOD", async () => {
    const res = await PATCH(
      makePatch({ newPassword: "Azerty123+", token: 20 }),
    );

    expect(res.status).toBe(400);
    expect(prismaMock.passwordResetToken.findUnique).not.toHaveBeenCalled();
  });

  //   // ==== TEST 2 ====
  //   //

  it("renvoie 4OO - passwordResetToken introuvable", async () => {
    const returnPasswordResetToken = null;

    prismaMock.passwordResetToken.findUnique.mockResolvedValue(
      returnPasswordResetToken as never,
    );

    const res = await PATCH(
      makePatch({ newPassword: "Azerty123+", token: "token123" }),
    );

    expect(res.status).toBe(400);
    expect(prismaMock.passwordResetToken.findUnique).toHaveBeenCalled();
  });

  //   // ==== TEST 3 ====
  //   //

  it("renvoie 4OO - passwordResetToken.userAt avec une date", async () => {
    const returnPasswordResetToken = {
      id: "test",
      tokenHash: "lskdskdlkslk",
      userId: "u1",
      expiresAt: new Date(),
      usedAt: new Date(Date.now() - 10 * 60 * 1000),
      createdAt: new Date(Date.now() + 5 * 60 * 1000),
    };
    prismaMock.passwordResetToken.findUnique.mockResolvedValue(
      returnPasswordResetToken as never,
    );

    const res = await PATCH(
      makePatch({ newPassword: "Azerty123+", token: "token123" }),
    );

    expect(res.status).toBe(400);
    expect(prismaMock.passwordResetToken.findUnique).toHaveBeenCalled();
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  //   // ==== TEST 4 ====
  //   //

  it("renvoie 4OO - passwordResetToken expiré", async () => {
    const returnPasswordResetToken = {
      id: "test",
      tokenHash: "lskdskdlkslk",
      userId: "u1",
      expiresAt: new Date(Date.now() - 20 * 60 * 1000),
      usedAt: null,
      createdAt: new Date(),
    };
    prismaMock.passwordResetToken.findUnique.mockResolvedValue(
      returnPasswordResetToken as never,
    );

    const res = await PATCH(
      makePatch({ newPassword: "Azerty123+", token: "token123" }),
    );

    expect(res.status).toBe(400);
    expect(prismaMock.passwordResetToken.findUnique).toHaveBeenCalled();
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  //   // ==== TEST 5 ====
  //   //

  it("500 - updateMany ne touche aucune ligne (race condition)", async () => {
    prismaMock.passwordResetToken.findUnique.mockResolvedValue({
      id: "t1",
      tokenHash: "x",
      userId: "u1",
      expiresAt: new Date(Date.now() + 20 * 60 * 1000),
      usedAt: null,
      createdAt: new Date(),
    } as never);
    vi.mocked(bcrypt.hash).mockResolvedValue("hashed-pw" as never);
    prismaMock.passwordResetToken.updateMany.mockResolvedValue({
      count: 0,
    } as never);

    const res = await PATCH(
      makePatch({ newPassword: "Azerty123+", token: "token123" }),
    );

    expect(res.status).toBe(400);
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });

  //   // ==== TEST 6 ====
  //   //

  it("200 - mot de passe changé", async () => {
    prismaMock.passwordResetToken.findUnique.mockResolvedValue({
      id: "t1",
      tokenHash: "x",
      userId: "u1",
      expiresAt: new Date(Date.now() + 20 * 60 * 1000),
      usedAt: null,
      createdAt: new Date(),
    } as never);
    vi.mocked(bcrypt.hash).mockResolvedValue("hashed-pw" as never);
    prismaMock.passwordResetToken.updateMany.mockResolvedValue({
      count: 1,
    } as never);
    prismaMock.user.update.mockResolvedValue({ id: "u1" } as never);

    const res = await PATCH(
      makePatch({ newPassword: "Azerty123+", token: "token123" }),
    );

    expect(res.status).toBe(200);
    expect(bcrypt.hash).toHaveBeenCalledWith("Azerty123+", 10);
    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: "u1" },
      data: { password: "hashed-pw", tokenVersion: { increment: 1 } },
    });
  });

  //   // ==== TEST 7 ====
  //   //

  it("400 - erreur Prisma P2025", async () => {
    prismaMock.passwordResetToken.findUnique.mockResolvedValue({
      id: "t1",
      tokenHash: "x",
      userId: "u1",
      expiresAt: new Date(Date.now() + 20 * 60 * 1000),
      usedAt: null,
      createdAt: new Date(),
    } as never);
    vi.mocked(bcrypt.hash).mockResolvedValue("hashed-pw" as never);
    prismaMock.passwordResetToken.updateMany.mockResolvedValue({
      count: 1,
    } as never);
    prismaMock.user.update.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("not found", {
        code: "P2025",
        clientVersion: "test",
      }),
    );

    const res = await PATCH(
      makePatch({ newPassword: "Azerty123+", token: "token123" }),
    );

    expect(res.status).toBe(400);
  });
});
