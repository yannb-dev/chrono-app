import getUserIdFromRequest from "@/lib/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

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
    const seance = await prisma.seance.findUnique({
      where: { id, userId },
    });

    if (!seance) {
      return NextResponse.json(
        { message: "Aucune séance à réinitialiser" },
        { status: 404 },
      );
    }

    if (seance?.state === "Finish" && seance.startedAt) {
      return NextResponse.json(
        { message: "La séance est terminé, elle ne peut être modifiée" },
        { status: 409 },
      );
    }
    const resetSeance = await prisma.$transaction(async (tx) => {
      await tx.timerRunner.deleteMany({
        where: {
          seanceId: seance?.id,
          userId: userId,
        },
      });

      await tx.timerPause.deleteMany({
        where: { seanceId: id, userId: userId },
      });

      return tx.seance.update({
        where: { id, userId: userId },
        data: {
          startedAt: null,
          state: "NoStart",
        },
      });
    });

    return NextResponse.json(resetSeance, { status: 200 });
  } catch (err) {
    console.error(err);
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2025") {
        return NextResponse.json(
          { message: "Séance introuvable" },
          { status: 404 },
        );
      }
    }

    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}
