import getUserIdFromRequest from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getUserIdFromRequest(req);

  if (!userId) {
    return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const timerRunnerSearch = await prisma.timerRunner.findUnique({
      where: {
        id: id,
        userId: userId,
      },
    });

    if (!timerRunnerSearch) {
      return Response.json({ message: "Coureur introuvable" }, { status: 404 });
    }

    return NextResponse.json(timerRunnerSearch, { status: 200 });
  } catch (err) {
    console.error("Erreur du GET API/TIMERSESSION", id, err);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getUserIdFromRequest(req);

  if (!userId) {
    return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const deleteTimerRunner = await prisma.timerRunner.delete({
      where: {
        id: id,
        userId: userId,
      },
    });

    if (!deleteTimerRunner) {
      return NextResponse.json(
        { message: "Coureur introuvable" },
        { status: 404 },
      );
    }

    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error({ err }, { status: 500 });
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}
