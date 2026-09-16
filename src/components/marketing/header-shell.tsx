"use client";

import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function HeaderShell({ children }: { children: ReactNode }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 24);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="sticky top-0 z-40 px-3 py-2 transition-all duration-300 sm:px-5 sm:py-3">
      <div
        className={cn(
          "mx-auto flex h-15 items-center justify-between border px-4 transition-all duration-300 sm:px-5",
          scrolled
            ? "max-w-5xl rounded-[1.15rem] border-border/80 bg-surface/90 shadow-glow-md backdrop-blur-xl sm:h-14"
            : "max-w-[1400px] rounded-[1.15rem] border-transparent bg-background/80 backdrop-blur-md"
        )}
      >
        {children}
      </div>
    </header>
  );
}
