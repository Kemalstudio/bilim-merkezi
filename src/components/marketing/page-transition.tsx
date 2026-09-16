"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const BELOW = "inset(100% 0% 0% 0%)";
const COVER = "inset(0% 0% 0% 0%)";
const ABOVE = "inset(0% 0% 100% 0%)";
// If a navigation never lands, the curtain lifts anyway rather than trapping the visitor.
const SAFETY_MS = 2500;

/**
 * Route curtain: a plain left-click on an internal link raises the curtain, the navigation
 * happens behind it, and it lifts again once the new page is in. Skipped entirely without
 * motion (and without JavaScript the curtain stays hidden).
 */
export function PageTransition() {
  const curtainRef = useRef<HTMLDivElement>(null);
  const isCovering = useRef(false);
  const safetyTimer = useRef(0);
  const pathname = usePathname();
  const router = useRouter();

  // Lift the curtain once the new page has rendered (before the browser paints it).
  useLayoutEffect(() => {
    const curtain = curtainRef.current;
    if (!curtain || !isCovering.current) return;

    isCovering.current = false;
    window.clearTimeout(safetyTimer.current);

    gsap
      .timeline({
        onComplete: () => {
          gsap.set(curtain, { display: "none", clipPath: BELOW });
          ScrollTrigger.refresh();
        },
      })
      .to(curtain, { clipPath: ABOVE, duration: 0.6, ease: "power3.inOut" })
      .to(curtain.querySelector("[data-curtain-mark]"), { autoAlpha: 0, duration: 0.2 }, 0);
  }, [pathname]);

  useEffect(() => {
    const curtain = curtainRef.current;
    if (!curtain) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const cover = (go: () => void) => {
      isCovering.current = true;
      gsap.set(curtain, { display: "flex", clipPath: BELOW });
      gsap
        .timeline({ onComplete: go })
        .to(curtain, { clipPath: COVER, duration: 0.5, ease: "power3.inOut" })
        .fromTo(
          curtain.querySelector("[data-curtain-mark]"),
          { autoAlpha: 0, y: 16 },
          { autoAlpha: 1, y: 0, duration: 0.3, ease: "power2.out" },
          0.2
        );

      safetyTimer.current = window.setTimeout(() => {
        if (!isCovering.current) return;
        isCovering.current = false;
        gsap.to(curtain, {
          clipPath: ABOVE,
          duration: 0.5,
          ease: "power3.inOut",
          onComplete: () => gsap.set(curtain, { display: "none", clipPath: BELOW }),
        });
      }, SAFETY_MS);
    };

    const onClick = (event: MouseEvent) => {
      // Everything unusual — new tab, modifier keys, downloads, other origins — is left alone.
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (isCovering.current) return;

      const target = event.target;
      const link = target instanceof Element ? target.closest("a") : null;
      if (!(link instanceof HTMLAnchorElement) || !link.href) return;
      if ((link.target && link.target !== "_self") || link.hasAttribute("download")) return;
      if (link.dataset.noTransition !== undefined) return;

      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      // Same page, or an in-page anchor such as #enroll: let the browser do its thing.
      if (url.pathname === window.location.pathname) return;

      event.preventDefault();
      cover(() => router.push(url.pathname + url.search + url.hash));
    };

    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("click", onClick);
      window.clearTimeout(safetyTimer.current);
    };
  }, [router]);

  return (
    <div
      ref={curtainRef}
      id="page-curtain"
      aria-hidden
      className="fixed inset-0 z-[90] hidden items-center justify-center bg-[#062434]"
      style={{ clipPath: BELOW }}
    >
      <div data-curtain-mark className="flex items-center gap-3 text-white opacity-0">
        <span className="brand-gradient flex h-12 w-12 items-center justify-center rounded-2xl font-display text-lg font-bold">
          B
        </span>
        <span className="font-display text-2xl font-bold tracking-[-0.04em]">Bilim</span>
      </div>
    </div>
  );
}
