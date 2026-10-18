// proxy.ts (à la racine du projet, ou dans src/)
import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  // 1. Nonce aléatoire, encodée en base64
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const isDev = process.env.NODE_ENV === "development";

  // 2. La CSP contient la nonce
  const csp = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic' ${isDev ? "'unsafe-eval'" : ""};
    style-src 'self' ${isDev ? "'unsafe-inline'" : `'nonce-${nonce}'`};
    img-src 'self' blob: data:;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
  `
    .replace(/\s{2,}/g, " ")
    .trim();

  // 3. On passe nonce et CSP à Next.js via les en-têtes de la REQUÊTE
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  // 4. Et on renvoie la CSP au navigateur dans la RÉPONSE
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

// Uniquement sur les pages sensibles
export const config = {
  matcher: ["/reset/:path*", "/delete-user/:path*"],
};
