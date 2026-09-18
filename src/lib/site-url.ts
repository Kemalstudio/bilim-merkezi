/** Public origin of the site without a trailing slash, for absolute links (sitemap, JSON-LD). */
export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/+$/, "");
