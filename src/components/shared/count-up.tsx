"use client";

import { useEffect, useRef, useState } from "react";

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function CountUp({
  value,
  durationMs = 1400,
  suffix = "",
  prefix = "",
}: {
  value: number;
  durationMs?: number;
  suffix?: string;
  prefix?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [reduced] = useState(prefersReducedMotion);
  const [display, setDisplay] = useState(() => (reduced ? value : 0));
  const started = useRef(false);

  useEffect(() => {
    if (reduced) return;
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting || started.current) return;
        started.current = true;

        const start = performance.now();
        function tick(now: number) {
          const elapsed = now - start;
          const progress = Math.min(1, elapsed / durationMs);
          const eased = 1 - Math.pow(1 - progress, 3);
          setDisplay(Math.round(value * eased));
          if (progress < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
        observer.disconnect();
      },
      { threshold: 0.3 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [value, durationMs, reduced]);

  return (
    <span ref={ref}>
      {prefix}
      {display.toLocaleString("ru-RU")}
      {suffix}
    </span>
  );
}
