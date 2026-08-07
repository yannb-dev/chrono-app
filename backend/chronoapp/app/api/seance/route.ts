import getUserIdFromRequest from "@/lib/auth";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

import { SeanceSchema } from "@/lib/schema/seanceSchema";

export async function GET(req: Request) {
  const userId = getUserIdFromRequest(req);

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const seance = await prisma.seance.findMany({
      where: { userId: userId },
    });

    return NextResponse.json(seance);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Erreur GET API/SEANCE" },
      { status: 500 },
    );
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
    console.error("Erreur du contrôle ZOD API/POST/SEANCE");
    return NextResponse.json(
      { error: "Erreur contrôle ZOD API/POST/SEANCE" },
      { status: 400 },
    );
  }

  try {
    const newSeance = await prisma.seance.create({
      data: {
        totalRunner: safeSeance.data?.totalRunner,
        colorRunner: safeSeance.data?.colorRunner,
        userId: userId,
      },
    });

    return NextResponse.json({ newSeance }, { status: 201 });
  } catch (err) {
    console.error({ err }, { status: 500 });
    return NextResponse.json({ error: "Erreur POST seance" }, { status: 500 });
  }
}
