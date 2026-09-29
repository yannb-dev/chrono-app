import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

import getClientIp from "@/lib/getClientIp";

import { loginRateLimitIP } from "@/lib/rateLimit";
import { loginRateLimitEmail } from "@/lib/rateLimit";

import { LoginSchema } from "@/lib/schema/loginSchema";

export async function POST(req: Request) {
  const value = await req.json().catch(() => null);

  const safeValue = LoginSchema.safeParse(value);

  if (!safeValue.success) {
    return NextResponse.json(
      { message: "Format de l'email ou du mot de passe non conformes" },
      { status: 400 },
    );
  }

  const ip = getClientIp(req);

  const IpCheck = await loginRateLimitIP.limit(ip);
  const EmailCheck = await loginRateLimitEmail.limit(
    safeValue.data.email.trim().toLowerCase(),
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
    const userSearch = await prisma.user.findUnique({
      where: { email: safeValue.data?.email },
    });

    const hash = "$2b$10$VUj4JXqrv6THyQGneEsax.HzWPKLVwA3JxHMM9hzEJVCktvJxVYKi";

    const control = await bcrypt.compare(
      safeValue.data.password,
      userSearch?.password ?? hash,
    );

    if (!userSearch || !control)
      return NextResponse.json(
        { message: "Identifications invalides" },
        { status: 401 },
      );

    const token = jwt.sign(
      { userId: userSearch.id, tokenVersion: userSearch.tokenVersion },
      process.env.JWT_SECRET!,
      {
        expiresIn: "7d",
      },
    );

    return NextResponse.json({ token });
  } catch (err) {
    console.error("Erreur du POST API/LOGIN", err);
    return NextResponse.json({ message: "Erreur Serveur" }, { status: 500 });
  }
}
