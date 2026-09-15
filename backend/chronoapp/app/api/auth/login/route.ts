import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

import { LoginSchema } from "@/lib/schema/loginSchema";

export async function POST(req: Request) {
  const value = await req.json();

  const safeValue = LoginSchema.safeParse(value);

  if (!safeValue.success) {
    return NextResponse.json(
      { message: "Format de l'email ou du mot de passe non conformes" },
      { status: 400 },
    );
  }

  try {
    const userSearch = await prisma.user.findUnique({
      where: { email: safeValue.data?.email },
    });

    if (
      !userSearch ||
      !(await bcrypt.compare(safeValue.data.password, userSearch.password))
    ) {
      return NextResponse.json(
        { message: "Identifications invalides" },
        { status: 401 },
      );
    }

    const token = jwt.sign({ userId: userSearch.id }, process.env.JWT_SECRET!, {
      expiresIn: "7d",
    });

    return NextResponse.json({ token });
  } catch (err) {
    console.error("Erreur du POST API/LOGIN", err);
    return NextResponse.json({ message: "Erreur Serveur" }, { status: 500 });
  }
}
