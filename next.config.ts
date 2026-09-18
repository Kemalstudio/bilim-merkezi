import type { NextConfig } from "next";

// Baseline hardening for every response. A full Content-Security-Policy is left out on purpose:
// the theme bootstrap and JSON-LD use inline scripts, so a CSP needs nonces (see
// node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md) before it can be strict.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(self)" },
];

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client", "@prisma/adapter-pg", "pg"],
  poweredByHeader: false,
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // Uploaded library files are offered as downloads rather than rendered in the page's origin.
      {
        source: "/uploads/library/:file*",
        headers: [{ key: "Content-Disposition", value: "attachment" }],
      },
    ];
  },
  // The admin panel moved to /bilim/admin; old bookmarks still land in the right place.
  async redirects() {
    return [
      { source: "/admin", destination: "/bilim/admin", permanent: false },
      { source: "/admin/:path*", destination: "/bilim/admin/:path*", permanent: false },
    ];
  },
};

export default nextConfig;
