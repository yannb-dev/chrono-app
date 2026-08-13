//
// Controlé et validé par POSTMAN POST
//

import getUserIdFromRequest from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

import { TimerRunnerSchema } from "@/lib/schema/timerrunnerSchema";

export async function POST(req: Request) {
  const userId = getUserIdFromRequest(req);

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const valuePost = await req.json();

  const safeTimerRunner = TimerRunnerSchema.safeParse(valuePost);

  if (!safeTimerRunner.success) {
    return NextResponse.json(
      { error: "Erreur du contrôle ZOD API/TIMERSESSION" },
      { status: 401 },
    );
  }

  const searchSeance = await prisma.seance.findUnique({
    where: {
      id: safeTimerRunner.data.seanceId,
    },
    select: { startedAt: true },
  });

  if (!searchSeance?.startedAt) {
    return NextResponse.json(
      { error: "Aucune valeurs de départ du chronomètre" },
      { status: 401 },
    );
  }

  const somPauses = await prisma.timerPause.aggregate({
    where: { seanceId: safeTimerRunner.data.seanceId },
    _sum: {
      resumedAt: true,
    },
  });

  const chrono =
    safeTimerRunner.data.endedAt.getTime() - searchSeance?.startedAt?.getTime();
  const resultWithPause = chrono - somPauses._sum.resumedAt;

  try {
    const timerRunner = await prisma.timerRunner.create({
      data: {
        numberRunner: safeTimerRunner.data.numberRunner,
        endedAt: safeTimerRunner.data.endedAt,
        seanceId: safeTimerRunner.data.seanceId,
        duration: resultWithPause,
      },
    });

    return NextResponse.json(timerRunner, { status: 201 });
  } catch (err) {
    console.error("Erreur du POST API/TIMERSESSION", err);
    return NextResponse.json(
      { error: "Erreur du POST API/SESSION" },
      { status: 500 },
    );
  }
}
