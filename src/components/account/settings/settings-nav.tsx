"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export type SettingsNavItem = { id: string; label: string };

/**
 * Jump links for the settings sections. A rail beside the content on wide screens, a strip of
 * chips that sticks under the site header on phones. The current section is tracked with an
 * IntersectionObserver, so the highlight follows the scroll without any scroll listener.
 */
export function SettingsNav({ items, label }: { items: SettingsNavItem[]; label: string }) {
  const [active, setActive] = useState(items[0]?.id ?? "");

  useEffect(() => {
    const targets = items
      .map((item) => document.getElementById(item.id))
      .filter((element): element is HTMLElement => element !== null);
    if (targets.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      // A section is "current" once its top passes the upper third of the screen.
      { rootMargin: "-20% 0px -65% 0px", threshold: 0 }
    );
    targets.forEach((target) => observer.observe(target));
    return () => observer.disconnect();
  }, [items]);

  function jump(event: React.MouseEvent<HTMLAnchorElement>, id: string) {
    const target = document.getElementById(id);
    if (!target) return;
    event.preventDefault();
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    target.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
    history.replaceState(null, "", `#${id}`);
    setActive(id);
  }

  return (
    <nav
      aria-label={label}
      className={cn(
        // Phones: a sticky, horizontally scrolling strip that bleeds to the page edges.
        "sticky top-[4.6rem] z-30 -mx-4 flex gap-2 overflow-x-auto bg-background/90 px-4 py-2.5 backdrop-blur-md sm:-mx-6 sm:px-6",
        "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        // Wide screens: a rail that stays in view beside the sections.
        "xl:top-28 xl:z-auto xl:mx-0 xl:w-52 xl:shrink-0 xl:flex-col xl:gap-1 xl:self-start xl:overflow-visible xl:bg-transparent xl:p-0 xl:backdrop-blur-none"
      )}
    >
      {items.map((item) => {
        const isActive = active === item.id;
        return (
          <a
            key={item.id}
            href={`#${item.id}`}
            onClick={(event) => jump(event, item.id)}
            aria-current={isActive ? "location" : undefined}
            className={cn(
              "shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold transition-colors",
              "xl:rounded-xl xl:px-3.5 xl:py-2.5",
              isActive
                ? "bg-accent text-[#0b2233] xl:bg-brand/10 xl:text-brand-ink"
                : "bg-surface-sunken text-ink-soft hover:text-ink xl:bg-transparent xl:hover:bg-surface-sunken/70"
            )}
          >
            {item.label}
          </a>
        );
      })}
    </nav>
  );
}
