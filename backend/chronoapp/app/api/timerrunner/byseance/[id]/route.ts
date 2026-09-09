import getUserIdFromRequest from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

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
    const deleteAllTimerRunner = await prisma.timerRunner.deleteMany({
      where: {
        seanceId: id,
        userId: userId,
      },
    });

    return NextResponse.json(deleteAllTimerRunner, { status: 200 });
  } catch (err) {
    console.error({ err }, { status: 500 });
    return NextResponse.json(
      { error: "Erreur DELETE ALL timersession" },
      { status: 500 },
    );
  }
}
