import getUserIdFromRequest from "@/lib/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

import { TimerPauseSchemaUpdate } from "@/lib/schema/timerPauseSchema";

// Function GET recherche l'ensemble des timerPause VIA l'ID de la séance liée celui ci fourni par [id]
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = getUserIdFromRequest(req);

  if (!userId) {
    return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;
  try {
    const timerPause = await prisma.timerPause.findMany({
      where: { seanceId: id, userId: userId },
    });

    return NextResponse.json(timerPause, { status: 200 });
  } catch (err) {
    console.error("Erreur du POST API/TIMERPAUSE", err);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = getUserIdFromRequest(req);

  if (!userId) {
    return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;

  const valuePatch = await req.json();

  const safeValue = TimerPauseSchemaUpdate.safeParse(valuePatch);

  if (!safeValue.success) {
    return NextResponse.json(
      { message: "Erreur de soumissions" },
      { status: 400 },
    );
  }

  const searchPausedAt = await prisma.timerPause.findUnique({
    where: { id, userId },
    select: { pausedAt: true },
  });

  if (!searchPausedAt) {
    return NextResponse.json(
      { message: "Aucune pause en cours" },
      { status: 404 },
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

    return NextResponse.json(updateTimerPause, { status: 200 });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2025") {
        return Response.json(
          { message: "TimerPause introuvable" },
          { status: 404 },
        );
      }
    }

    console.error("Erreur du PATCH API/TIMERPAUSE", err);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = getUserIdFromRequest(req);

  if (!userId) {
    return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;
  try {
    const timerPause = await prisma.timerPause.deleteMany({
      where: { seanceId: id, userId: userId },
    });

    return NextResponse.json({ status: 204 });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2025") {
        return Response.json(
          { message: "TimerPause introuvable" },
          { status: 404 },
        );
      }
    }

    console.error("Erreur du POST API/TIMERPAUSE", err);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}
