"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { AnimeReveal } from "@/components/shared/anime-reveal";
import { SplitHeading } from "@/components/shared/split-heading";
import { LottieIcon } from "@/components/shared/lottie-icon";
import type { Dictionary } from "@/lib/i18n/dictionaries";

gsap.registerPlugin(ScrollTrigger, DrawSVGPlugin);

// A gentle wave through one node per step (x = 40, 440, 840) that ends at the goal marker.
const ROUTE_PATH =
  "M40 40 C140 40 140 10 240 10 S340 40 440 40 C540 40 540 70 640 70 S740 40 840 40 C920 40 920 10 1000 10 S1080 40 1160 40";
const NODE_X = [40, 440, 840];
const GOAL_X = 1160;
// One animated icon per step: the goal, the diagnostic, the launched schedule (see public/lottie/CREDITS.md).
// `staticAt` is the frame shown with reduced motion: the checklist and calendar are empty at their ends.
const STEP_ANIMATIONS = [
  { src: "/lottie/step-goal.json" },
  { src: "/lottie/step-diagnostics.json", staticAt: 0.5 },
  { src: "/lottie/step-route.json", staticAt: 0.7 },
];

/** Fraction of the route's length at which it first reaches `x`. */
function progressAtX(path: SVGPathElement, x: number) {
  const total = path.getTotalLength();
  for (let length = 0; length <= total; length += 2) {
    if (path.getPointAtLength(length).x >= x) return length / total;
  }
  return 1;
}

