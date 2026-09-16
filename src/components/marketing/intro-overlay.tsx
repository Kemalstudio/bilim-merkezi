"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { markIntroDone } from "@/lib/scroll-reveal";

gsap.registerPlugin(ScrollTrigger);

const SEEN_KEY = "bilim:intro-seen";

/** sessionStorage can throw (private mode, blocked cookies), so both ways are guarded. */
function wasSeen() {
  try {
    return sessionStorage.getItem(SEEN_KEY) === "1";
  } catch {
    return false;
  }
}
function markSeen() {
  try {
    sessionStorage.setItem(SEEN_KEY, "1");
  } catch {
    // Nothing to do: the intro simply plays again next time.
  }
}

/**
 * First-load curtain: the brand mark with a loading bar and a 000→100 counter, then the
 * curtain slides up to reveal the page. Plays once per session, and is hidden outright
 * without JavaScript or with reduced motion (see #site-intro in globals.css).
 */
export function IntroOverlay() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const counter = root.querySelector<HTMLElement>("[data-intro-count]");
    const bar = root.querySelector<HTMLElement>("[data-intro-bar]");
    const mark = root.querySelector<HTMLElement>("[data-intro-mark]");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduced || wasSeen()) {
      gsap.set(root, { display: "none" });
      markIntroDone();
      return;
    }

    markSeen();
    const { body } = document;
    const previousOverflow = body.style.overflow;
    body.style.overflow = "hidden";

    const loaded = { progress: 0 };
    const timeline = gsap.timeline({
      onComplete: () => {
        body.style.overflow = previousOverflow;
        gsap.set(root, { display: "none" });
        // The scrollbar comes back, so every trigger is measured again.
        ScrollTrigger.refresh();
      },
    });

    timeline
      .fromTo(mark, { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.4, ease: "power2.out" }, 0)
      .fromTo(bar, { scaleX: 0 }, { scaleX: 1, duration: 1, ease: "power2.inOut" }, 0.1)
      .to(
        loaded,
        {
          progress: 100,
          duration: 1,
          ease: "power2.inOut",
          onUpdate: () => {
            if (counter) counter.textContent = String(Math.round(loaded.progress)).padStart(3, "0");
          },
        },
        0.1
      )
      .to([mark, bar, counter], { autoAlpha: 0, duration: 0.25, ease: "power1.in" }, 1.15)
      .to(root, { clipPath: "inset(0% 0% 100% 0%)", duration: 0.7, ease: "power3.inOut" }, 1.25)
      // Above-the-fold reveals wait for this, so they start as the curtain lifts.
      .call(markIntroDone, undefined, 1.3);

    return () => {
      timeline.kill();
      markIntroDone();
      body.style.overflow = previousOverflow;
    };
  }, []);

  return (
    <div
      ref={rootRef}
      id="site-intro"
      aria-hidden
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#062434] [clip-path:inset(0%_0%_0%_0%)]"
    >
      <div className="flex w-[min(80vw,26rem)] flex-col items-center gap-6">
        <div data-intro-mark className="flex items-center gap-3 text-white">
          <span className="brand-gradient flex h-12 w-12 items-center justify-center rounded-2xl font-display text-lg font-bold">
            B
          </span>
          <span className="font-display text-2xl font-bold tracking-[-0.04em]">Bilim</span>
        </div>
        <div className="h-0.5 w-full overflow-hidden rounded-full bg-white/15">
          <div data-intro-bar className="h-full w-full origin-left bg-accent" />
        </div>
        <span
          data-intro-count
          className="font-display text-6xl font-bold tabular-nums tracking-[-0.05em] text-accent sm:text-7xl"
        >
          000
        </span>
      </div>
    </div>
  );
}
