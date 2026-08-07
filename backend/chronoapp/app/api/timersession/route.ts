import getUserIdFromRequest from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

import { TimerSessionSchema } from "@/lib/schema/timersessionSchema";

export async function GET(req: Request) {
  const userId = getUserIdFromRequest(req);
  const seanceId = await req.json();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const timerSessionSearch = await prisma.timerSession.findUnique({
      where: {
        seanceId: seanceId.data.seanceId,
      },
    });

    return NextResponse.json({ timerSessionSearch }, { status: 201 });
  } catch (err) {
    console.error("Erreur du GET API/TIMERSESSION", err);
    return NextResponse.json(
      { error: "Erreur d'enregistrement en BDD sur timerSession" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  const userId = getUserIdFromRequest(req);

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const valuePost = await req.json();

  const safeTimerSession = TimerSessionSchema.safeParse(req);

  if (!safeTimerSession.success) {
    return NextResponse.json(
      { error: "Erreur du contrôle ZOD API/TIMERSESSION" },
      { status: 401 },
    );
  }

  try {
    const newTimerSession = await prisma.timerSession.create({
      data: {
        numberRunner: safeTimerSession.data?.numberRunner,
        startedAt: safeTimerSession.data?.startedAt,
        seanceId: safeTimerSession.data?.seanceId,
      },
    });

    return NextResponse.json({ newTimerSession }, { status: 201 });
  } catch (err) {
    console.error("Erreur du POST API/TIMERSESSION", err);
    return NextResponse.json(
      { error: "Erreur du POST API/SESSION" },
      { status: 500 },
    );
  }
}
