import { ScrollTrigger } from "gsap/ScrollTrigger";

const INTRO_DONE_EVENT = "bilim:intro-done";

/** Set on <html> by the root layout when scroll reveals are switched off in the admin panel. */
export const revealsDisabled = () => document.documentElement.dataset.reveals === "off";

/** Called by the intro curtain as it starts to lift. Safe to call more than once. */
export function markIntroDone() {
  const root = document.documentElement;
  if (root.dataset.introDone) return;
  root.dataset.introDone = "1";
  window.dispatchEvent(new Event(INTRO_DONE_EVENT));
}

/**
 * Runs `callback` once the first-load curtain is out of the way, or right away when there is
 * none (a repeat visit, reduced motion, a page outside the marketing layout). Returns a cancel.
 */
export function afterIntro(callback: () => void): () => void {
  const intro = document.getElementById("site-intro");
  const pending =
    intro && !document.documentElement.dataset.introDone && getComputedStyle(intro).display !== "none";

  if (!pending) {
    callback();
    return () => {};
  }

  window.addEventListener(INTRO_DONE_EVENT, callback, { once: true });
  return () => window.removeEventListener(INTRO_DONE_EVENT, callback);
}

/**
 * Plays a paused animation the first time `trigger` scrolls into view, but never behind the
 * intro curtain, so above-the-fold reveals are actually seen. Call it inside a gsap context
 * (matchMedia) so the trigger is reverted with it; the returned cleanup drops the intro listener.
 */
export function playOnEnter(animation: gsap.core.Animation, trigger: Element, start = "top 95%") {
  let cancel = () => {};

  ScrollTrigger.create({
    trigger,
    start,
    once: true,
    // restart(true) keeps the animation's own delay, which a plain play() would skip.
    onEnter: () => {
      cancel = afterIntro(() => animation.restart(true));
    },
  });

  return () => cancel();
}
