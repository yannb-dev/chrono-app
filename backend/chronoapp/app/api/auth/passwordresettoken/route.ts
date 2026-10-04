import { NextResponse } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

import { after } from "next/server";

import { ResetPasswordSchema } from "@/lib/schema/resetPasswordSchema";
import { sendVerificationEmail } from "@/lib/mail";
import { NewPasswordPatchSchema } from "@/lib/schema/newPasswordSchema";

import { resetPasswordRateLimitIp } from "@/lib/rateLimit";
import { resetPasswordRateLimitEmail } from "@/lib/rateLimit";
import getClientIp from "@/lib/getClientIp";

export async function POST(req: Request) {
  const data = await req.json().catch(() => null);

  const safeData = ResetPasswordSchema.safeParse(data);

  if (!safeData.success) {
    console.error(safeData.error, "Erreur du contrôle Zod sur resetpassword");
    return NextResponse.json(
      { message: "Erreur lors du contrôle des valeurs" },
      { status: 400 },
    );
  }

  const ip = getClientIp(req);

  if (ip === "unknown") {
    return NextResponse.json(
      { message: "Client non identifiable" },
      { status: 400 },
    );
  }

  const ipCheck = await resetPasswordRateLimitIp.limit(ip);
  const EmailCheck = await resetPasswordRateLimitEmail.limit(
    safeData.data.email,
  );

  if (!ipCheck.success || !EmailCheck.success) {
    return NextResponse.json(
      { message: "Trop de tentatives. Réessaie plus tard." },
      {
        status: 429,
      },
    );
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email: safeData.data.email },
    });

    if (existingUser) {
      const rawToken = crypto.randomBytes(32).toString("hex");
      const hashedToken = crypto
        .createHash("sha256")
        .update(rawToken)
        .digest("hex");
      try {
        await prisma.$transaction(async (tx) => {
          await tx.passwordResetToken.deleteMany({
            where: { userId: existingUser.id, usedAt: null },
          });

          await tx.passwordResetToken.create({
            data: {
              tokenHash: hashedToken,
              userId: existingUser.id,
              expiresAt: new Date(Date.now() + 30 * 60 * 1000),
            },
          });
        });

        after(() =>
          sendVerificationEmail(existingUser.email, rawToken).catch((err) =>
            console.error("Echec de l'envoi du mail", err),
          ),
        );
      } catch (error) {
        console.error("Echec de l'envoi de mail ou du create", error);
      }
    }

    return Response.json({
      message: "Si un compte existe, un email de réinitialisation a été envoyé",
    });
  } catch (error) {
    console.error("Erreur POST API/PASSWORDRESETTOKEN", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const valuePatch = await req.json().catch(() => null);

  const safeValue = NewPasswordPatchSchema.safeParse(valuePatch);

  if (!safeValue.success) {
    console.error(safeValue.error, "Erreur de validation zod");
    return NextResponse.json(
      { message: "Erreur de soumissions" },
      { status: 400 },
    );
  }

  const hashedToken = crypto
    .createHash("sha256")
    .update(safeValue.data.token)
    .digest("hex");

  try {
    const searchPasswordResetToken = await prisma.passwordResetToken.findUnique(
      {
        where: { tokenHash: hashedToken },
      },
    );

    if (!searchPasswordResetToken) {
      return NextResponse.json(
        { message: "Lien invalide ou expiré" },
        { status: 400 },
      );
    }

    if (searchPasswordResetToken.usedAt) {
      return NextResponse.json(
        { message: "Lien invalide ou expiré" },
        { status: 400 },
      );
    }

    const now = new Date();
    const expiresAt = new Date(searchPasswordResetToken?.expiresAt);

    if (now > expiresAt) {
      return NextResponse.json(
        { message: "Lien invalide ou expiré" },
        { status: 400 },
      );
    }

    const hashedPassword = await bcrypt.hash(safeValue.data.newPassword, 10);

    await prisma.$transaction(async (tx) => {
      const { count } = await tx.passwordResetToken.updateMany({
        where: {
          tokenHash: hashedToken,
          usedAt: null,
          expiresAt: { gt: new Date() },
        },
        data: { usedAt: new Date() },
      });
      if (count === 0) throw new Error("Lien invalide ou expiré");

      await tx.user.update({
        where: { id: searchPasswordResetToken.userId },
        data: { password: hashedPassword, tokenVersion: { increment: 1 } },
      });
    });

    return NextResponse.json(
      { message: "Mot de passe changé" },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return NextResponse.json(
          { message: "Lien invalide ou expiré" },
          { status: 400 },
        );
      }
    }
    console.error("Erreur du PATCH API/PASSWORRESETTOKEN", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}
