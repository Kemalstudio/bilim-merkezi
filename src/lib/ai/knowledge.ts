import "server-only";

import { prisma } from "@/lib/prisma";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getContacts } from "@/lib/site-settings";
import { buildIndex, type SearchIndex } from "@/lib/ai/retrieval";

/*
 * What the assistant knows: the published catalogue, the FAQ in the visitor's language and the
 * centre's contacts. Everything comes from the database and the site's own texts, so an admin
 * edit reaches the assistant within the cache window without any retraining.
 */

export type CourseFact = {
  slug: string;
  title: string;
  summary: string;
  category: string;
  categorySlug: string;
  level: string;
  levelCode: string | null;
  ageMin: number | null;
  ageMax: number | null;
  lessonsPerWeek: number;
  weeklyHoursMin: number;
  weeklyHoursMax: number;
  weeks: number;
  price: number;
  discountPrice: number | null;
  startDate: string | null;
  certificate: boolean;
  groupSize: number | null;
  skills: string[];
  outcomes: string[];
  audience: string[];
  moduleTitles: string[];
  rating: number;
  reviewCount: number;
  enrollments: number;
};

export type FaqFact = { q: string; a: string };

export type Contacts = { address: string; phone: string; email: string; hours?: string | null };

export type Knowledge = {
  courses: CourseFact[];
  courseIndex: SearchIndex<CourseFact>;
  faq: FaqFact[];
  faqIndex: SearchIndex<FaqFact>;
  contacts: Contacts;
};

const TTL_MS = 5 * 60_000;
let coursesCache: { at: number; courses: CourseFact[] } | null = null;
const localeCache = new Map<Locale, { at: number; knowledge: Knowledge }>();

async function loadCourses(): Promise<CourseFact[]> {
  if (coursesCache && Date.now() - coursesCache.at < TTL_MS) return coursesCache.courses;

  const rows = await prisma.course.findMany({
    where: { published: true },
    include: {
      category: { select: { name: true, slug: true } },
      modules: { select: { title: true }, orderBy: { position: "asc" } },
      reviews: { select: { rating: true } },
      _count: { select: { enrollments: true } },
    },
  });

  const courses = rows.map((row) => ({
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    category: row.category.name,
    categorySlug: row.category.slug,
    level: row.level,
    levelCode: row.levelCode,
    ageMin: row.ageMin,
    ageMax: row.ageMax,
    lessonsPerWeek: row.lessonsPerWeek,
    weeklyHoursMin: row.weeklyHoursMin,
    weeklyHoursMax: row.weeklyHoursMax,
    weeks: row.modules.length,
    price: Number(row.price),
    discountPrice: row.discountPrice == null ? null : Number(row.discountPrice),
    startDate: row.startDate?.toISOString() ?? null,
    certificate: row.certificate,
    groupSize: row.groupSize,
    skills: row.skills,
    outcomes: row.outcomes,
    audience: row.audience,
    moduleTitles: row.modules.map((module) => module.title),
    rating: row.reviews.length ? row.reviews.reduce((sum, review) => sum + review.rating, 0) / row.reviews.length : 0,
    reviewCount: row.reviews.length,
    enrollments: row._count.enrollments,
  }));

  coursesCache = { at: Date.now(), courses };
  return courses;
}

export async function getKnowledge(locale: Locale): Promise<Knowledge> {
  const cached = localeCache.get(locale);
  if (cached && Date.now() - cached.at < TTL_MS && coursesCache && cached.at >= coursesCache.at) {
    return cached.knowledge;
  }

  const [courses, dict, contacts] = await Promise.all([loadCourses(), getDictionary(locale), getContacts()]);

  const courseIndex = buildIndex(courses, (course) => [
    [course.title, 4],
    [course.category, 3],
    [course.summary, 2],
    [course.skills.join(" "), 2],
    [course.outcomes.join(" "), 1],
    [course.audience.join(" "), 1],
    [course.moduleTitles.join(" "), 1],
  ]);

  const faq = dict.faq.items.map((item) => ({ q: item.q, a: item.a }));
  const faqIndex = buildIndex(faq, (item) => [
    [item.q, 3],
    [item.a, 1],
  ]);

  const knowledge = { courses, courseIndex, faq, faqIndex, contacts };
  localeCache.set(locale, { at: Date.now(), knowledge });
  return knowledge;
}

/** Drops cached knowledge, e.g. after a course is edited in the admin panel. */
export function invalidateKnowledge() {
  coursesCache = null;
  localeCache.clear();
}
