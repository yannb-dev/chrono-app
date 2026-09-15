import getUserIdFromRequest from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

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
    const timerSessionSearch = await prisma.timerRunner.findUnique({
      where: {
        id: id,
        userId: userId,
      },
    });

    return NextResponse.json(timerSessionSearch, { status: 200 });
  } catch (err) {
    console.error("Erreur du GET API/TIMERSESSION", id, err);
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
    await prisma.timerRunner.delete({
      where: {
        id: id,
        userId: userId,
      },
    });

    return NextResponse.json({ status: 204 });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2025") {
        return Response.json(
          { message: "Article introuvable" },
          { status: 404 },
        );
      }
    }
    console.error({ err }, { status: 500 });
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}
