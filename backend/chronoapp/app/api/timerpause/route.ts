import getUserIdFromRequest from "@/lib/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

import { TimerPauseSchema } from "@/lib/schema/timerPauseSchema";

export async function POST(req: Request) {
  const userId = getUserIdFromRequest(req);

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const valuePost = await req.json();

  const safeTimerPause = TimerPauseSchema.safeParse(valuePost);

  // ici je dois contrôler que le numéro de seanceId fournit par la requête appartient bien à l'utilisateur
  // const prisma.seance avec un findUnique where id et userId si response null ne pas envoyer le timerPause.create

  if (!safeTimerPause.success) {
    console.error("Erreur de contrôle Zod POST API/TIMERPAUSE");
    return NextResponse.json(
      { error: "Erreur de contrôle Zod POST API/POST/TIMERPAUSE" },
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
        { error: "La séance liée n'appartient pas à l'utilisateur" },
        { status: 500 },
      );
    }
  } catch (err) {
    console.error("Erreur POST timerPause", err);
    return NextResponse.json(
      { error: "Erreur POST timerPause" },
      { status: 500 },
    );
  }
}
