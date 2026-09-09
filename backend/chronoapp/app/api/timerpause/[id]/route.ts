import getUserIdFromRequest from "@/lib/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

import { TimerPauseSchemaUpdate } from "@/lib/schema/timerPauseSchema";

// Function GET recherche l'ensemble des timerPause VIA l'ID de la séance liée celui ci fourni par [id]
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = getUserIdFromRequest(req);

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  try {
    const timerPause = await prisma.timerPause.findMany({
      where: { seanceId: id, userId: userId },
    });

    return NextResponse.json(timerPause, { status: 201 });
  } catch (err) {
    console.error("Erreur du POST API/TIMERPAUSE", err);
    return NextResponse.json({ err }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = getUserIdFromRequest(req);

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const valuePatch = await req.json();

  const safeValue = TimerPauseSchemaUpdate.safeParse(valuePatch);

  if (!safeValue.success) {
    return NextResponse.json(
      { error: "Erreur du contrôle Zod API/PATCH TIMERPAUSE" },
      { status: 401 },
    );
  }

  const searchPausedAt = await prisma.timerPause.findUnique({
    where: { id, userId },
    select: { pausedAt: true },
  });

  if (!searchPausedAt) {
    return NextResponse.json(
      { error: "Aucune valeur de départ de la pause" },
      { status: 401 },
    );
  }

  try {
    const calcul =
      safeValue.data.endedAt.getTime() - searchPausedAt.pausedAt.getTime();

    const updateTimerPause = await prisma.timerPause.update({
      where: {
        id: id,
        userId: userId,
      },
      data: {
        endedAt: safeValue.data?.endedAt,
        pauseDurationMs: calcul,
      },
    });

    return NextResponse.json(updateTimerPause, { status: 201 });
  } catch (err) {
    console.error("Erreur du PATCH API/TIMERPAUSE", err);
    return NextResponse.json({ err }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = getUserIdFromRequest(req);

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  try {
    const timerPause = await prisma.timerPause.deleteMany({
      where: { seanceId: id, userId: userId },
    });

    return NextResponse.json(timerPause, { status: 201 });
  } catch (err) {
    console.error("Erreur du POST API/TIMERPAUSE", err);
    return NextResponse.json({ err }, { status: 500 });
  }
}
