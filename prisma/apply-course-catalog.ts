/**
 * Brings an existing database up to the current catalogue without a reseed: adds the categories
 * and courses from prisma/new-courses.ts that are missing, and fills in the details (results,
 * skills, requirements, age, group) of courses that have none yet. Courses whose details were
 * already edited in the admin panel are left untouched.
 *
 * Run: npm run courses:catalog
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { courseDetails, courseDetailsData } from "./course-details";
import { extraCategories, newCourseData, newCourses } from "./new-courses";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

async function main() {
  for (const category of extraCategories) {
    await prisma.category.upsert({ where: { slug: category.slug }, update: {}, create: category });
  }
  const categories = new Map((await prisma.category.findMany()).map((category) => [category.slug, category.id]));

  let created = 0;
  for (const course of newCourses) {
    if (await prisma.course.findUnique({ where: { slug: course.slug }, select: { id: true } })) {
      console.log(`skip  ${course.slug} (already exists)`);
      continue;
    }
    await prisma.course.create({ data: newCourseData(course, categories.get(course.categorySlug)!) });
    created++;
    console.log(`add   ${course.slug}`);
  }

  let detailed = 0;
  for (const [slug, details] of Object.entries(courseDetails)) {
    const { count } = await prisma.course.updateMany({
      where: { slug, outcomes: { isEmpty: true } },
      data: courseDetailsData(details),
    });
    if (count > 0) {
      detailed++;
      console.log(`info  ${slug}`);
    }
  }

  console.log(`\n${created} courses added, ${detailed} courses got their details`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
