import getUserIdFromRequest from "@/lib/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

import { SeanceUpdateSchema } from "@/lib/schema/seanceSchema";

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
    const deleteSeance = await prisma.seance.delete({
      where: {
        id: id,
        userId: userId,
      },
    });

    return NextResponse.json(deleteSeance, { status: 200 });
  } catch (err) {
    console.error({ err }, { status: 500 });
    return NextResponse.json(
      { error: "Erreur DELETE seance" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = getUserIdFromRequest(req);

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const valuePatch = await req.json();

  const safeValuePatch = SeanceUpdateSchema.safeParse(valuePatch);

  if (!safeValuePatch.success) {
    return NextResponse.json(
      { error: "Erreur du contrôle Zod API/PATCH/SEANCE" },
      { status: 401 },
    );
  }

  try {
    const udpateSeance = await prisma.seance.update({
      where: { id },
      data: {
        startedAt: safeValuePatch.data.startedAt,
      },
    });

    return NextResponse.json(udpateSeance, { status: 200 });
  } catch (err) {
    console.error("Erreur API/PATCH/SEANCE", err);
    return NextResponse.json(
      { error: "Erreur PATCH API/SEANCE" },
      { status: 500 },
    );
  }
}
