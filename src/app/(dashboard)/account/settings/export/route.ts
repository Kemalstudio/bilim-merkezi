import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAction } from "@/lib/audit";
import { rateLimit } from "@/lib/rate-limit";
import { realEmail } from "@/lib/phone";

const noStore = { "Cache-Control": "no-store" };

/**
 * "Download my data": everything the site holds about the signed-in parent, as one JSON file.
 * It is limited to this account — the parent's own details, their children's profiles and results,
 * enrolments, payments and reviews — and never includes password hashes or other people's data.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: noStore });
  const userId = session.user.id;

  if (!(await rateLimit(`export:${userId}`, 5, 60 * 60_000)).success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: noStore });
  }

  const [user, children, enrollments, payments, reviews] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { name: true, email: true, phone: true, createdAt: true },
    }),
    prisma.child.findMany({
      where: { parentId: userId },
      include: { examResults: { include: { course: { select: { title: true } } }, orderBy: { examDate: "asc" } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.enrollment.findMany({
      where: { userId },
      include: { course: { select: { title: true } }, child: { select: { firstName: true, lastName: true } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.payment.findMany({
      where: { userId },
      include: { course: { select: { title: true } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.review.findMany({ where: { userId }, include: { course: { select: { title: true } } } }),
  ]);

  const data = {
    exportedAt: new Date().toISOString(),
    currency: "TMT",
    account: { name: user.name, email: realEmail(user.email), phone: user.phone ? `+${user.phone}` : null, createdAt: user.createdAt },
    children: children.map((child) => ({
      firstName: child.firstName,
      lastName: child.lastName,
      birthDate: child.birthDate,
      grade: child.grade,
      notes: child.notes,
      examResults: child.examResults.map((result) => ({
        exam: result.examName,
        course: result.course?.title ?? null,
        score: result.score,
        maxScore: result.maxScore,
        date: result.examDate,
      })),
    })),
    enrollments: enrollments.map((enrollment) => ({
      course: enrollment.course.title,
      child: enrollment.child ? `${enrollment.child.firstName} ${enrollment.child.lastName}` : null,
      status: enrollment.status,
      createdAt: enrollment.createdAt,
    })),
    payments: payments.map((payment) => ({
      course: payment.course.title,
      amount: Number(payment.amount),
      status: payment.status,
      createdAt: payment.createdAt,
    })),
    reviews: reviews.map((review) => ({
      course: review.course.title,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt,
    })),
  };

  await logAction(userId, "account.data_exported", "user", userId);

  const stamp = new Date().toISOString().slice(0, 10);
  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      ...noStore,
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="bilim-merkezi-my-data-${stamp}.json"`,
    },
  });
}
