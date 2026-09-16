"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { ReactNode } from "react";
import { playOnEnter, revealsDisabled } from "@/lib/scroll-reveal";

gsap.registerPlugin(ScrollTrigger);

/**
 * Fades its children up as they scroll into view. The name predates the move from anime.js
 * to GSAP: sharing ScrollTrigger keeps these reveals in step with the pinned sections' spacing.
 * With `stagger`, each direct child rises in turn instead of the block as a whole.
 */
export function AnimeReveal({
  children,
  delay = 0,
  stagger,
  className,
}: {
  children: ReactNode;
  delay?: number;
  stagger?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || revealsDisabled()) return;

    const mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const tween = gsap.from(stagger ? Array.from(el.children) : el, {
        opacity: 0,
        y: 32,
        duration: 0.7,
        delay,
        stagger,
        ease: "power1.out",
        paused: true,
      });

      return playOnEnter(tween, el);
    });

    return () => mm.revert();
  }, [delay, stagger]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
