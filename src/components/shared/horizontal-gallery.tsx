"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * Children laid out in a horizontal track. On wider screens the block pins and the vertical
 * scroll drives the track sideways, with the panel nearest the centre coming into focus;
 * on phones (and without motion) the track is a native swipe carousel.
 */
export function HorizontalGallery({ header, children }: { header: ReactNode; children: ReactNode }) {
  const pinRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const pin = pinRef.current;
    const viewport = viewportRef.current;
    const track = trackRef.current;
    const progress = progressRef.current;
    if (!pin || !viewport || !track || !progress) return;

    const mm = gsap.matchMedia();

    mm.add("(min-width: 768px) and (prefers-reduced-motion: no-preference)", () => {
      const panels = Array.from(track.children) as HTMLElement[];
      const distance = () => Math.max(0, track.scrollWidth - viewport.clientWidth);

      // Panels ease into focus as they near the centre of the screen.
      const setScale = panels.map((panel) => gsap.quickSetter(panel, "scale"));
      const setOpacity = panels.map((panel) => gsap.quickSetter(panel, "opacity"));
      const focus = () => {
        const centre = window.innerWidth / 2;
        panels.forEach((panel, i) => {
          const rect = panel.getBoundingClientRect();
          const offset = Math.min(1, Math.abs(rect.left + rect.width / 2 - centre) / (window.innerWidth * 0.6));
          setScale[i](1 - offset * 0.08);
          setOpacity[i](1 - offset * 0.45);
        });
      };

      // The track is moved by the scroll here, not by native horizontal scrolling.
      viewport.scrollLeft = 0;
      gsap.set(viewport, { overflowX: "hidden" });

      const timeline = gsap.timeline({
        defaults: { ease: "none" },
        onUpdate: focus,
        scrollTrigger: {
          trigger: pin,
          pin: true,
          start: "top top",
          end: () => `+=${distance()}`,
          scrub: 0.8,
          invalidateOnRefresh: true,
          onRefresh: focus,
        },
      });

      timeline
        .to(track, { x: () => -distance(), duration: 1 }, 0)
        .fromTo(progress, { scaleX: 0 }, { scaleX: 1, duration: 1 }, 0);
      focus();

      // quickSetter values are not recorded by the context, so clear them on revert.
      return () => gsap.set(panels, { clearProps: "transform,opacity" });
    });

    return () => mm.revert();
  }, []);

  return (
    <div>
      {/* The inner block is pinned, so GSAP's pin-spacer never wraps React's root node. */}
      <div ref={pinRef} className="md:flex md:min-h-svh md:flex-col md:justify-center">
        {header}
        <div
          ref={viewportRef}
          className="mt-7 snap-x snap-mandatory scroll-pl-4 overflow-x-auto pb-6 pt-3 [scrollbar-width:none] sm:scroll-pl-6 md:snap-none [&::-webkit-scrollbar]:hidden"
        >
          <div
            ref={trackRef}
            className="flex w-max items-stretch gap-4 px-4 sm:gap-6 sm:px-6 lg:px-[max(2rem,calc((100vw_-_80rem)/2_+_2rem))]"
          >
            {children}
          </div>
        </div>
        <div className="mx-auto mt-4 hidden w-full max-w-7xl px-4 sm:px-6 md:block lg:px-8">
          <div className="h-0.5 overflow-hidden rounded-full bg-border">
            <div ref={progressRef} className="h-full origin-left bg-brand" />
          </div>
        </div>
      </div>
    </div>
  );
}
