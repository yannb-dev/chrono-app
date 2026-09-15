import getUserIdFromRequest from "@/lib/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

import { TimerPauseSchema } from "@/lib/schema/timerPauseSchema";

export async function POST(req: Request) {
  const userId = getUserIdFromRequest(req);

  if (!userId) {
    return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
  }

  const valuePost = await req.json();

  const safeTimerPause = TimerPauseSchema.safeParse(valuePost);

  if (!safeTimerPause.success) {
    console.error("Erreur de contrôle Zod POST API/TIMERPAUSE");
    return NextResponse.json(
      { message: "Erreur de soumission" },
      { status: 400 },
    );
  }

  try {
    const controleSeance = await prisma.seance.findUnique({
      where: { id: safeTimerPause.data?.seanceId, userId: userId },
    });

    if (controleSeance) {
      const newTimerPause = await prisma.timerPause.create({
        data: {
          seanceId: safeTimerPause.data.seanceId,
          pausedAt: safeTimerPause.data.pausedAt,
          userId: userId,
        },
      });

      return NextResponse.json(newTimerPause, { status: 201 });
    } else {
      return NextResponse.json(
        { message: "La séance liée n'appartient pas à l'utilisateur" },
        { status: 403 },
      );
    }
  } catch (err) {
    console.error("Erreur POST timerPause", err);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}
