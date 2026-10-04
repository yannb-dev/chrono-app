import { ipAddress } from "@vercel/functions";

export default function getClientIp(req: Request) {
  const vercelIp = ipAddress(req);
  if (vercelIp) return vercelIp;

  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded?.split(",")[0].trim();

  return "unknown";
}
