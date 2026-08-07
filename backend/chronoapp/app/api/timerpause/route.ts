import getUserIdFromRequest from "@/lib/auth";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

import { TimerPauseSchema } from "@/lib/schema/timerPauseSchema";

export async function GET(req: Request) {
  const userId = getUserIdFromRequest(req);
  const valueGet = await req.json();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const timerPause = prisma.timerPause.findUnique({
      where: { seanceId: valueGet.data.timerSessionId },
    });

    return NextResponse.json({ timerPause }, { status: 201 });
  } catch (err) {
    console.error("Erreur du POST API/TIMERPAUSE", err);
    return NextResponse.json({ err }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const userId = getUserIdFromRequest(req);

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const valuePost = await req.json();

  const safeTimerPause = TimerPauseSchema.safeParse(valuePost);

  if (!safeTimerPause.success) {
    console.error("Erreur de contrôle Zod POST API/TIMERPAUSE");
    return NextResponse.json(
      { error: "Erreur de contrôle Zod POST API/POST/TIMERPAUSE" },
      { status: 400 },
    );
  }

  try {
    const newTimerPause = prisma.timerPause.create({
      data: {
        timerSessionId: safeTimerPause.data.timerSessionId,
        pausedAt: safeTimerPause.data.pausedAt,
      },
    });

    return NextResponse.json({ newTimerPause }, { status: 201 });
  } catch (err) {
    console.error("Erreur POST timerPause", err);
    return NextResponse.json(
      { error: "Erreur POST timerPause" },
      { status: 500 },
    );
  }
}
