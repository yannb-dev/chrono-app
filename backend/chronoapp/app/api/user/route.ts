import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import getUserIdFromRequest from "@/lib/auth";
import bcrypt from "bcryptjs";

import {
  DeleteControlUserPasswordSchema,
  DeleteControlUserEmailPasswordSchema,
} from "@/lib/schema/deleteSchema";

export async function DELETE(req: Request) {
  const userId = await getUserIdFromRequest(req);
  const body = await req.json();

  if (userId) {
    const safeValue = DeleteControlUserPasswordSchema.safeParse(body.value);
    if (!safeValue.success) {
      return NextResponse.json(
        { message: "Format non conforme" },
        { status: 400 },
      );
    }

    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (user) {
        const control = await bcrypt.compare(
          safeValue.data.password,
          user.password,
        );

        if (!control) {
          return NextResponse.json(
            { message: "Mot de passe incorrect" },
            { status: 403 },
          );
        }
        await prisma.user.delete({
          where: { id: user.id, email: user.email },
        });
      }

      return new NextResponse(null, { status: 204 });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        if (err.code === "P2025") {
          return Response.json(
            { message: "Utilisateur introuvable" },
            { status: 404 },
          );
        }
      }

      console.error("Erreur du POST API/USER/DELETE", err);
      return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
    }
  } else {
    const safeValue = DeleteControlUserEmailPasswordSchema.safeParse(
      body.value,
    );
    if (!safeValue.success) {
      return NextResponse.json(
        { message: "Format non conforme" },
        { status: 400 },
      );
    }

    try {
      const user = await prisma.user.findUnique({
        where: { email: safeValue.data.email },
      });

      if (!user) {
        return NextResponse.json(
          { message: "Utilisateur introuvable" },
          { status: 404 },
        );
      }
      const control = await bcrypt.compare(
        safeValue.data.password,
        user.password,
      );

      if (!control) {
        return NextResponse.json(
          { message: "Mot de passe incorrect" },
          { status: 403 },
        );
      }
      await prisma.user.delete({
        where: { id: user.id, email: user.email },
      });

      return new NextResponse(null, { status: 204 });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        if (err.code === "P2025") {
          return NextResponse.json(
            { message: "Utilisateur introuvable" },
            { status: 404 },
          );
        }
      }

      console.error("Erreur du POST API/USER/DELETE", err);
      return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
    }
  }
}
