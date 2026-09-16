"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { gsap } from "gsap";

/**
 * Reveals the cards of a grid as it scrolls into view: each card rises and straightens out
 * of a slight 3D tilt, staggered across the grid rather than in DOM order.
 *
 * An IntersectionObserver starts the entrance rather than a ScrollTrigger: in the catalogue the
 * trigger never fired (its cards stayed hidden after scrolling), while the observer is immune
 * to the layout moving under it — sticky filters, results re-rendering, fonts loading.
 *
 * Give it a key that changes with the filters — the catalogue re-renders a different set of
 * cards, and the remount is what lets the new set play in.
 */
export function CourseGridReveal({ children, className }: { children: ReactNode; className?: string }) {
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;

    const cards = Array.from(grid.children) as HTMLElement[];
    if (cards.length === 0) return;

    const mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.set(cards, { y: 48, autoAlpha: 0, rotationX: 12, transformOrigin: "50% 0%" });

      // Plays once the grid's top edge is within 85% of the viewport height.
      const observer = new IntersectionObserver(
        (entries) => {
          if (!entries.some((entry) => entry.isIntersecting)) return;
          observer.disconnect();
          gsap.to(cards, {
            y: 0,
            autoAlpha: 1,
            rotationX: 0,
            duration: 0.7,
            ease: "power2.out",
            stagger: { each: 0.06, from: "start", grid: "auto" },
          });
        },
        { rootMargin: "0px 0px -15% 0px" }
      );
      observer.observe(grid);

      return () => observer.disconnect();
    });

    // Reverting also clears the hidden state, so cards are never left invisible on unmount.
    return () => mm.revert();
  }, []);

  return (
    <div ref={gridRef} className={className} style={{ perspective: "1200px" }}>
      {children}
    </div>
  );
}
