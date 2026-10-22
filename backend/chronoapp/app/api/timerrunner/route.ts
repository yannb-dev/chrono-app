import getUserIdFromRequest from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

import getClientIp from "@/lib/getClientIp";
import { TimerRunnerSchema } from "@/lib/schema/timerrunnerSchema";

import {
  timerrunnerRateLimitIpMobile,
  timerrunnerRateLimitUserId,
} from "@/lib/rateLimit";

class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
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
    const IpCheck = await timerrunnerRateLimitIpMobile.limit(ip);
    const UserIdCheck = await timerrunnerRateLimitUserId.limit(userId);

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

  const valuePost = await req.json().catch(() => null);

  const safeTimerRunner = TimerRunnerSchema.safeParse(valuePost);

  if (!safeTimerRunner.success) {
    return NextResponse.json(
      { message: "Erreur de soumission" },
      { status: 400 },
    );
  }

  try {
    const timerRunner = await prisma.$transaction(async (tx) => {
      const searchSeance = await tx.seance.findUnique({
        where: {
          id: safeTimerRunner.data.seanceId,
          userId: userId,
        },
        select: { startedAt: true, timerpauses: true, state: true },
      });

      if (!searchSeance) {
        throw new HttpError(
          404,
          "Séance inexistante, enregistrement impossible",
        );
      }

      if (searchSeance?.state === "Finish") {
        throw new HttpError(
          409,
          "La séance est terminé, impossible d'ajouter un coureur",
        );
      }

      if (
        searchSeance?.state === "NoStart" ||
        searchSeance?.timerpauses.find((pause) => pause.endedAt === null) ||
        searchSeance?.startedAt === null
      ) {
        throw new HttpError(409, "Le chronomètre n'est pas actif");
      }

      const somPauses = await tx.timerPause.aggregate({
        where: { seanceId: safeTimerRunner.data.seanceId },
        _sum: {
          pauseDurationMs: true,
        },
      });

      const chrono =
        safeTimerRunner.data.endedAt.getTime() -
        searchSeance?.startedAt?.getTime();

      const result = chrono - (somPauses._sum.pauseDurationMs ?? 0);

      return tx.timerRunner.create({
        data: {
          numberRunner: safeTimerRunner.data.numberRunner,
          endedAt: safeTimerRunner.data.endedAt,
          seanceId: safeTimerRunner.data.seanceId,
          duration: result,
          userId: userId,
        },
      });
    });
    return NextResponse.json(timerRunner, { status: 201 });
  } catch (err) {
    if (err instanceof HttpError) {
      return NextResponse.json(
        { message: err.message },
        { status: err.status },
      );
    }

    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2002") {
        return Response.json(
          { message: "Le coureurs est déjà enregistré" },
          { status: 409 },
        );
      }
    }
    console.error("Erreur du POST API/TIMERSESSION", err);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}
