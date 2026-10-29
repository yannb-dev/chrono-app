import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

import bcrypt from "bcryptjs";
import getClientIp from "@/lib/getClientIp";
import { userRateLimitEmailWeb, userRateLimitIpWeb } from "@/lib/rateLimit";

import { DeleteControlUserEmailPasswordSchema } from "@/lib/schema/deleteSchema";

export async function DELETE(req: Request) {
  const body = await req.json().catch(() => null);

  const safeValue = DeleteControlUserEmailPasswordSchema.safeParse(body);

  if (!safeValue.success) {
    return NextResponse.json(
      { message: "Format non conforme" },
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

  const IpCheck = await userRateLimitIpWeb.limit(ip);
  const EmailCheck = await userRateLimitEmailWeb.limit(safeValue.data.email);

  if (!IpCheck.success || !EmailCheck.success) {
    return NextResponse.json(
      { message: "Trop de tentatives. Réessaie plus tard." },
      {
        status: 429,
      },
    );
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: safeValue.data.email },
    });

    if (!user) {
      return NextResponse.json(
        { message: "Utilisateur introuvable" },
        { status: 404 },
      );
    }
    const control = await bcrypt.compare(
      safeValue.data.password,
      user.password,
    );

    if (!control) {
      return NextResponse.json(
        { message: "Mot de passe incorrect" },
        { status: 403 },
      );
    }
    await prisma.user.delete({
      where: { id: user.id, email: user.email },
    });

    return new NextResponse(null, { status: 204 });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2025") {
        return NextResponse.json(
          { message: "Utilisateur introuvable" },
          { status: 404 },
        );
      }
    }

    console.error("Erreur du POST API/USER/DELETE", err);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}
