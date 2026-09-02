import getUserIdFromRequest from "@/lib/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

import { SeanceSchema } from "@/lib/schema/seanceSchema";

export async function GET(req: Request) {
  const userId = getUserIdFromRequest(req);

  if (!userId) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  try {
    const response = await prisma.seance.findMany({
      where: { userId: userId },
      include: { timerpauses: true, timerRunners: true },
    });

    return NextResponse.json(response, { status: 200 });
  } catch (err) {
    console.error({ err }, { status: 500 });
    return NextResponse.json({ error: "Erreur POST seance" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const userId = getUserIdFromRequest(req);

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
        error: "Erreur contrôle ZOD API/POST/SEANCE",
        detail: safeSeance.error.format(),
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
    return NextResponse.json({ error: "Erreur POST seance" }, { status: 500 });
  }
}
