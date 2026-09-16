"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { cn } from "@/lib/utils";
import { playOnEnter, revealsDisabled } from "@/lib/scroll-reveal";

gsap.registerPlugin(ScrollTrigger);

// Each reel holds the digits twice, so every digit rolls through a full turn before settling.
const REEL = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
const LANDING = 10;

/** Reel offset (as yPercent) that brings `digit` from the second run of the reel into view. */
const landingPercent = (digit: number) => -((LANDING + digit) / REEL.length) * 100;

/**
 * An odometer-style number: every digit is a reel that spins into place, left to right,
 * when the number comes into view. The markup already shows the final value, so it reads
 * correctly without JavaScript or motion, and screen readers get the plain number.
 */
export function RollingNumber({
  value,
  suffix = "",
  delay = 0,
  className,
}: {
  /** The formatted number, e.g. "1 250" or "4.8"; non-digits stay fixed. */
  value: string;
  suffix?: string;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root || revealsDisabled()) return;

    const reels = Array.from(root.querySelectorAll<HTMLElement>("[data-reel]"));
    const mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const tween = gsap.fromTo(
        reels,
        // y: 0 overrides the landing offset GSAP would otherwise read from the inline style.
        { y: 0, yPercent: 0, filter: "blur(3px)" },
        {
          y: 0,
          yPercent: (_: number, reel: HTMLElement) => landingPercent(Number(reel.dataset.digit)),
          filter: "blur(0px)",
          duration: 1.8,
          delay,
          ease: "power4.out",
          stagger: 0.09,
          paused: true,
        }
      );

      return playOnEnter(tween, root);
    });

    return () => mm.revert();
  }, [delay]);

  const chars = Array.from(value + suffix);

  return (
    <span ref={ref} className={cn("inline-flex items-start tabular-nums", className)}>
      <span className="sr-only">
        {value}
        {suffix}
      </span>
      <span aria-hidden className="inline-flex items-start">
        {chars.map((char, i) =>
          /\d/.test(char) ? (
            <span key={i} className="relative inline-block h-[1.1em] overflow-hidden">
              <span
                data-reel
                data-digit={char}
                className="flex flex-col"
                style={{ transform: `translateY(${landingPercent(Number(char))}%)` }}
              >
                {REEL.map((digit, j) => (
                  <span key={j} className="block h-[1.1em] leading-[1.1]">
                    {digit}
                  </span>
                ))}
              </span>
            </span>
          ) : (
            <span key={i} className="inline-block h-[1.1em] whitespace-pre leading-[1.1]">
              {char}
            </span>
          )
        )}
      </span>
    </span>
  );
}
