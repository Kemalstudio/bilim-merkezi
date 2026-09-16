"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { cn } from "@/lib/utils";

gsap.registerPlugin(ScrollTrigger);

type Tone = "ink" | "accent";
type MarqueeRow = { words: string[]; tone: Tone; direction: 1 | -1 };

const toneStyles: Record<Tone, { tape: string; outline: string; star: string }> = {
  ink: {
    tape: "border-panel bg-panel text-white",
    outline: "[-webkit-text-stroke:1.5px_#ffffff]",
    star: "text-accent",
  },
  accent: {
    tape: "border-accent bg-accent text-[#0b2233]",
    outline: "[-webkit-text-stroke:1.5px_#0b2233]",
    star: "text-[#0b2233]",
  },
};

// Pixels per second at rest; fast scrolling multiplies it by up to 1 + MAX_BOOST.
const BASE_SPEED = 70;
const MAX_BOOST = 6;
// Each row repeats its words so a loop is always wider than the screen.
const COPIES = 3;

function Sparkle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="currentColor">
      <path d="M12 0C12.8 6.4 17.6 11.2 24 12C17.6 12.8 12.8 17.6 12 24C11.2 17.6 6.4 12.8 0 12C6.4 11.2 11.2 6.4 12 0Z" />
    </svg>
  );
}

/**
 * Crossing marquee tapes that drift on their own and react to the scroll: faster scrolling
 * speeds them up and skews the lettering, scrolling up turns them round, and they settle
 * once the scroll stops. Decorative — the words repeat content shown elsewhere on the page.
 */
export function VelocityMarquee({ rows }: { rows: MarqueeRow[] }) {
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const tracks = Array.from(root.querySelectorAll<HTMLElement>("[data-marquee-row]")).map((row) => {
        const track = row.querySelector<HTMLElement>("[data-marquee-track]");
        const copy = row.querySelector<HTMLElement>("[data-marquee-copy]");
        return {
          track,
          copy,
          direction: Number(row.dataset.direction) || 1,
          x: 0,
          loop: copy?.offsetWidth ?? 0,
          setX: track ? gsap.quickSetter(track, "x", "px") : null,
          skewTo: gsap.quickTo(row, "skewX", { duration: 0.6, ease: "power3.out" }),
        };
      });

      let boost = 0;
      let targetBoost = 0;
      let scrollDirection = 1;
      let isSkewed = false;

      const tick = (_time: number, deltaTime: number) => {
        // The boost from a burst of scrolling fades out, and the tapes ease back to cruising.
        targetBoost *= 0.9;
        boost += (targetBoost - boost) * 0.12;
        const step = BASE_SPEED * (1 + boost) * scrollDirection * (deltaTime / 1000);

        tracks.forEach((row) => {
          if (!row.setX || row.loop === 0) return;
          row.x = gsap.utils.wrap(-row.loop, 0, row.x - row.direction * step);
          row.setX(row.x);
        });

        if (isSkewed && targetBoost < 0.05) {
          isSkewed = false;
          tracks.forEach((row) => row.skewTo(0));
        }
      };

      ScrollTrigger.create({
        trigger: root,
        start: "top bottom",
        end: "bottom top",
        // Only animate while the tapes are on screen.
        onToggle: (self) => (self.isActive ? gsap.ticker.add(tick) : gsap.ticker.remove(tick)),
        onRefresh: () =>
          tracks.forEach((row) => {
            row.loop = row.copy?.offsetWidth ?? 0;
          }),
        onUpdate: (self) => {
          const velocity = self.getVelocity();
          scrollDirection = self.direction;
          targetBoost = Math.min(Math.abs(velocity) / 300, MAX_BOOST);
          const skew = gsap.utils.clamp(-10, 10, velocity / -300);
          isSkewed = true;
          tracks.forEach((row) => row.skewTo(skew * row.direction));
        },
      });

      return () => gsap.ticker.remove(tick);
    });

    return () => mm.revert();
  }, []);

  return (
    <section ref={rootRef} aria-hidden className="relative overflow-clip py-20 sm:py-28">
      {rows.map((row, i) => {
        const tone = toneStyles[row.tone];
        return (
          <div
            key={i}
            className={cn(
              "relative -mx-[5%] border-y py-3 sm:py-5",
              i === 0 ? "-rotate-3" : "z-10 -mt-8 rotate-2 shadow-glow-lg sm:-mt-12",
              tone.tape
            )}
          >
            <div data-marquee-row data-direction={row.direction} className="flex">
              <div data-marquee-track className="flex w-max">
                {Array.from({ length: COPIES }, (_, copy) => (
                  <div key={copy} data-marquee-copy={copy === 0 ? "" : undefined} className="flex shrink-0 items-center">
                    {row.words.map((word, w) => (
                      <span key={`${word}-${w}`} className="flex items-center">
                        <span
                          className={cn(
                            "whitespace-nowrap px-5 font-display text-[clamp(2rem,5.5vw,4.75rem)] font-bold uppercase leading-none tracking-[-0.04em] sm:px-8",
                            w % 2 === 1 && ["text-transparent", tone.outline]
                          )}
                        >
                          {word}
                        </span>
                        <Sparkle className={cn("h-6 w-6 shrink-0 sm:h-9 sm:w-9", tone.star)} />
                      </span>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </section>
  );
}
