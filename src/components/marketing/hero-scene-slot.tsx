"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Constellation } from "@/components/marketing/constellation";
import { cn } from "@/lib/utils";

const HeroScene = dynamic(
  () => import("@/components/marketing/hero-scene").then((module) => module.HeroScene),
  { ssr: false }
);

/**
 * Decides whether the hero gets the 3D constellation or the flat SVG one.
 *
 * The 3D scene is an enhancement, never a requirement: it loads only on a
 * pointer-capable screen wide enough to see it, and only when the visitor has
 * not asked for reduced motion. Everyone else gets the SVG, which carries the
 * same motif at a fraction of the cost. The SVG also stays mounted underneath
 * until the canvas has actually drawn, so the hero is never a blank box.
 */
export function HeroSceneSlot({ className, allow3d = true }: { className?: string; allow3d?: boolean }) {
  const [wants3d, setWants3d] = useState(false);
  const [sceneReady, setSceneReady] = useState(false);

  useEffect(() => {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sizeQuery = window.matchMedia("(min-width: 1024px)");

    function evaluate() {
      setWants3d(allow3d && !motionQuery.matches && sizeQuery.matches);
    }

    evaluate();
    motionQuery.addEventListener("change", evaluate);
    sizeQuery.addEventListener("change", evaluate);
    return () => {
      motionQuery.removeEventListener("change", evaluate);
      sizeQuery.removeEventListener("change", evaluate);
    };
  }, [allow3d]);

  const handleReady = useCallback(() => setSceneReady(true), []);

  return (
    <div className={cn("relative", className)}>
      <Constellation
        variant="hero"
        className={cn(
          "h-full w-full transition-opacity duration-700",
          sceneReady ? "opacity-0" : "opacity-100"
        )}
      />
      {wants3d && <HeroScene onReady={handleReady} />}
    </div>
  );
}
