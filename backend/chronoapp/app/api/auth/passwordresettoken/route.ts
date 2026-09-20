// app/api/auth/register/route.ts
import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

import { ResetPasswordSchema } from "@/lib/schema/resetPasswordSchema";
import { sendVerificationEmail } from "@/lib/mail";

export async function POST(req: Request) {
  const data = await req.json();

  const safeData = ResetPasswordSchema.safeParse(data);

  if (!safeData.success) {
    console.error(safeData.error, "Erreur du contrôle Zod sur resetpassword");
    return NextResponse.json(
      { message: "Erreur de la validation des données" },
      { status: 400 },
    );
  }

  try {
    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    const existingUser = await prisma.user.findUnique({
      where: { email: safeData.data.email },
    });

    if (existingUser) {
      await prisma.passwordResetToken.create({
        data: {
          tokenHash: hashedToken,
          userId: existingUser.id,
          expiresAt: new Date(Date.now() + 30 * 60 * 1000),
        },
      });

      sendVerificationEmail(existingUser?.email, hashedToken);
    }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return Response.json(
          { message: "Aucun compte n'exite pour cette adresse mail" },
          { status: 404 },
        );
      }
    }
    console.error("Erreur POST API/REGISTER", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}
