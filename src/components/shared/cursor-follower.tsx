"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";

const INTERACTIVE = "a, button, [role='button'], input, select, textarea, label, summary";

/**
 * A trailing ring and dot alongside the system cursor (never instead of it), plus a gentle
 * magnetic pull on [data-magnetic] elements. Mouse only, and only with motion enabled.
 */
export function CursorFollower() {
  const ringRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ring = ringRef.current;
    const dot = dotRef.current;
    if (!ring || !dot) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    gsap.set([ring, dot], { display: "block", xPercent: -50, yPercent: -50 });

    const ringX = gsap.quickTo(ring, "x", { duration: 0.5, ease: "power3.out" });
    const ringY = gsap.quickTo(ring, "y", { duration: 0.5, ease: "power3.out" });
    const dotX = gsap.quickTo(dot, "x", { duration: 0.12, ease: "power3.out" });
    const dotY = gsap.quickTo(dot, "y", { duration: 0.12, ease: "power3.out" });

    // One pair of setters per magnetic element, kept for as long as the element lives.
    const setters = new WeakMap<HTMLElement, { x: (value: number) => void; y: (value: number) => void }>();
    const setterFor = (el: HTMLElement) => {
      let pair = setters.get(el);
      if (!pair) {
        pair = {
          x: gsap.quickTo(el, "x", { duration: 0.4, ease: "power3.out" }),
          y: gsap.quickTo(el, "y", { duration: 0.4, ease: "power3.out" }),
        };
        setters.set(el, pair);
      }
      return pair;
    };

    let magnet: HTMLElement | null = null;
    const releaseMagnet = () => {
      if (!magnet) return;
      gsap.to(magnet, { x: 0, y: 0, duration: 0.5, ease: "elastic.out(1, 0.5)", overwrite: "auto" });
      magnet = null;
    };

    const onMove = (event: PointerEvent) => {
      ringX(event.clientX);
      ringY(event.clientY);
      dotX(event.clientX);
      dotY(event.clientY);

      if (magnet) {
        const rect = magnet.getBoundingClientRect();
        const pair = setterFor(magnet);
        pair.x(gsap.utils.clamp(-10, 10, (event.clientX - (rect.left + rect.width / 2)) * 0.25));
        pair.y(gsap.utils.clamp(-8, 8, (event.clientY - (rect.top + rect.height / 2)) * 0.25));
      }
    };

    const onOver = (event: PointerEvent) => {
      const target = event.target instanceof Element ? event.target : null;
      gsap.to(ring, {
        scale: target?.closest(INTERACTIVE) ? 2.2 : 1,
        duration: 0.3,
        ease: "power2.out",
        overwrite: "auto",
      });

      const next = target?.closest<HTMLElement>("[data-magnetic]") ?? null;
      if (next !== magnet) {
        releaseMagnet();
        magnet = next;
      }
    };

    const onEnterWindow = () => gsap.to([ring, dot], { autoAlpha: 1, duration: 0.2, overwrite: "auto" });
    const onLeaveWindow = () => {
      releaseMagnet();
      gsap.to([ring, dot], { autoAlpha: 0, duration: 0.2, overwrite: "auto" });
    };

    document.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerover", onOver, { passive: true });
    document.addEventListener("pointerenter", onEnterWindow);
    document.addEventListener("pointerleave", onLeaveWindow);

    return () => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerover", onOver);
      document.removeEventListener("pointerenter", onEnterWindow);
      document.removeEventListener("pointerleave", onLeaveWindow);
      releaseMagnet();
      gsap.set([ring, dot], { display: "none" });
    };
  }, []);

  return (
    <>
      <div
        ref={ringRef}
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[120] hidden h-8 w-8 rounded-full border-2 border-white mix-blend-difference"
      />
      <div
        ref={dotRef}
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[120] hidden h-1.5 w-1.5 rounded-full bg-white mix-blend-difference"
      />
    </>
  );
}
