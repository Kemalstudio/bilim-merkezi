---
name: seo
description: Audit and improve technical, on-page, and structured-data SEO for the Bilim Merkezi Next.js course-platform app. Use when adding pages/routes, reviewing metadata, generating sitemap/robots, adding JSON-LD for courses or reviews, checking Core Web Vitals, or being asked to improve Google ranking for this site.
---

# SEO for Bilim Merkezi

Bilim Merkezi is a Next.js (App Router) course-marketplace: courses, enrollments,
Stripe payments, reviews, RU-language UI (`src/app/layout.tsx` sets `lang="ru"`).
Treat SEO as three layers — technical crawlability, structured data, and content —
and fix them in that order; structured data and content are wasted if pages
aren't indexable, and rankings never come from tooling alone.

**Set expectations honestly.** No plugin or skill "makes a site top Google."
Ranking depends on indexable pages, real unique content, page speed, and
backlinks/authority earned over time. Never suggest keyword stuffing, hidden
text, cloaking, doorway pages, or paid link schemes — these get sites
penalized or manually removed from the index. This skill only covers the
legitimate technical/content work that removes obstacles to ranking.

## Current state (check before assuming it's done)

As of the last audit, `src/app/page.tsx` is still the unedited
`create-next-app` boilerplate (Next.js starter copy, Vercel/docs links) even
though `layout.tsx` already declares real metadata (title template + RU
description). A crawler sees a title/description about an online course
platform but body content about deploying Next.js — fix the homepage content
before anything else here matters.

There is no `src/app/sitemap.ts`, `src/app/robots.ts`, or per-route
`generateMetadata`/structured data yet, and no course-listing or course-detail
routes exist under `src/app/` yet (only the Prisma `Course` model exists).

## Metadata (Next.js Metadata API)

- Keep the root `title.template` in `layout.tsx`; give every route its own
  `title` (or `generateMetadata` for dynamic routes) — never let a page
  inherit only the default.
- Set `metadataBase` in root metadata once real domain is known, so relative
  OG/canonical URLs resolve correctly:
  ```ts
  export const metadata: Metadata = {
    metadataBase: new URL("https://bilim-merkezi.kz"), // real prod domain
    alternates: { canonical: "/" },
  };
  ```
- For dynamic course pages, use `generateMetadata` pulling the course's own
  title/description (unique per course — never a shared generic string):
  ```ts
  export async function generateMetadata({ params }): Promise<Metadata> {
    const course = await getCourse(params.slug);
    return {
      title: course.title,
      description: course.shortDescription,
      alternates: { canonical: `/courses/${course.slug}` },
      openGraph: { title: course.title, description: course.shortDescription, images: [course.coverImage] },
    };
  }
  ```
- Avoid duplicate-content traps: if a course is reachable at more than one
  URL (filters, sort params, tracking params), always set `alternates.canonical`
  to the clean URL.

## Sitemap & robots

Add both as route handlers, generated from the DB so new courses are
discoverable without a manual step:

```ts
// src/app/sitemap.ts
import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const courses = await prisma.course.findMany({ select: { slug: true, updatedAt: true } });
  return [
    { url: "https://bilim-merkezi.kz", changeFrequency: "weekly", priority: 1 },
    ...courses.map((c) => ({
      url: `https://bilim-merkezi.kz/courses/${c.slug}`,
      lastModified: c.updatedAt,
      changeFrequency: "weekly" as const,
    })),
  ];
}
```

```ts
// src/app/robots.ts
import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/admin", "/api"] },
    ],
    sitemap: "https://bilim-merkezi.kz/sitemap.xml",
  };
}
```

Disallow `/admin`, `/api`, and any authenticated-only routes so crawl budget
isn't spent on pages that can't be indexed anyway.

## Structured data (JSON-LD)

This app's data model maps directly onto schema.org types Google supports
with rich results — use them, don't invent custom shapes:

- **Course** page → `Course` schema, with `hasCourseInstance` if start dates
  exist, and `aggregateRating`/`review` built from the `Review` model when a
  course has reviews (don't emit a rating with zero reviews — that's a
  structured-data policy violation).
- Site-wide → `Organization` (name, logo, sameAs social links) once in root
  layout.
- Course detail breadcrumbs → `BreadcrumbList`.

Emit via a `<script type="application/ld+json">` in the page/layout, built
from real DB fields — never hardcode example data that could go stale or
mismatch the visible page content (mismatch is the most common reason Google
ignores or penalizes structured data).

## Content SEO

- Every course needs a unique, human-written title and description — no
  templated "Купить курс {название}" boilerplate repeated across courses.
- Use one `<h1>` per page matching the primary topic (course title on course
  pages, page purpose on marketing pages); keep heading levels hierarchical.
- Write for the RU-speaking Kazakhstan/CIS audience the platform already
  targets — natural keyword usage (course subject + "курс", "онлайн обучение",
  city/region if locally targeted), not translated-and-stuffed copy.
- Internal links from homepage/category pages to course pages using
  descriptive anchor text (the course name, not "здесь"/"подробнее").

## Performance / Core Web Vitals

- Already using `next/font` (good — avoids render-blocking font requests) and
  should use `next/image` for every course cover/thumbnail (set `priority`
  only on the actual LCP image, not every image on the page).
- Course list/catalog pages: paginate or virtualize rather than rendering
  every course row-by-row client-side; prefer server components for anything
  that doesn't need interactivity.
- Run `npx next build` and check the build output's route sizes; investigate
  any route pulling in unexpectedly large client bundles.

## When asked to "improve SEO" or "get to top of Google"

1. Confirm the page(s) in question return real content to an unauthenticated
   crawler (no login wall, no client-only render of the primary content).
2. Check metadata/canonical/sitemap coverage for those routes using the
   patterns above.
3. Check structured data matches visible content exactly.
4. Only then talk about content depth/quality and backlinks — and be clear
   these are ongoing work, not a one-time fix.
