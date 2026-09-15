-- AlterTable
ALTER TABLE "course_modules" ADD COLUMN     "goal" TEXT;

-- AlterTable
ALTER TABLE "courses" ADD COLUMN     "lessonsPerWeek" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN     "weeklyHoursMax" INTEGER NOT NULL DEFAULT 20,
ADD COLUMN     "weeklyHoursMin" INTEGER NOT NULL DEFAULT 15;

-- AlterTable
ALTER TABLE "lessons" ADD COLUMN     "topics" TEXT[] DEFAULT ARRAY[]::TEXT[];
