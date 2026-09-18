"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, LayoutDashboard, Settings, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/components/i18n-provider";

const links = [
  { href: "/account", key: "overview", icon: LayoutDashboard },
  { href: "/account/children", key: "children", icon: Users },
  { href: "/account/enrollments", key: "courses", icon: BookOpen },
  { href: "/account/settings", key: "settings", icon: Settings },
] as const;

export function AccountSidebar() {
  const { t } = useI18n();
  const pathname = usePathname();

  return (
    <nav aria-label={t.account.navLabel} className="flex gap-2 overflow-x-auto pb-2 lg:w-60 lg:shrink-0 lg:flex-col lg:overflow-visible lg:rounded-[1.3rem] lg:border lg:border-border lg:bg-surface lg:p-3 lg:pb-3 lg:self-start">
      {links.map((link) => {
        const isActive = link.href === "/account" ? pathname === "/account" : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "group flex shrink-0 items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-bold transition-colors active:scale-[0.98]",
              isActive ? "bg-accent text-[#0b2233]" : "text-ink-soft hover:bg-surface-sunken/60"
            )}
          >
            <link.icon aria-hidden className="h-4 w-4 group-hover:animate-icon-wiggle" /> {t.account.nav[link.key]}
          </Link>
        );
      })}
    </nav>
  );
}
