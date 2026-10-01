import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import getUserIdFromRequest from "@/lib/auth";

export async function DELETE(req: Request) {
  const userId = await getUserIdFromRequest(req);

  if (!userId) {
    return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
  }

  try {
    const userDelete = await prisma.user.delete({
      where: { id: userId },
    });

    return NextResponse.json({ status: 204 });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2025") {
        return Response.json({ message: "User introuvable" }, { status: 404 });
      }
    }

    console.error("Erreur du POST API/USER/DELETE", err);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}
