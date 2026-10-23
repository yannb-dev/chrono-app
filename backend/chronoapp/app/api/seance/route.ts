import getUserIdFromRequest from "@/lib/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

import { SeanceSchema } from "@/lib/schema/seanceSchema";

import getClientIp from "@/lib/getClientIp";

import {
  seanceRateLimitIpMobile,
  seanceRateLimitUserId,
} from "@/lib/rateLimit";

export async function GET(req: Request) {
  const userId = await getUserIdFromRequest(req);

  if (!userId) {
    return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
  }

  try {
    const response = await prisma.seance.findMany({
      where: { userId: userId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(response, { status: 200 });
  } catch (err) {
    console.error({ err }, { status: 500 });
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const userId = await getUserIdFromRequest(req);

  if (!userId) {
    return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
  }

  const ip = getClientIp(req);

  if (ip === "unknown") {
    return NextResponse.json(
      { message: "Client non identifiable" },
      { status: 400 },
    );
  }

  try {
    const IpCheck = await seanceRateLimitIpMobile.limit(ip);
    const UserIdCheck = await seanceRateLimitUserId.limit(userId);

    if (!IpCheck.success || !UserIdCheck.success) {
      return NextResponse.json(
        { message: "Trop de tentatives. Réessaie plus tard." },
        {
          status: 429,
        },
      );
    }
  } catch {
    return NextResponse.json(
      { message: "Service temporairement indisponible" },
      { status: 503 },
    );
  }

  const seance = await req.json().catch(() => null);

  const safeSeance = SeanceSchema.safeParse(seance);

  if (!safeSeance.success) {
    console.error(
      "Erreur du contrôle ZOD API/POST/SEANCE",
      safeSeance.error.format(),
    );
    return NextResponse.json(
      {
        message: "Erreur de soumission",
      },
      { status: 400 },
    );
  }

  try {
    const newSeance = await prisma.seance.create({
      data: {
        totalRunner: safeSeance.data.totalRunner,
        colorRunner: safeSeance.data.colorRunner,
        userId: userId,
      },
    });

    return NextResponse.json(newSeance, { status: 201 });
  } catch (err) {
    console.error({ err }, { status: 500 });
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const userId = await getUserIdFromRequest(req);

  if (!userId) {
    return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
  }

  try {
    const { count } = await prisma.seance.deleteMany({
      where: {
        userId: userId,
      },
    });

    if (count === 0) {
      return NextResponse.json(
        { message: "Séances introuvables" },
        { status: 404 },
      );
    }

    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error({ err }, { status: 500 });
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}
