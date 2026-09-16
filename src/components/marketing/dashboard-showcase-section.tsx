"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { CircleCheck, Lock, Mail } from "lucide-react";
import { AnimeReveal } from "@/components/shared/anime-reveal";
import { SplitHeading } from "@/components/shared/split-heading";
import { DashboardMock, DASH_WIDTH, KPI_VALUES } from "@/components/marketing/dashboard-mock";
import type { Dictionary } from "@/lib/i18n/dictionaries";

gsap.registerPlugin(ScrollTrigger, DrawSVGPlugin);

// How much nearer than the screen each floating card sits (px of translateZ), and how far it drifts.
const FLOAT_DEPTH = [90, 60];

/**
 * The parent dashboard as a 3D product shot: the screen rises from lying flat to face the
 * viewer while its interface comes alive, floating cards arrive at different depths, and
 * the pointer tilts the whole scene.
 */
export function DashboardShowcaseSection({
  labels,
  subjects,
}: {
  labels: Dictionary["dashboard"];
  subjects: Dictionary["gridZoom"]["subjects"];
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const tiltRef = useRef<HTMLDivElement>(null);
  const screenRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Scale the fixed-size mock to its frame, like an image, so it keeps its layout at any width.
  useEffect(() => {
    const viewport = viewportRef.current;
    const canvas = canvasRef.current;
    if (!viewport || !canvas) return;

    const observer = new ResizeObserver(([entry]) => {
      canvas.style.setProperty("--dash-scale", String(entry.contentRect.width / DASH_WIDTH));
    });
    observer.observe(viewport);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const stage = stageRef.current;
    const tilt = tiltRef.current;
    const screen = screenRef.current;
    if (!stage || !tilt || !screen) return;

    const $ = gsap.utils.selector(stage);
    const mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const counters = $("[data-dash-count]");
      const values = KPI_VALUES.map((kpi) => ({ value: kpi.from }));
      const render = () => {
        counters.forEach((counter, i) => {
          counter.textContent = String(Math.round(values[i].value));
        });
      };
      render();

      const timeline = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: { trigger: stage, start: "top 92%", end: "center 55%", scrub: 1 },
      });

      // The screen rises from lying flat to face the viewer; a sheen crosses the glass.
      timeline
        .fromTo(
          screen,
          { rotationX: 48, y: 90, scale: 0.86, transformOrigin: "50% 100%" },
          { rotationX: 0, y: 0, scale: 1, duration: 1, ease: "power2.out" },
          0
        )
        .fromTo($("[data-dash-sheen]"), { xPercent: -130, opacity: 1 }, { xPercent: 130, duration: 0.7, ease: "power1.inOut" }, 0.35);

      // The interface comes alive as it turns upright.
      timeline
        .fromTo($("[data-dash-nav]"), { x: -18, opacity: 0 }, { x: 0, opacity: 1, duration: 0.2, stagger: 0.06 }, 0.4)
        .fromTo(
          $("[data-dash-kpi]"),
          { y: 24, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.25, stagger: 0.08, ease: "power2.out" },
          0.45
        )
        .to(values, { value: (i: number) => KPI_VALUES[i].to, duration: 0.5, onUpdate: render }, 0.5)
        .fromTo($("[data-dash-line]"), { drawSVG: "0%" }, { drawSVG: "100%", duration: 0.5 }, 0.55)
        .fromTo(
          $("[data-dash-dot]"),
          { scale: 0, transformOrigin: "50% 50%" },
          { scale: 1, duration: 0.08, stagger: 0.05, ease: "back.out(3)" },
          0.55
        )
        .fromTo($("[data-dash-area]"), { opacity: 0 }, { opacity: 1, duration: 0.35 }, 0.7)
        .fromTo($("[data-dash-bar]"), { scaleX: 0 }, { scaleX: 1, duration: 0.35, stagger: 0.08, ease: "power2.out" }, 0.6)
        .fromTo($("[data-dash-goal]"), { scaleX: 0 }, { scaleX: 1, duration: 0.4, ease: "power2.out" }, 0.65)
        .fromTo($("[data-dash-row]"), { x: 20, opacity: 0 }, { x: 0, opacity: 1, duration: 0.2, stagger: 0.08 }, 0.75)
        .fromTo(
          $("[data-dash-float='left']"),
          { x: -80, y: 60, rotation: -10, autoAlpha: 0 },
          { x: 0, y: 0, rotation: -4, autoAlpha: 1, duration: 0.35, ease: "power2.out" },
          0.6
        )
        .fromTo(
          $("[data-dash-float='right']"),
          { x: 80, y: -40, rotation: 10, autoAlpha: 0 },
          { x: 0, y: 0, rotation: 3, autoAlpha: 1, duration: 0.35, ease: "back.out(1.6)" },
          0.85
        );

      // Floating cards sit nearer than the screen and drift at their own pace.
      $("[data-dash-depth]").forEach((card, i) => {
        const depth = FLOAT_DEPTH[i] ?? 60;
        gsap.set(card, { z: depth });
        gsap.fromTo(
          card,
          { y: depth },
          { y: -depth, ease: "none", scrollTrigger: { trigger: stage, start: "top bottom", end: "bottom top", scrub: true } }
        );
      });

      // The counters write text directly, which GSAP's revert does not undo.
      const restoreCounters = () => {
        counters.forEach((counter, i) => {
          counter.textContent = String(KPI_VALUES[i].to);
        });
      };

      // With a mouse, the pointer tilts the whole scene; the cards' depth gives it parallax.
      if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return restoreCounters;

      const tiltX = gsap.quickTo(tilt, "rotationX", { duration: 0.8, ease: "power3.out" });
      const tiltY = gsap.quickTo(tilt, "rotationY", { duration: 0.8, ease: "power3.out" });
      const onMove = (event: PointerEvent) => {
        const rect = stage.getBoundingClientRect();
        tiltY(((event.clientX - rect.left) / rect.width - 0.5) * 10);
        tiltX(-((event.clientY - rect.top) / rect.height - 0.5) * 7);
      };
      const onLeave = () => {
        tiltX(0);
        tiltY(0);
      };

      stage.addEventListener("pointermove", onMove);
      stage.addEventListener("pointerleave", onLeave);
      return () => {
        stage.removeEventListener("pointermove", onMove);
        stage.removeEventListener("pointerleave", onLeave);
        restoreCounters();
      };
    });

    return () => mm.revert();
  }, []);

  return (
    <section className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
      <AnimeReveal className="mx-auto max-w-3xl text-center">
        <span className="eyebrow">{labels.eyebrow}</span>
        <SplitHeading className="section-title mt-6 text-ink">{labels.title}</SplitHeading>
        <p className="mx-auto mt-6 max-w-xl text-base leading-7 text-muted">{labels.subtitle}</p>
      </AnimeReveal>

      <div ref={stageRef} className="relative isolate mx-auto mt-14 max-w-[1120px] [perspective:1600px] lg:mt-20">
        <div aria-hidden className="absolute -bottom-10 left-[8%] right-[8%] top-1/3 -z-10 rounded-full bg-brand/25 blur-3xl" />

        <div ref={tiltRef} aria-hidden className="relative [transform-style:preserve-3d]">
          <div
            ref={screenRef}
            className="relative overflow-hidden rounded-[1rem] border border-border bg-surface shadow-glow-lg sm:rounded-[1.4rem]"
          >
            <div className="flex h-8 items-center gap-1.5 border-b border-border bg-surface-sunken/70 px-3 sm:h-11 sm:gap-2 sm:px-4">
              <span className="h-2 w-2 rounded-full bg-rose/80 sm:h-3 sm:w-3" />
              <span className="h-2 w-2 rounded-full bg-amber/80 sm:h-3 sm:w-3" />
              <span className="h-2 w-2 rounded-full bg-emerald/80 sm:h-3 sm:w-3" />
              <span className="mx-auto flex items-center gap-1.5 rounded-lg bg-surface px-3 py-0.5 text-[0.6rem] font-semibold text-muted sm:py-1 sm:text-xs">
                <Lock className="h-3 w-3" />
                {labels.window}
              </span>
              <span className="w-8 sm:w-[3.25rem]" />
            </div>

            <div ref={viewportRef} className="relative aspect-[1120/680] w-full overflow-hidden">
              <div ref={canvasRef} className="absolute left-0 top-0 origin-top-left [scale:var(--dash-scale,1)]">
                <DashboardMock labels={labels} subjects={subjects} />
              </div>
            </div>

            <div
              data-dash-sheen
              className="pointer-events-none absolute inset-0 bg-[linear-gradient(105deg,transparent_35%,rgba(255,255,255,0.35)_50%,transparent_65%)] opacity-0"
            />
          </div>

          <div data-dash-depth className="absolute -left-6 bottom-[12%] z-10 hidden sm:block lg:-left-14">
            <div
              data-dash-float="left"
              className="flex w-64 items-center gap-3 rounded-2xl border border-border bg-surface p-3.5 shadow-glow-lg"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#062434] text-accent">
                <Mail className="h-5 w-5" strokeWidth={1.8} />
              </span>
              <div>
                <p className="text-xs font-bold text-muted">{labels.reportTitle}</p>
                <p className="font-display text-sm font-bold leading-snug text-ink">{labels.reportText}</p>
              </div>
            </div>
          </div>

          <div data-dash-depth className="absolute -right-4 top-[14%] z-10 hidden sm:block lg:-right-12">
            <div
              data-dash-float="right"
              className="flex w-64 items-center gap-3 rounded-2xl border border-border bg-surface p-3.5 shadow-glow-lg"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent text-[#0b2233]">
                <CircleCheck className="h-5 w-5" strokeWidth={1.8} />
              </span>
              <div>
                <p className="text-xs font-bold text-muted">{labels.toastTitle}</p>
                <p className="font-display text-sm font-bold leading-snug text-ink">{labels.toastText}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
