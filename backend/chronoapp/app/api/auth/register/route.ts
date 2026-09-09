// app/api/auth/register/route.ts
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

import { RegisterSchema } from "@/lib/schema/registerSchema";

export async function POST(req: Request) {
  const data = await req.json();

  const safeData = RegisterSchema.safeParse(data);

  if (!safeData.success) {
    console.error(safeData.error, "Erreur du contrôle Zod sur register");
    return NextResponse.json(
      { error: safeData.error.flatten() },
      { status: 400 },
    );
  }
  const existingUser = await prisma.user.findUnique({
    where: { email: safeData.data.email },
  });
  if (existingUser) {
    return NextResponse.json(
      { error: "Cet email est déjà utilisé" },
      { status: 409 },
    );
  }

  try {
    const hashedPassword = await bcrypt.hash(safeData.data.password, 10);

    const user = await prisma.user.create({
      data: { email: safeData.data.email, password: hashedPassword },
    });

    if (user)
      return NextResponse.json(
        { id: user.id, email: user.email },
        { status: 201 },
      );
  } catch (error) {
    console.error("Erreur du fetch API/REGISTER", error);
    return NextResponse.json({ error: error }, { status: 400 });
  }
}
