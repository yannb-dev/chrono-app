import jwt from "jsonwebtoken";
import { prisma } from "./prisma";

export default async function getUserIdFromRequest(
  req: Request,
): Promise<string | null> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.split(" ")[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
      tokenVersion: number;
    };

    const controlVersionToken = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { tokenVersion: true },
    });

    if (!controlVersionToken) return null;

    if (controlVersionToken.tokenVersion !== payload.tokenVersion) return null;

    return payload.userId;
  } catch {
    return null;
  }
}
