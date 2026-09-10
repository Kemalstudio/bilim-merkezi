-- CreateEnum
CREATE TYPE "public"."DiscountType" AS ENUM ('PERCENT', 'FIXED');

-- AlterTable
ALTER TABLE "public"."courses" ADD COLUMN     "startDate" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN     "phone" TEXT;

-- CreateTable
CREATE TABLE "public"."enrollment_applications" (
    "id" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "patronymic" TEXT,
    "birthDate" TIMESTAMP(3) NOT NULL,
    "documentNumber" TEXT NOT NULL,
    "documentFile" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "enrollmentId" TEXT NOT NULL,

    CONSTRAINT "enrollment_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."exam_results" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "studentName" TEXT NOT NULL,
    "examName" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "maxScore" INTEGER NOT NULL,
    "examDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "courseId" TEXT,

    CONSTRAINT "exam_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."library_resources" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSizeKb" INTEGER,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "courseId" TEXT,

    CONSTRAINT "library_resources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."promo_codes" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "discountType" "public"."DiscountType" NOT NULL,
    "discountValue" DECIMAL(10,2) NOT NULL,
    "maxUses" INTEGER,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "promo_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."promo_redemptions" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "promoCodeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "paymentId" TEXT,

    CONSTRAINT "promo_redemptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "enrollment_applications_enrollmentId_key" ON "public"."enrollment_applications"("enrollmentId" ASC);

-- CreateIndex
CREATE INDEX "exam_results_phone_idx" ON "public"."exam_results"("phone" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "promo_codes_code_key" ON "public"."promo_codes"("code" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "promo_redemptions_paymentId_key" ON "public"."promo_redemptions"("paymentId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "public"."users"("phone" ASC);

-- AddForeignKey
ALTER TABLE "public"."enrollment_applications" ADD CONSTRAINT "enrollment_applications_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "public"."enrollments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."exam_results" ADD CONSTRAINT "exam_results_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "public"."courses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."library_resources" ADD CONSTRAINT "library_resources_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "public"."courses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."promo_redemptions" ADD CONSTRAINT "promo_redemptions_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "public"."payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."promo_redemptions" ADD CONSTRAINT "promo_redemptions_promoCodeId_fkey" FOREIGN KEY ("promoCodeId") REFERENCES "public"."promo_codes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."promo_redemptions" ADD CONSTRAINT "promo_redemptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
