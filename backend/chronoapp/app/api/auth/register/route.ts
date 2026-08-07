// app/api/auth/register/route.ts
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  const { email, password } = await req.json();

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return NextResponse.json(
      { error: "Cet email est déjà utilisé" },
      { status: 409 },
    );
  }

  // Hasher le mot de passe avant de le stocker (jamais en clair !)
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: { email, password: hashedPassword },
  });

  return NextResponse.json({ id: user.id, email: user.email }); // ne jamais renvoyer le password
}
