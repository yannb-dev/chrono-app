import getUserIdFromRequest from "@/lib/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

import { SeanceUpdateSchema } from "@/lib/schema/seanceSchema";

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
    const seance = await prisma.seance.findUnique({
      where: { id: id, userId: userId },
      include: { timerRunners: true, timerpauses: true },
    });

    return NextResponse.json(seance, { status: 200 });
  } catch (err) {
    console.error("Erreur du GET API/SEANCE", err);
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
    const deleteSeance = await prisma.seance.delete({
      where: {
        id: id,
        userId: userId,
      },
    });

    return NextResponse.json(deleteSeance, { status: 200 });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2025") {
        return Response.json(
          { message: "Séance introuvable" },
          { status: 404 },
        );
      }
    }

    console.error({ err }, { status: 500 });
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

  const patchSchema = SeanceUpdateSchema.partial().refine(
    (data) => Object.keys(data).length > 0,
    { message: "Au moins un cham doit être fourni" },
  );

  const safeValuePatch = patchSchema.safeParse(valuePatch);

  if (!safeValuePatch.success) {
    return NextResponse.json(
      { message: "Erreur de soumission" },
      { status: 400 },
    );
  }

  try {
    const udpateSeance = await prisma.seance.update({
      where: { id, userId: userId },
      data: safeValuePatch.data,
    });

    return NextResponse.json(udpateSeance, { status: 200 });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2025") {
        return Response.json(
          { message: "Séance introuvable" },
          { status: 404 },
        );
      }
    }

    console.error("Erreur API/PATCH/SEANCE", err);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}
