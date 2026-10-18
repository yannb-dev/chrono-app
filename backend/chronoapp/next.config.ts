import type { NextConfig } from "next";

// Appliqués à toutes les routes
const globalHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=300" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
];

// Durcissement pour les pages sensibles
const sensitiveHeaders = [
  { key: "Referrer-Policy", value: "no-referrer" },
  { key: "Cache-Control", value: "no-store" },
];

const nextConfig: NextConfig = {
  reactCompiler: true,
  async headers() {
    return [
      { source: "/(.*)", headers: globalHeaders },
      { source: "/reset/:path*", headers: sensitiveHeaders },
      { source: "/delete-user/:path*", headers: sensitiveHeaders },
    ];
  },
};

export default nextConfig;
