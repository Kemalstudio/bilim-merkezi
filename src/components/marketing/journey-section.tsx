"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { AnimeReveal } from "@/components/shared/anime-reveal";
import { SplitHeading } from "@/components/shared/split-heading";
import { journeyScenes } from "@/components/marketing/journey-art";
import { cn } from "@/lib/utils";
import type { Dictionary } from "@/lib/i18n/dictionaries";

gsap.registerPlugin(ScrollTrigger, DrawSVGPlugin);

const tones = [
  { scene: "bg-accent text-[#0b2233]", text: "text-[#0b2233]/75", number: "[-webkit-text-stroke:2px_#0b2233]", pill: "bg-[#0b2233]/10" },
  { scene: "bg-panel text-white", text: "text-white/70", number: "[-webkit-text-stroke:2px_#f4a83a]", pill: "bg-white/10" },
  { scene: "bg-[#f0b968] text-[#0b2233]", text: "text-[#0b2233]/75", number: "[-webkit-text-stroke:2px_#0b2233]", pill: "bg-[#0b2233]/10" },
];

// Pinned-timeline times at which scenes 2 and 3 open (scene 1 plays in before the pin),
// and from which each scene counts as the current one in the rail.
const REVEAL_AT = [0, 0.2, 1.4];
const ACTIVE_FROM = [0, 0.6, 1.8];

/**
 * The student's journey as full-screen scenes: pinned, each next scene opens in a widening
 * circle over the last one, which recedes, while its illustration plays out with the scroll.
 * Without motion the scenes simply follow each other down the page.
 */
