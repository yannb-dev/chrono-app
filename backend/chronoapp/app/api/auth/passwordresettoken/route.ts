// app/api/auth/register/route.ts
import { NextResponse } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

import { ResetPasswordSchema } from "@/lib/schema/resetPasswordSchema";
import { sendVerificationEmail } from "@/lib/mail";
import { NewPasswordPatchSchema } from "@/lib/schema/newPasswordSchema";

export async function POST(req: Request) {
  const data = await req.json();

  const safeData = ResetPasswordSchema.safeParse(data);

  const rawToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto
    .createHash("sha256")
    .update(rawToken)
    .digest("hex");

  if (!safeData.success) {
    console.error(safeData.error, "Erreur du contrôle Zod sur resetpassword");
    return NextResponse.json(
      { message: "Erreur de la validation des données" },
      { status: 400 },
    );
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email: safeData.data.email },
    });

    if (existingUser) {
      try {
        await prisma.passwordResetToken.create({
          data: {
            tokenHash: hashedToken,
            userId: existingUser.id,
            expiresAt: new Date(Date.now() + 30 * 60 * 1000),
          },
        });
        await sendVerificationEmail(existingUser?.email, rawToken);
      } catch (error) {
        console.error("Echec de l'envoi de mail ou du create", error);
      }
    }

    return Response.json({
      message: "Si un compte existe, un email de réinitialisation a été envoyé",
    });
  } catch (error) {
    console.error("Erreur POST API/REGISTER", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const valuePatch = await req.json();
  console.log(valuePatch);

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

    if (searchPasswordResetToken) {
      if (searchPasswordResetToken.usedAt)
        return NextResponse.json({ message: "Lien invalide ou expiré" });

      const now = new Date();
      const expiresAt = new Date(searchPasswordResetToken?.expiresAt);

      if (now > expiresAt) {
        return NextResponse.json({ message: "Lien invalide ou expiré" });
      } else {
        const hashedPassword = await bcrypt.hash(
          safeValue.data.newPassword,
          10,
        );

        await prisma.user.update({
          where: { id: searchPasswordResetToken?.userId },
          data: { password: hashedPassword },
        });

        await prisma.passwordResetToken.update({
          where: { tokenHash: hashedToken },
          data: { usedAt: new Date() },
        });

        return NextResponse.json(
          { message: "Mot de passe changé" },
          { status: 200 },
        );
      }
    }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return Response.json({ message: "Lien invalide ou expiré" });
      }
    }
    console.error("Erreur du PATCH API/PASSWORRESETTOKEN", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}
