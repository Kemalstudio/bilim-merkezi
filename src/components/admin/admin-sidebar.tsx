"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, BookOpen, ClipboardList, LayoutDashboard, Library, Tag, Users } from "lucide-react";
import type { Role } from "@prisma/client";
import { cn } from "@/lib/utils";

export function AdminSidebar({ role }: { role: Role }) {
  const pathname = usePathname();

  const links = [
    { href: "/admin", label: "Дашборд", icon: LayoutDashboard, exact: true },
    { href: "/admin/courses", label: "Курсы", icon: BookOpen },
    { href: "/admin/library", label: "Библиотека", icon: Library },
    { href: "/admin/enrollments", label: "Записи", icon: BarChart3 },
    { href: "/admin/promo-codes", label: "Промокоды", icon: Tag },
    ...(role === "ADMIN" ? [{ href: "/admin/users", label: "Пользователи", icon: Users }] : []),
    { href: "/admin/audit-log", label: "Журнал действий", icon: ClipboardList },
  ];

  return (
    <nav className="flex gap-2 overflow-x-auto pb-2 lg:w-56 lg:shrink-0 lg:flex-col lg:overflow-visible lg:pb-0">
      {links.map((link) => {
        const isActive = link.exact ? pathname === link.href : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "flex shrink-0 items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors",
              isActive ? "bg-surface-sunken text-brand-ink" : "text-ink-soft hover:bg-surface-sunken/60"
            )}
          >
            <link.icon className="h-4 w-4" /> {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
