"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, LayoutDashboard, Settings, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/account", label: "Обзор", icon: LayoutDashboard },
  { href: "/account/children", label: "Мои дети", icon: Users },
  { href: "/account/enrollments", label: "Курсы", icon: BookOpen },
  { href: "/account/settings", label: "Настройки", icon: Settings },
];

export function AccountSidebar() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-2 overflow-x-auto pb-2 lg:w-60 lg:shrink-0 lg:flex-col lg:overflow-visible lg:rounded-[1.3rem] lg:border lg:border-border lg:bg-surface lg:p-3 lg:pb-3 lg:self-start">
      {links.map((link) => {
        const isActive = link.href === "/account" ? pathname === "/account" : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "flex shrink-0 items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-bold transition-colors",
              isActive ? "bg-accent text-[#0b2233]" : "text-ink-soft hover:bg-surface-sunken/60"
            )}
          >
            <link.icon className="h-4 w-4" /> {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
