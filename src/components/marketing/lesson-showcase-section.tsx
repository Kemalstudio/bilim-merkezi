"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Constellation } from "@/components/marketing/constellation";
import type { MorphState } from "@/components/marketing/particle-morph-scene";
import { cn } from "@/lib/utils";
import type { Dictionary } from "@/lib/i18n/dictionaries";

gsap.registerPlugin(ScrollTrigger);

const ParticleMorphScene = dynamic(
  () => import("@/components/marketing/particle-morph-scene").then((module) => module.ParticleMorphScene),
  { ssr: false }
);

/**
 * Three shapes, one cloud: the scroll drives the morph, the scroll speed drives the spin,
 * and the caption follows the shape. The 3D scene is an enhancement — on small screens,
 * under reduced motion, or without WebGL the flat SVG motif stays.
 */
export function LessonShowcaseSection({ labels }: { labels: Dictionary["lesson"] }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const captionsRef = useRef<HTMLDivElement>(null);
  // A plain object the scene reads each frame, so scrolling never re-renders React.
  const morphState = useRef<MorphState>({ progress: 0, velocity: 0 });
  const [wants3d, setWants3d] = useState(false);
  const [sceneReady, setSceneReady] = useState(false);

  useEffect(() => {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sizeQuery = window.matchMedia("(min-width: 1024px)");

    function evaluate() {
      setWants3d(!motionQuery.matches && sizeQuery.matches);
    }

    evaluate();
    motionQuery.addEventListener("change", evaluate);
    sizeQuery.addEventListener("change", evaluate);
    return () => {
      motionQuery.removeEventListener("change", evaluate);
      sizeQuery.removeEventListener("change", evaluate);
    };
  }, []);

  useEffect(() => {
    const stage = stageRef.current;
    const captions = captionsRef.current;
    if (!stage || !captions) return;

    const items = Array.from(captions.querySelectorAll<HTMLElement>("[data-caption]"));
    const setActive = (index: number) =>
      items.forEach((item, i) => {
        item.dataset.current = String(i === index);
      });
    setActive(0);

    const trigger = ScrollTrigger.create({
      trigger: stage,
      start: "top 80%",
      end: "bottom 35%",
      onUpdate: (self) => {
        morphState.current.progress = self.progress;
        morphState.current.velocity = self.getVelocity();
        setActive(Math.round(self.progress * (items.length - 1)));
      },
    });

    return () => {
      trigger.kill();
      items.forEach((item) => delete item.dataset.current);
    };
  }, []);

  const handleReady = useCallback(() => setSceneReady(true), []);

  return (
    <section aria-labelledby="lesson-title" className="px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
      <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
        <div>
          <span className="eyebrow">{labels.eyebrow}</span>
          <h2 id="lesson-title" className="section-title mt-6 text-ink">
            {labels.title}
          </h2>
          <p className="mt-6 max-w-md text-base leading-7 text-muted">{labels.text}</p>

          <div ref={captionsRef} className="mt-8 flex flex-col gap-2.5">
            {labels.stages.map((stage, i) => (
              <span
                key={stage}
                data-caption
                className="flex items-center gap-3 text-sm font-semibold text-muted transition-colors duration-300 data-[current=true]:text-ink"
              >
                <span className="font-display text-xs font-bold text-muted">0{i + 1}</span>
                <span className="h-px w-6 bg-border transition-all duration-300 data-[current=true]:w-10" />
                {stage}
              </span>
            ))}
          </div>

          <div className="mt-8">
            <Button asChild size="lg">
              <Link href="/courses">
                {labels.cta} <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>

        <div ref={stageRef} className="relative aspect-square w-full sm:aspect-[16/12]">
          <Constellation
            variant="hero"
            className={cn(
              "h-full w-full text-brand transition-opacity duration-700",
              sceneReady ? "opacity-0" : "opacity-100"
            )}
          />
          {wants3d && <ParticleMorphScene state={morphState} onReady={handleReady} />}
        </div>
      </div>
    </section>
  );
}