export function HowItWorksSection({ labels }: { labels: Dictionary["howItWorks"] }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const stepsRef = useRef<HTMLDivElement>(null);
  const routeRef = useRef<SVGPathElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const steps = labels.steps.slice(0, 3);

  useEffect(() => {
    const card = cardRef.current;
    const stepsWrap = stepsRef.current;
    const route = routeRef.current;
    const rail = railRef.current;
    if (!card || !stepsWrap || !route || !rail) return;

    const stepEls = Array.from(stepsWrap.querySelectorAll<HTMLElement>("[data-route-step]"));
    const nodes = Array.from(stepsWrap.querySelectorAll<SVGCircleElement>("[data-route-node]"));
    const dots = Array.from(stepsWrap.querySelectorAll<HTMLElement>("[data-route-dot]"));
    const goal = stepsWrap.querySelector<SVGGElement>("[data-route-goal]");

    const mm = gsap.matchMedia();

    // Desktop: pin the card and draw the route across the steps as the page scrolls.
    mm.add("(min-width: 1024px) and (prefers-reduced-motion: no-preference)", () => {
      const stops = NODE_X.map((x) => progressAtX(route, x));

      const timeline = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: card,
          pin: true,
          // Centre the card when it fits the viewport; otherwise keep the steps in view.
          start: () => (card.offsetHeight < window.innerHeight * 0.92 ? "center center" : "bottom 97%"),
          end: "+=110%",
          scrub: 0.8,
          invalidateOnRefresh: true,
        },
      });

      timeline.fromTo(route, { drawSVG: "0%" }, { drawSVG: "100%", duration: 1 }, 0);
      stops.forEach((at, i) => {
        timeline.fromTo(
          nodes[i],
          { scale: 0, transformOrigin: "50% 50%" },
          { scale: 1, duration: 0.06, ease: "back.out(3)" },
          at
        );
        timeline.fromTo(stepEls[i], { opacity: 0.25 }, { opacity: 1, duration: 0.12, ease: "power1.out" }, at);
      });
      if (goal) {
        timeline.fromTo(
          goal,
          { scale: 0, transformOrigin: "50% 50%" },
          { scale: 1, duration: 0.08, ease: "back.out(3)" },
          0.94
        );
      }
      // Hold on the finished route for a moment before the pin releases.
      timeline.to({}, { duration: 0.15 });
    });

    // Mobile: steps are stacked, so a vertical rail fills alongside them without pinning.
    mm.add("(max-width: 1023px) and (prefers-reduced-motion: no-preference)", () => {
      const timeline = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: { trigger: stepsWrap, start: "top 75%", end: "bottom 55%", scrub: 0.8 },
      });

      timeline.fromTo(rail, { scaleY: 0 }, { scaleY: 1, duration: 1 }, 0);
      stepEls.forEach((step, i) => {
        const at = (step.offsetTop + dots[i].offsetTop) / stepsWrap.offsetHeight;
        timeline.fromTo(dots[i], { scale: 0 }, { scale: 1, duration: 0.06, ease: "back.out(3)" }, at);
        timeline.fromTo(step, { opacity: 0.25 }, { opacity: 1, duration: 0.12, ease: "power1.out" }, at);
      });
    });

    return () => mm.revert();
  }, []);

  return (
    <section id="how-it-works" className="scroll-mt-24 px-3 sm:px-5">
      <div
        ref={cardRef}
        className="paper-noise relative mx-auto max-w-[1400px] overflow-hidden rounded-[1.8rem] bg-panel px-5 py-20 text-white sm:rounded-[2.4rem] sm:px-10 lg:py-24"
      >
        <div aria-hidden className="science-grid pointer-events-none absolute inset-0 opacity-40" />
        <div className="relative mx-auto max-w-6xl">
          <AnimeReveal className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
            <span className="eyebrow !text-accent">{labels.eyebrow}</span>
            <SplitHeading className="section-title max-w-3xl text-white">{labels.title}</SplitHeading>
          </AnimeReveal>

          <div ref={stepsRef} className="relative mt-14 lg:mt-16">
            <svg aria-hidden viewBox="0 0 1200 80" fill="none" className="hidden w-full overflow-visible lg:block">
              <path
                d={ROUTE_PATH}
                className="stroke-white/20"
                strokeWidth={2}
                strokeDasharray="1 9"
                strokeLinecap="round"
              />
              <path ref={routeRef} d={ROUTE_PATH} className="stroke-accent" strokeWidth={2.5} strokeLinecap="round" />
              {NODE_X.map((x) => (
                <circle
                  key={x}
                  data-route-node
                  cx={x}
                  cy={40}
                  r={7}
                  className="fill-[#062434] stroke-accent"
                  strokeWidth={2.5}
                />
              ))}
              <g data-route-goal>
                <circle cx={GOAL_X} cy={40} r={12} className="fill-accent" />
                <path
                  d={`M${GOAL_X - 5} 40 l3.5 3.5 l6.5 -7`}
                  className="stroke-[#062434]"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>
            </svg>

            <div aria-hidden className="absolute bottom-0 left-2.5 top-0 w-px bg-white/15 lg:hidden">
              <div ref={railRef} className="h-full w-full origin-top bg-accent" />
            </div>

            <div className="grid lg:mt-2 lg:grid-cols-3">
              {steps.map((step, i) => (
                <article
                  key={step.title}
                  data-route-step
                  className="relative border-b border-white/15 py-8 pl-10 last:border-b-0 lg:border-b-0 lg:border-r lg:px-8 last:lg:border-r-0"
                >
                  <span
                    data-route-dot
                    aria-hidden
                    className="absolute left-2.5 top-[3.15rem] h-3 w-3 -translate-x-1/2 rounded-full border-2 border-accent bg-panel lg:hidden"
                  />
                  <div className="flex items-start justify-between gap-4">
                    <span className="font-display text-5xl font-bold tracking-[-0.06em] text-accent">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <LottieIcon
                      {...STEP_ANIMATIONS[i]}
                      className="h-16 w-16 shrink-0 rounded-2xl bg-white/[0.06] p-2 ring-1 ring-white/10"
                    />
                  </div>
                  <h3 className="mt-8 font-display text-xl font-bold tracking-[-0.035em] text-white">{step.title}</h3>
                  <p className="mt-3 max-w-xs text-sm leading-6 text-white/55">{step.description}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
