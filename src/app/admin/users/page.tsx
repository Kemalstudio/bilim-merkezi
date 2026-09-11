import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { UserTable } from "@/components/admin/user-table";

export const metadata: Metadata = { title: "Пользователи" };

export default async function AdminUsersPage() {
  const currentUser = await requireRole("ADMIN");
  const users = await prisma.user.findMany({
    include: { _count: { select: { enrollments: true } } },
    orderBy: { createdAt: "desc" },
  });

  const rows = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    createdAt: u.createdAt,
    enrollmentCount: u._count.enrollments,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">Пользователи</h1>
        <p className="mt-1 text-muted">Управление ролями пользователей платформы</p>
      </div>
      <UserTable users={rows} currentUserId={currentUser.id} />
    </div>
  );
}
