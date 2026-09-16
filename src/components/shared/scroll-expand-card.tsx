"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * A full-bleed block that starts clipped to the site's usual rounded 1400px card and opens
 * edge to edge as it scrolls into view. Without motion it simply stays full-bleed.
 */
export function ScrollExpandCard({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const card = ref.current;
    if (!card) return;

    const mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const isSmall = () => window.innerWidth < 640;
      // Matches the section gutters (px-3 / sm:px-5) and max-w-[1400px] used by the other cards.
      const sideInset = () => Math.max(isSmall() ? 12 : 20, (card.offsetWidth - 1400) / 2);
      const radius = () => (isSmall() ? 29 : 38);

      gsap.fromTo(
        card,
        { clipPath: () => `inset(0px ${sideInset()}px 0px ${sideInset()}px round ${radius()}px)` },
        {
          clipPath: "inset(0px 0px 0px 0px round 0px)",
          ease: "power2.inOut",
          scrollTrigger: {
            trigger: card,
            start: "top 85%",
            end: "top 20%",
            scrub: 0.6,
            invalidateOnRefresh: true,
          },
        }
      );
    });

    return () => mm.revert();
  }, []);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
