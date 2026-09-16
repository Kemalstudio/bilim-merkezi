"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type NavLabels = { home: string; courses: string; library: string; about: string; contact: string };

export function NavLinks({
  labels,
  className,
  onNavigate,
}: {
  labels: NavLabels;
  className?: string;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const links = [
    { href: "/", label: labels.home },
    { href: "/courses", label: labels.courses },
    { href: "/library", label: labels.library },
    { href: "/about", label: labels.about },
    { href: "/contact", label: labels.contact },
  ];

  return (
    <nav className={cn("flex items-center gap-0.5", className)}>
      {links.map((link) => {
        const isActive = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNavigate}
            className={cn(
              "group relative rounded-xl px-3.5 py-2 text-[0.82rem] font-bold transition-colors",
              isActive ? "bg-surface-sunken text-ink" : "text-ink-soft hover:bg-surface/70 hover:text-ink"
            )}
          >
            {link.label}
            <span
              className={cn(
                "pointer-events-none absolute inset-x-3.5 bottom-0.5 h-0.5 origin-left scale-x-0 rounded-full bg-accent-deep transition-transform duration-300 ease-out group-hover:scale-x-100",
                isActive && "hidden"
              )}
            />
          </Link>
        );
      })}
    </nav>
  );
}
