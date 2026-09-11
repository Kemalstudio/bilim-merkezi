import type { ReactNode } from "react";
import { requireRole } from "@/lib/rbac";
import { AdminHeader } from "@/components/admin/admin-header";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

export default async function AdminLayout({ children }: Readonly<{ children: ReactNode }>) {
  const user = await requireRole("ADMIN", "MODERATOR");

  return (
    <div className="flex min-h-screen flex-col bg-surface-sunken/40">
      <AdminHeader user={user} />
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 lg:flex-row lg:px-8">
        <AdminSidebar role={user.role} />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
