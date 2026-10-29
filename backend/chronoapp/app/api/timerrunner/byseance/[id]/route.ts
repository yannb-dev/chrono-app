import getUserIdFromRequest from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

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
    const { count } = await prisma.timerRunner.deleteMany({
      where: {
        seanceId: id,
        userId: userId,
      },
    });

    // if (count === 0) {
    //   return NextResponse.json(
    //     { message: "Coureurs introuvables" },
    //     { status: 404 },
    //   );
    // }

    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error({ err }, { status: 500 });
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}
