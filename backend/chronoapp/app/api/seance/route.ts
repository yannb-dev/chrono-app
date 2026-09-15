import getUserIdFromRequest from "@/lib/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

import { SeanceSchema } from "@/lib/schema/seanceSchema";

export async function GET(req: Request) {
  const userId = getUserIdFromRequest(req);

  if (!userId) {
    return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
  }

  try {
    const response = await prisma.seance.findMany({
      where: { userId: userId },
      include: { timerpauses: true, timerRunners: true },
    });

    return NextResponse.json(response, { status: 200 });
  } catch (err) {
    console.error({ err }, { status: 500 });
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const userId = getUserIdFromRequest(req);

  if (!userId) {
    return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
  }

  const seance = await req.json();

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
  const userId = getUserIdFromRequest(req);

  if (!userId) {
    return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
  }

  try {
    await prisma.seance.deleteMany({
      where: {
        userId: userId,
      },
    });

    return NextResponse.json({ status: 204 });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2025") {
        return Response.json(
          { message: "Séance introuvable" },
          { status: 404 },
        );
      }
    }
    console.error({ err }, { status: 500 });
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}
