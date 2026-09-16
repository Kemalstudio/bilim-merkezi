"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Role } from "@prisma/client";
import {
  ArrowUpRight,
  Atom,
  BookOpen,
  ClipboardCheck,
  Languages,
  LayoutDashboard,
  LayoutList,
  Library,
  LogOut,
  Menu,
  Phone,
  ScrollText,
  Sparkles,
  Tag,
  TrendingUp,
  Type,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { adminSignOutAction } from "@/actions/admin-auth";
import { cn, initials } from "@/lib/utils";

type NavItem = { href: string; label: string; icon: LucideIcon; exact?: boolean; adminOnly?: boolean };

const NAV: { title: string; items: NavItem[] }[] = [
  { title: "Обзор", items: [{ href: "/bilim/admin", label: "Дашборд", icon: LayoutDashboard, exact: true }] },
  {
    title: "Сайт",
    items: [
      { href: "/bilim/admin/site/sections", label: "Секции главной", icon: LayoutList, adminOnly: true },
      { href: "/bilim/admin/site/texts", label: "Тексты", icon: Type, adminOnly: true },
      { href: "/bilim/admin/site/hero-card", label: "Карточка отчёта", icon: TrendingUp, adminOnly: true },
      { href: "/bilim/admin/site/animations", label: "Анимации", icon: Sparkles, adminOnly: true },
      { href: "/bilim/admin/site/contacts", label: "Контакты", icon: Phone, adminOnly: true },
      { href: "/bilim/admin/site/languages", label: "Языки", icon: Languages, adminOnly: true },
    ],
  },
  {
    title: "Обучение",
    items: [
      { href: "/bilim/admin/courses", label: "Курсы", icon: BookOpen },
      { href: "/bilim/admin/library", label: "Библиотека", icon: Library },
      { href: "/bilim/admin/enrollments", label: "Записи", icon: ClipboardCheck },
    ],
  },
  {
    title: "Люди и продажи",
    items: [
      { href: "/bilim/admin/users", label: "Пользователи", icon: Users, adminOnly: true },
      { href: "/bilim/admin/promo-codes", label: "Промокоды", icon: Tag },
    ],
  },
  { title: "Система", items: [{ href: "/bilim/admin/audit-log", label: "Журнал действий", icon: ScrollText }] },
];

type NavUser = { name?: string | null; email?: string | null; role: Role };

/** The admin sidebar: a deep-water panel like the site's hero, collapsing to a menu on phones. */
export function AdminNav({ user }: { user: NavUser }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const groups = NAV.map((group) => ({
    ...group,
    items: group.items.filter((item) => !item.adminOnly || user.role === "ADMIN"),
  })).filter((group) => group.items.length > 0);

  const isActive = (item: NavItem) =>
    item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);

  return (
    <aside className="paper-noise relative z-40 overflow-hidden bg-panel text-white lg:sticky lg:top-3 lg:flex lg:h-[calc(100vh-1.5rem)] lg:flex-col lg:rounded-[1.8rem]">
      <div aria-hidden className="science-grid pointer-events-none absolute inset-0 opacity-40" />

      <div className="relative flex items-center justify-between gap-3 px-5 py-4 lg:px-6 lg:pb-2 lg:pt-7">
        <Link href="/bilim/admin" onClick={() => setOpen(false)} className="group flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-[0.8rem] bg-accent text-[#0b2233] transition-transform duration-300 group-hover:rotate-6">
            <Atom className="h-5 w-5" strokeWidth={2.25} />
          </span>
          <span className="flex flex-col leading-none">
            <span className="font-display text-[1.05rem] font-extrabold tracking-[-0.04em]">BILIM</span>
            <span className="mt-1 text-[0.55rem] font-bold uppercase tracking-[0.22em] text-accent">админ-панель</span>
          </span>
        </Link>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls="admin-nav"
          aria-label={open ? "Закрыть меню" : "Открыть меню"}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.08] text-white transition-colors hover:bg-white/[0.14] lg:hidden"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <nav
        id="admin-nav"
        aria-label="Разделы админ-панели"
        className={cn("relative flex-1 overflow-y-auto px-3 pb-4 lg:block lg:px-4", open ? "block" : "hidden")}
      >
        {groups.map((group) => (
          <div key={group.title} className="mt-5 first:mt-2">
            <p className="px-3 text-[0.6rem] font-extrabold uppercase tracking-[0.16em] text-white/35">{group.title}</p>
            <ul className="mt-2 space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(item);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition-colors",
                        active ? "bg-white/[0.1] text-white" : "text-white/60 hover:bg-white/[0.05] hover:text-white"
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors",
                          active ? "bg-accent text-[#0b2233]" : "bg-white/[0.06] text-white/70 group-hover:text-white"
                        )}
                      >
                        <item.icon className="h-3.5 w-3.5" />
                      </span>
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className={cn("relative border-t border-white/10 p-4 lg:block", open ? "block" : "hidden")}>
        <Link
          href="/"
          target="_blank"
          className="flex items-center justify-between rounded-xl bg-white/[0.06] px-3 py-2.5 text-sm font-semibold text-white/80 transition-colors hover:bg-white/[0.12] hover:text-white"
        >
          Открыть сайт <ArrowUpRight className="h-4 w-4 text-accent" />
        </Link>
        <div className="mt-3 flex items-center gap-3 px-1">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent font-display text-xs font-bold text-[#0b2233]">
            {initials(user.name || user.email || "A")}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{user.name || "Администратор"}</p>
            <p className="truncate text-xs text-white/45">{user.email}</p>
          </div>
          <form action={adminSignOutAction}>
            <button
              type="submit"
              aria-label="Выйти"
              title="Выйти"
              className="flex h-9 w-9 items-center justify-center rounded-full text-white/60 transition-colors hover:bg-white/[0.1] hover:text-white"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
