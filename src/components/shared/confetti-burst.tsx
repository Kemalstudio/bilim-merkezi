"use client";

import { useEffect } from "react";

/** The site's own palette, so the celebration looks like the brand and not like a stock effect. */
const COLORS = ["#f4a83a", "#ffd08a", "#1fb5ad", "#0b6a8f", "#7fdfd6"];

/**
 * A short burst of confetti from both sides of the screen — for the one moment worth
 * celebrating, a payment that went through. Renders nothing. It plays once per `id` per browser
 * tab (a refresh of the same page stays quiet) and never for visitors who prefer reduced motion.
 */
export function ConfettiBurst({ id }: { id: string }) {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const key = `bilim:confetti:${id}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      // Private mode: it may replay on refresh, which is harmless.
    }

    let cancelled = false;
    const timers: number[] = [];

    // Loaded on demand so the library never touches any other page's bundle.
    import("canvas-confetti").then(({ default: confetti }) => {
      if (cancelled) return;
      const shoot = (originX: number, angle: number) =>
        confetti({
          particleCount: 70,
          angle,
          spread: 62,
          startVelocity: 52,
          origin: { x: originX, y: 0.72 },
          colors: COLORS,
          disableForReducedMotion: true,
          zIndex: 100,
        });
      shoot(0.08, 60);
      shoot(0.92, 120);
      timers.push(window.setTimeout(() => !cancelled && confetti({ particleCount: 60, spread: 100, origin: { y: 0.55 }, colors: COLORS, zIndex: 100 }), 350));
    });

    return () => {
      cancelled = true;
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [id]);

  return null;
}
