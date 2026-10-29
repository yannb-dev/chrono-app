import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import getUserIdFromRequest from "@/lib/auth";
import bcrypt from "bcryptjs";
import getClientIp from "@/lib/getClientIp";
import { userRateLimitIpMobil } from "@/lib/rateLimit";

import { DeleteControlUserPasswordSchema } from "@/lib/schema/deleteSchema";

export async function DELETE(req: Request) {
  const userId = await getUserIdFromRequest(req);

  if (!userId)
    return NextResponse.json({ message: "Non autorisé" }, { status: 401 });

  const body = await req.json().catch(() => null);

  const safeValue = DeleteControlUserPasswordSchema.safeParse(body);

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

  try {
    const IpCheck = await userRateLimitIpMobil.limit(ip);

    if (!IpCheck.success) {
      return NextResponse.json(
        { message: "Trop de tentatives. Réessaie plus tard." },
        {
          status: 429,
        },
      );
    }
  } catch {
    // fail-closed (auth)
    return NextResponse.json(
      { message: "Service temporairement indisponible" },
      { status: 503 },
    );
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return Response.json(
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
        return Response.json(
          { message: "Utilisateur introuvable" },
          { status: 404 },
        );
      }
    }

    console.error("Erreur du POST API/USER/DELETE", err);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}
