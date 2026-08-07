import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  const { email, password } = await req.json();

  const userSearch = await prisma.user.findUnique({
    where: { email: email },
  });

  if (!userSearch || !(await bcrypt.compare(password, userSearch.password))) {
    return NextResponse.json(
      { error: "Identifications invalides" },
      { status: 401 },
    );
  }

  const token = jwt.sign({ userId: userSearch.id }, process.env.JWT_SECRET!, {
    expiresIn: "7d",
  });

  return NextResponse.json({ token });
}
