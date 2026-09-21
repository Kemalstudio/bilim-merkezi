"use client";

import { useEffect, useRef } from "react";
import { BrandMark } from "@/components/brand/brand-mark";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { markIntroDone } from "@/lib/scroll-reveal";

gsap.registerPlugin(ScrollTrigger);

/** Also read by the inline script in the root layout, which hides a seen intro before paint. */
export const INTRO_SEEN_KEY = "bilim:intro-seen";

/** sessionStorage can throw (private mode, blocked cookies), so both ways are guarded. */
function wasSeen() {
  try {
    return sessionStorage.getItem(INTRO_SEEN_KEY) === "1";
  } catch {
    return false;
  }
}
function markSeen() {
  try {
    sessionStorage.setItem(INTRO_SEEN_KEY, "1");
  } catch {
    // Nothing to do: the intro simply plays again next time.
  }
}

/**
 * First-load curtain: the brand mark, a thin loading bar and a percentage, then the curtain
 * lifts to reveal the page. Plays once per session.
 *
 * It is server-rendered, so it is on screen before the page's JavaScript arrives. Until then
 * CSS keeps the bar creeping forward (`intro-pending` in globals.css) so the curtain never
 * looks frozen; once hydrated, GSAP picks the bar up from wherever CSS left it. Without
 * JavaScript, with reduced motion, or on a repeat visit it is hidden before first paint, and
 * a CSS failsafe removes it if scripts stall.
 */
export function IntroOverlay() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const counter = root.querySelector<HTMLElement>("[data-intro-count]");
    const bar = root.querySelector<HTMLElement>("[data-intro-bar]");
    const content = root.querySelector<HTMLElement>("[data-intro-content]");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // The CSS failsafe already cleared the curtain (scripts took over 6 s): don't bring it back.
    const clearedByFailsafe = getComputedStyle(root).opacity !== "1";

    if (reduced || wasSeen() || clearedByFailsafe) {
      gsap.set(root, { display: "none" });
      markIntroDone();
      return;
    }

    markSeen();
    const { body } = document;
    const previousOverflow = body.style.overflow;
    body.style.overflow = "hidden";

    // Take over from the CSS: keep the bar where it has got to, and stop the failsafe.
    const startScale = bar ? Number(gsap.getProperty(bar, "scaleX")) || 0 : 0;
    root.style.animation = "none";
    if (bar) {
      bar.style.animation = "none";
      gsap.set(bar, { scaleX: startScale });
    }

    const loaded = { progress: Math.round(startScale * 100) };
    const render = () => {
      if (counter) counter.textContent = `${Math.round(loaded.progress)}%`;
    };
    render();

    const timeline = gsap.timeline({
      onComplete: () => {
        body.style.overflow = previousOverflow;
        gsap.set(root, { display: "none" });
        // The scrollbar comes back, so every trigger is measured again.
        ScrollTrigger.refresh();
      },
    });

    timeline
      .to(counter, { autoAlpha: 1, duration: 0.3, ease: "power1.out" }, 0)
      .to(bar, { scaleX: 1, duration: 0.9, ease: "power2.inOut" }, 0)
      .to(loaded, { progress: 100, duration: 0.9, ease: "power2.inOut", onUpdate: render }, 0)
      .to(content, { autoAlpha: 0, y: -12, duration: 0.3, ease: "power2.in" }, 1.05)
      .to(root, { clipPath: "inset(0% 0% 100% 0%)", duration: 0.75, ease: "power3.inOut" }, 1.15)
      // Above-the-fold reveals wait for this, so they start as the curtain lifts.
      .call(markIntroDone, undefined, 1.25);

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
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-[#062434] [clip-path:inset(0%_0%_0%_0%)]"
    >
      {/* A soft glow behind the mark, so the curtain has depth rather than a flat fill. */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[36rem] w-[36rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(63,208,201,0.16)_0%,rgba(6,36,52,0)_65%)]"
      />

      <div data-intro-content className="relative flex w-[min(78vw,20rem)] flex-col items-center gap-9">
        <div className="intro-mark flex items-center gap-3.5">
          <BrandMark className="h-14 w-14 drop-shadow-[0_0_28px_rgba(31,181,173,0.35)]" />
          <span className="flex flex-col leading-none">
            <span className="font-display text-[1.7rem] font-extrabold tracking-[-0.04em] text-white">BILIM</span>
            <span className="mt-1.5 text-[0.66rem] font-bold uppercase tracking-[0.34em] text-white/55">merkezi</span>
          </span>
        </div>

        <div className="flex w-full flex-col gap-3">
          <div className="h-[3px] w-full overflow-hidden rounded-full bg-white/10">
            <div
              data-intro-bar
              className="intro-bar h-full w-full origin-left rounded-full bg-gradient-to-r from-[#3fd0c9] to-accent"
            />
          </div>
          <span
            data-intro-count
            className="invisible self-end opacity-0 font-display text-xs font-semibold tabular-nums tracking-[0.08em] text-white/60"
          >
            0%
          </span>
        </div>
      </div>
    </div>
  );
}
