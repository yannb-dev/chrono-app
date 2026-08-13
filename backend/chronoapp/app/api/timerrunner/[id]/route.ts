import getUserIdFromRequest from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = getUserIdFromRequest(req);

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const timerSessionSearch = await prisma.timerRunner.findUnique({
      where: {
        seanceId: id,
      },
    });

    return NextResponse.json(timerSessionSearch, { status: 201 });
  } catch (err) {
    console.error("Erreur du GET API/TIMERSESSION", id, err);
    return NextResponse.json(
      { error: "Erreur du GET API/TIMERSESSION" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = getUserIdFromRequest(req);

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const deleteSession = await prisma.timerRunner.delete({
      where: {
        id: id,
      },
    });

    return NextResponse.json(deleteSession, { status: 201 });
  } catch (err) {
    console.error({ err }, { status: 500 });
    return NextResponse.json(
      { error: "Erreur DELETE timersession" },
      { status: 500 },
    );
  }
}
