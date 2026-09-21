"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export type StoryStage = { id: string; label: string };

/**
 * Turns the landing page from a stack of blocks into a route with signposts.
 *
 * Two parts: a hairline bar across the top showing how far through the story the
 * visitor is, and — on wide screens — a rail of stage markers they can jump
 * between. Both are navigation aids, so both are real links and the rail is a
 * labelled <nav>; neither animates anything the reader has to wait for.
 */
export function StoryProgress({
  stages,
  navLabel,
}: {
  stages: StoryStage[];
  navLabel: string;
}) {
  // Written straight to the bar's style: re-rendering React on every scroll frame bought nothing.
  const barRef = useRef<HTMLDivElement>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    let frame = 0;

    function measure() {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      const progress = scrollable > 0 ? Math.min(1, window.scrollY / scrollable) : 0;
      if (barRef.current) barRef.current.style.transform = `scaleX(${progress})`;
      frame = 0;
    }

    function onScroll() {
      // One measurement per frame — scroll fires far more often than we paint.
      if (frame === 0) frame = requestAnimationFrame(measure);
    }

    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  useEffect(() => {
    const sections = stages
      .map((stage) => document.getElementById(stage.id))
      .filter((element): element is HTMLElement => element !== null);
    if (sections.length === 0) return;

    // The band sits in the upper third of the viewport: a section counts as
    // "current" once its heading has been read, not when its footer scrolls in.
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-12% 0px -70% 0px", threshold: 0 }
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [stages]);

  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 z-50 h-0.5 bg-transparent"
      >
        <div ref={barRef} className="h-full origin-left brand-gradient" style={{ transform: "scaleX(0)" }} />
      </div>

      <nav
        aria-label={navLabel}
        className="pointer-events-none fixed right-6 top-1/2 z-40 hidden -translate-y-1/2 xl:block"
      >
        <ol className="pointer-events-auto flex flex-col gap-1">
          {stages.map((stage) => {
            const isActive = activeId === stage.id;
            return (
              <li key={stage.id}>
                <a
                  href={`#${stage.id}`}
                  aria-current={isActive ? "true" : undefined}
                  className="group flex items-center justify-end gap-3 rounded-full py-1.5 pl-3 pr-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <span
                    className={cn(
                      "text-xs font-semibold transition-all duration-200",
                      isActive
                        ? "text-ink opacity-100"
                        : "text-muted opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100"
                    )}
                  >
                    {stage.label}
                  </span>
                  <span
                    className={cn(
                      "block h-2 w-2 shrink-0 rounded-full transition-all duration-200",
                      isActive
                        ? "scale-125 bg-brand-ink"
                        : "bg-border group-hover:bg-accent-deep"
                    )}
                  />
                </a>
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
