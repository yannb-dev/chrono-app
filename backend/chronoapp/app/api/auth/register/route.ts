// app/api/auth/register/route.ts
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

import { RegisterSchema } from "@/lib/schema/registerSchema";
import { registerRateLimitEmail } from "@/lib/rateLimit";
import { registerRateLimitIp } from "@/lib/rateLimit";
import getClientIp from "@/lib/getClientIp";

export async function POST(req: Request) {
  const data = await req.json().catch(() => null);

  const safeData = RegisterSchema.safeParse(data);

  if (!safeData.success) {
    console.error(safeData.error, "Erreur du contrôle Zod sur register");
    return NextResponse.json(
      { message: "Erreur de la validation des données" },
      { status: 400 },
    );
  }

  const ip = getClientIp(req);

  const IpCheck = await registerRateLimitIp.limit(ip);
  const EmailCheck = await registerRateLimitEmail.limit(
    safeData.data.email.trim().toLowerCase(),
  );

  if (!IpCheck.success || !EmailCheck.success) {
    return NextResponse.json(
      { message: "Trop de tentatives. Réessaie plus tard." },
      {
        status: 429,
      },
    );
  }

  try {
    const hashedPassword = await bcrypt.hash(safeData.data.password, 10);
    const existingUser = await prisma.user.findUnique({
      where: { email: safeData.data.email },
    });

    if (!existingUser) {
      return NextResponse.json(
        { message: "Si un compte existe vérifiez vos emails" },
        { status: 201 },
      );
    }

    const user = await prisma.user.create({
      data: { email: safeData.data.email, password: hashedPassword },
    });

    if (user)
      return NextResponse.json(
        { message: "Si un compte existe vérifiez vos emails" },
        { status: 201 },
      );
  } catch (error) {
    console.error("Erreur POST API/REGISTER", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}