export function JourneySection({ labels }: { labels: Dictionary["journey"] }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const railFillRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stage = stageRef.current;
    const rail = railRef.current;
    const railFill = railFillRef.current;
    if (!stage || !rail || !railFill) return;

    const scenes = Array.from(stage.querySelectorAll<HTMLElement>("[data-scene]"));
    const railItems = Array.from(rail.querySelectorAll<HTMLElement>("[data-rail-item]"));
    const parts = (scene: HTMLElement) => ({
      inner: scene.querySelector<HTMLElement>("[data-scene-inner]"),
      art: scene.querySelector<HTMLElement>("[data-scene-art]"),
      copy: scene.querySelectorAll<HTMLElement>("[data-scene-copy]"),
    });

    const mm = gsap.matchMedia();

    mm.add(
      {
        desktop: "(min-width: 1024px) and (prefers-reduced-motion: no-preference)",
        mobile: "(max-width: 1023px) and (prefers-reduced-motion: no-preference)",
      },
      (ctx) => {
        const { mobile } = ctx.conditions as Record<"mobile", boolean>;
        // The circle opens from the illustration.
        const origin = mobile ? "50% 32%" : "72% 52%";
        const setActive = (index: number) =>
          railItems.forEach((item, i) => {
            item.dataset.current = String(i === index);
          });

        // Stack the scenes into one full-screen stage.
        gsap.set(stage, { height: "100svh" });
        gsap.set(scenes, { position: "absolute", top: 0, left: 0, width: "100%", height: "100%" });
        gsap.set(rail, { autoAlpha: 1 });
        setActive(0);

        // Scene 1 plays in as the stage arrives.
        const first = parts(scenes[0]);
        const intro = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: { trigger: stage, start: "top 75%", end: "top top", scrub: 0.8 },
        });
        intro
          .fromTo(first.art, { scale: 1.15, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5, ease: "power2.out" }, 0)
          .fromTo(first.copy, { y: 40, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.4, stagger: 0.07, ease: "power2.out" }, 0.1);
        journeyScenes[0].animate(intro, scenes[0], 0.1);

        // Pinned: each next scene opens in a widening circle over the last, which recedes.
        const timeline = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: { trigger: stage, pin: true, start: "top top", end: "+=260%", scrub: 0.8 },
          onUpdate: () => {
            const time = timeline.time();
            setActive(ACTIVE_FROM.reduce((active, from, i) => (time >= from ? i : active), 0));
          },
        });

        scenes.slice(1).forEach((scene, k) => {
          const i = k + 1;
          const at = REVEAL_AT[i];
          const current = parts(scene);
          const previous = parts(scenes[i - 1]);

          timeline
            .fromTo(
              scene,
              { clipPath: `circle(0% at ${origin})` },
              { clipPath: `circle(150% at ${origin})`, duration: 0.8, ease: "power2.inOut" },
              at
            )
            .to(previous.inner, { scale: 0.92, opacity: 0.35, duration: 0.8, ease: "power2.inOut" }, at)
            .fromTo(current.art, { scale: 1.2, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.6, ease: "power2.out" }, at + 0.3)
            .fromTo(
              current.copy,
              { y: 40, autoAlpha: 0 },
              { y: 0, autoAlpha: 1, duration: 0.4, stagger: 0.07, ease: "power2.out" },
              at + 0.4
            );
          journeyScenes[i % journeyScenes.length].animate(timeline, scene, at + 0.4);
        });

        // Hold on the last scene, then run the rail's progress bar across the whole pin.
        timeline.to({}, { duration: 0.3 });
        timeline.fromTo(railFill, { scaleX: 0 }, { scaleX: 1, duration: timeline.duration() }, 0);

        return () =>
          railItems.forEach((item) => {
            delete item.dataset.current;
          });
      }
    );

    return () => mm.revert();
  }, []);

  return (
    <section aria-labelledby="journey-title" className="relative pt-24 lg:pt-32">
      <AnimeReveal className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <span className="eyebrow">{labels.eyebrow}</span>
        <SplitHeading id="journey-title" className="section-title mt-6 max-w-4xl text-ink">
          {labels.title}
        </SplitHeading>
        <p className="mt-6 max-w-xl text-base leading-7 text-muted">{labels.subtitle}</p>
      </AnimeReveal>

      <div ref={stageRef} className="relative mt-14 overflow-hidden">
        <div ref={railRef} className="invisible absolute left-1/2 top-24 z-20 w-[min(92vw,30rem)] -translate-x-1/2 opacity-0">
          <div className="relative flex items-center gap-1 rounded-full border border-border/60 bg-surface/85 p-1 pb-2 shadow-glow-md backdrop-blur-xl">
            {labels.scenes.map((scene) => (
              <span
                key={scene.label}
                data-rail-item
                className="flex-1 rounded-full px-3 py-1.5 text-center text-xs font-bold text-muted transition-colors duration-300 data-[current=true]:bg-ink data-[current=true]:text-background sm:text-sm"
              >
                {scene.label}
              </span>
            ))}
            <div className="absolute inset-x-5 bottom-1 h-0.5 overflow-hidden rounded-full bg-border">
              <div ref={railFillRef} className="h-full origin-left bg-brand" />
            </div>
          </div>
        </div>

        {labels.scenes.map((scene, i) => {
          const tone = tones[i % tones.length];
          const { Art } = journeyScenes[i % journeyScenes.length];
          return (
            <div key={scene.label} data-scene className={cn("relative flex min-h-svh items-center overflow-hidden", tone.scene)}>
              <div
                data-scene-inner
                className="mx-auto grid w-full max-w-7xl items-center gap-6 px-6 pb-10 pt-36 sm:px-10 lg:grid-cols-[1fr_1.05fr] lg:gap-12 lg:pt-28"
              >
                <div className="order-2 lg:order-1">
                  <p
                    data-scene-copy
                    aria-hidden
                    className={cn(
                      "font-display text-[clamp(3.5rem,10vw,8.5rem)] font-bold leading-none tracking-[-0.06em] text-transparent",
                      tone.number
                    )}
                  >
                    {scene.number}
                  </p>
                  <h3 data-scene-copy className="mt-3 font-display text-[clamp(1.8rem,3.6vw,3.2rem)] font-bold leading-[1.02] tracking-[-0.05em]">
                    <span className="sr-only">{scene.label}: </span>
                    {scene.title}
                  </h3>
                  <p data-scene-copy className={cn("mt-4 max-w-md text-sm leading-6 sm:text-base sm:leading-7", tone.text)}>
                    {scene.text}
                  </p>
                  <ul data-scene-copy className="mt-6 flex flex-wrap gap-2">
                    {scene.points.map((point) => (
                      <li key={point} className={cn("rounded-full px-3.5 py-1.5 text-xs font-semibold sm:text-sm", tone.pill)}>
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="order-1 flex h-[30svh] items-center justify-center lg:order-2 lg:h-[64svh]">
                  <div data-scene-art className="aspect-square h-full max-w-full">
                    <Art />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
