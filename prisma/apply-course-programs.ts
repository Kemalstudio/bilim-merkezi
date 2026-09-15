/**
 * Replaces the programme of every catalogue course found in prisma/course-programs.ts with its
 * week-by-week version and sets the weekly format (3 lessons, 15–20 hours). Courses that are
 * not in the file are left untouched, and so are start dates that are already set.
 *
 * Run: npm run courses:programs
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { coursePrograms, PROGRAM_FORMAT, programDurationHours } from "./course-programs";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

/** Next Monday after today, then one week apart per course, so the catalogue has upcoming starts. */
function upcomingMonday(offsetWeeks: number) {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  const daysToMonday = (8 - date.getUTCDay()) % 7 || 7;
  date.setUTCDate(date.getUTCDate() + daysToMonday + offsetWeeks * 7);
  return date;
}

async function main() {
  const courses = await prisma.course.findMany({ select: { id: true, slug: true, startDate: true }, orderBy: { createdAt: "asc" } });
  let updated = 0;

  for (const [index, course] of courses.entries()) {
    const weeks = coursePrograms[course.slug];
    if (!weeks) {
      console.log(`skip  ${course.slug} (no programme in course-programs.ts)`);
      continue;
    }

    await prisma.$transaction(async (tx) => {
      await tx.lesson.deleteMany({ where: { module: { courseId: course.id } } });
      await tx.courseModule.deleteMany({ where: { courseId: course.id } });
      await tx.course.update({
        where: { id: course.id },
        data: {
          ...PROGRAM_FORMAT,
          durationHours: programDurationHours(weeks.length),
          startDate: course.startDate ?? upcomingMonday(index % 5),
          modules: {
            create: weeks.map((week, position) => ({
              title: week.title,
              goal: week.goal,
              position,
              lessons: {
                create: week.lessons.map((lesson, lessonPosition) => ({
                  title: lesson.title,
                  durationMin: lesson.durationMin,
                  topics: lesson.topics,
                  position: lessonPosition,
                })),
              },
            })),
          },
        },
      });
    });

    updated++;
    console.log(`done  ${course.slug}: ${weeks.length} weeks × ${PROGRAM_FORMAT.lessonsPerWeek} lessons`);
  }

  console.log(`\n${updated} of ${courses.length} courses updated`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
