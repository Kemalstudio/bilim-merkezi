import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client", "@prisma/adapter-pg", "pg"],
  // The admin panel moved to /bilim/admin; old bookmarks still land in the right place.
  async redirects() {
    return [
      { source: "/admin", destination: "/bilim/admin", permanent: false },
      { source: "/admin/:path*", destination: "/bilim/admin/:path*", permanent: false },
    ];
  },
};

export default nextConfig;
