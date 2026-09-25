// app/api/auth/register/route.ts
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

import { RegisterSchema } from "@/lib/schema/registerSchema";
import { registerRateLimitEmail } from "@/lib/rateLimit";
import { registerRateLimitIp } from "@/lib/rateLimit";

export async function POST(req: Request) {
  const data = await req.json();

  const safeData = RegisterSchema.safeParse(data);

  if (!safeData.success) {
    console.error(safeData.error, "Erreur du contrôle Zod sur register");
    return NextResponse.json(
      { message: "Erreur de la validation des données" },
      { status: 400 },
    );
  }

  const ip =
    req.headers.get("x-forwarded-for") ||
    req.headers.get("x-rel-ip") ||
    "unknown";

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

  const existingUser = await prisma.user.findUnique({
    where: { email: safeData.data.email },
  });

  if (existingUser) {
    return NextResponse.json(
      { message: "Si un compte existe vérifiez vos emails" },
      { status: 409 },
    );
  }

  try {
    const hashedPassword = await bcrypt.hash(safeData.data.password, 10);

    const user = await prisma.user.create({
      data: { email: safeData.data.email, password: hashedPassword },
    });

    if (user)
      return NextResponse.json(
        { id: user.id, email: user.email },
        { status: 201 },
      );
  } catch (error) {
    console.error("Erreur POST API/REGISTER", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}
