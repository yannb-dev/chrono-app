import getUserIdFromRequest from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

import { TimerRunnerSchema } from "@/lib/schema/timerrunnerSchema";

export async function POST(req: Request) {
  const userId = getUserIdFromRequest(req);

  if (!userId) {
    return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
  }

  const valuePost = await req.json();

  const safeTimerRunner = TimerRunnerSchema.safeParse(valuePost);

  if (!safeTimerRunner.success) {
    return NextResponse.json(
      { message: "Erreur de soumission" },
      { status: 400 },
    );
  }

  const searchSeance = await prisma.seance.findUnique({
    where: {
      id: safeTimerRunner.data.seanceId,
      userId: userId,
    },
    select: { startedAt: true },
  });

  if (!searchSeance?.startedAt) {
    return NextResponse.json(
      { message: "Le chronomètre n'est pas actif" },
      { status: 404 },
    );
  }

  const somPauses = await prisma.timerPause.aggregate({
    where: { seanceId: safeTimerRunner.data.seanceId },
    _sum: {
      pauseDurationMs: true,
    },
  });

  const chrono =
    safeTimerRunner.data.endedAt.getTime() - searchSeance?.startedAt?.getTime();

  const result = chrono - (somPauses._sum.pauseDurationMs ?? 0);

  try {
    const timerRunner = await prisma.timerRunner.create({
      data: {
        numberRunner: safeTimerRunner.data.numberRunner,
        endedAt: safeTimerRunner.data.endedAt,
        seanceId: safeTimerRunner.data.seanceId,
        duration: result,
        userId: userId,
      },
    });

    return NextResponse.json(timerRunner, { status: 201 });
  } catch (err) {
    console.error("Erreur du POST API/TIMERSESSION", err);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}
