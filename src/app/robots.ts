import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Private areas: nothing there is useful in search results.
      disallow: ["/account", "/bilim/admin", "/api/"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
