import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import getUserIdFromRequest from "@/lib/auth";
import bcrypt from "bcryptjs";

import { DeleteControlUserSchema } from "@/lib/schema/deleteSchema";

export async function DELETE(req: Request) {
  const userId = await getUserIdFromRequest(req);

  if (!userId) {
    return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
  }

  const password = await req.json();

  const safeValue = DeleteControlUserSchema.safeParse(password);

  if (!safeValue.success) {
    return NextResponse.json(
      { message: "Format du mot de passe non conforme" },
      { status: 400 },
    );
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (user) {
      const control = bcrypt.compare(safeValue.data.password, user.password);

      if (!control) {
        return NextResponse.json(
          { message: "Mot de passe incorrect" },
          { status: 403 },
        );
      }
      await prisma.user.delete({
        where: { id: userId },
      });
    }

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
