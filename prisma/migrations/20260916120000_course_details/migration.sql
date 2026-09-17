-- AlterTable
ALTER TABLE "courses" ADD COLUMN     "ageMax" INTEGER,
ADD COLUMN     "ageMin" INTEGER,
ADD COLUMN     "audience" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "certificate" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "groupSize" INTEGER,
ADD COLUMN     "levelCode" TEXT,
ADD COLUMN     "outcomes" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "requirements" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "teachingLanguage" TEXT,
ADD COLUMN     "track" TEXT;

-- CreateIndex
CREATE INDEX "courses_track_idx" ON "courses"("track");
