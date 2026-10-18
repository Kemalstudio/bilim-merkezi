import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { ExamResultForm } from "@/components/admin/exam-result-form";
import { ExamResultTable } from "@/components/admin/exam-result-table";

export const metadata: Metadata = { title: "Баллы учеников" };

export default async function AdminResultsPage() {
  const [enrollments, results] = await Promise.all([
    // Only children who actually study a course can get a score for it.
    prisma.enrollment.findMany({
      where: { status: "ACTIVE", childId: { not: null } },
      orderBy: [{ course: { title: "asc" } }, { child: { lastName: "asc" } }],
      select: {
        id: true,
        course: { select: { id: true, title: true } },
        child: { select: { firstName: true, lastName: true } },
      },
    }),
    prisma.examResult.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        studentName: true,
        examName: true,
        score: true,
        maxScore: true,
        examDate: true,
        createdAt: true,
        course: { select: { title: true } },
      },
    }),
  ]);

  const students = enrollments.map((e) => ({
    enrollmentId: e.id,
    courseId: e.course.id,
    courseTitle: e.course.title,
    childName: `${e.child!.firstName} ${e.child!.lastName}`,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-[-0.04em] text-ink">Баллы учеников</h1>
        <p className="mt-1 text-muted">
          Результаты контрольных и экзаменов. Родитель увидит их в кабинете и получит уведомление в приложении.
        </p>
      </div>
      <ExamResultForm students={students} />
      <ExamResultTable
        results={results.map((r) => ({
          id: r.id,
          studentName: r.studentName,
          examName: r.examName,
          score: r.score,
          maxScore: r.maxScore,
          examDate: r.examDate,
          courseTitle: r.course?.title ?? null,
        }))}
      />
    </div>
  );
}
