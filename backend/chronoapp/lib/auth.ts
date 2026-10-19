import jwt from "jsonwebtoken";
import { prisma } from "./prisma";
import { z } from "zod";
import { env } from "./env";

export default async function getUserIdFromRequest(
  req: Request,
): Promise<string | null> {
  const PayloadSchema = z.object({
    userId: z.string().min(1),
    tokenVersion: z.number(),
  });

  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.split(" ")[1];

  try {
    const safePayload = PayloadSchema.safeParse(
      jwt.verify(token, env.JWT_SECRET, {
        algorithms: ["HS256"],
      }),
    );

    if (!safePayload.success) return null;

    const controlVersionToken = await prisma.user.findUnique({
      where: { id: safePayload.data.userId },
      select: { tokenVersion: true },
    });

    if (!controlVersionToken) return null;

    if (controlVersionToken.tokenVersion !== safePayload.data.tokenVersion)
      return null;

    return safePayload.data.userId;
  } catch {
    return null;
  }
}
