import type { Metadata } from "next";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/rbac";
import { AdminNav } from "@/components/admin/admin-nav";
import { ThemeToggle } from "@/components/shared/theme-toggle";

export const metadata: Metadata = {
  title: { default: "Админ-панель", template: "%s · Админ-панель Bilim" },
  robots: { index: false, follow: false },
};

export default async function AdminPanelLayout({ children }: Readonly<{ children: ReactNode }>) {
  const user = await getCurrentUser();
  // The proxy already turns strangers away; this also covers a role changed mid-session.
  if (!user || (user.role !== "ADMIN" && user.role !== "MODERATOR")) redirect("/bilim/admin/login");

  const today = new Intl.DateTimeFormat("ru-RU", { weekday: "long", day: "numeric", month: "long" }).format(new Date());

  return (
    <div className="min-h-screen w-full bg-background lg:grid lg:grid-cols-[17rem_minmax(0,1fr)] lg:gap-3 lg:p-3">
      <AdminNav user={{ name: user.name, email: user.email, role: user.role }} />
      <div className="flex min-w-0 flex-col">
        <div className="flex items-center justify-end gap-2 px-4 pt-4 sm:px-6 lg:px-8 lg:pt-5">
          <span className="mr-auto hidden text-sm first-letter:uppercase text-muted sm:block">{today}</span>
          <ThemeToggle />
        </div>
        <main className="flex-1 px-4 pb-10 pt-4 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
