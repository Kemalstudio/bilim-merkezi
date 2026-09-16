"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * Children dealt out like a hand of cards. On wider screens they start gathered in a fanned
 * stack at the centre and spread to their places with the scroll, their contents
 * ([data-deal]) settling in last; with a mouse each card then tilts towards the cursor.
 * Each child should be a positioned wrapper whose first element is the card (the tilt target).
 */
export function CardDeck({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const deck = ref.current;
    if (!deck) return;

    const slots = Array.from(deck.children) as HTMLElement[];
    const mm = gsap.matchMedia();

    mm.add("(min-width: 640px) and (prefers-reduced-motion: no-preference)", () => {
      const middle = (slots.length - 1) / 2;
      // Layout offsets (offsetLeft), so the tween's own transforms never skew the stack.
      const toCentre = (slot: HTMLElement) => deck.offsetWidth / 2 - (slot.offsetLeft + slot.offsetWidth / 2);

      // The middle card sits on top of the stack.
      gsap.set(slots, { zIndex: (i: number) => slots.length - Math.round(Math.abs(i - middle) * 2) });

      gsap
        .timeline({
          scrollTrigger: { trigger: deck, start: "top 88%", end: "top 35%", scrub: 0.9, invalidateOnRefresh: true },
        })
        .fromTo(
          slots,
          {
            x: (i: number, slot: HTMLElement) => toCentre(slot) + (i - middle) * 28,
            y: (i: number) => 80 + Math.abs(i - middle) * 24,
            rotation: (i: number) => (i - middle) * 9,
            rotationY: (i: number) => (i - middle) * -14,
            scale: 0.84,
            transformOrigin: "50% 100%",
          },
          {
            x: 0,
            y: 0,
            rotation: 0,
            rotationY: 0,
            scale: 1,
            duration: 1,
            ease: "power3.out",
            stagger: { each: 0.08, from: "center" },
          },
          0
        )
        .fromTo(
          deck.querySelectorAll("[data-deal]"),
          { y: 14, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.3, stagger: 0.04, ease: "power2.out" },
          0.7
        );
    });

    // Stacked in one column on phones: a simple rise instead of the deal.
    mm.add("(max-width: 639px) and (prefers-reduced-motion: no-preference)", () => {
      gsap.from(slots, {
        y: 40,
        opacity: 0,
        duration: 0.7,
        stagger: 0.1,
        ease: "power2.out",
        scrollTrigger: { trigger: deck, start: "top 85%", once: true },
      });
    });

    mm.add("(min-width: 640px) and (prefers-reduced-motion: no-preference) and (hover: hover) and (pointer: fine)", () => {
      const removers = slots.map((slot) => {
        const card = slot.firstElementChild;
        if (!(card instanceof HTMLElement)) return () => {};

        const toX = gsap.quickTo(card, "rotationX", { duration: 0.6, ease: "power3.out" });
        const toY = gsap.quickTo(card, "rotationY", { duration: 0.6, ease: "power3.out" });
        const onMove = (event: PointerEvent) => {
          const rect = card.getBoundingClientRect();
          toY(((event.clientX - rect.left) / rect.width - 0.5) * 12);
          toX((0.5 - (event.clientY - rect.top) / rect.height) * 12);
        };
        const onLeave = () => {
          toX(0);
          toY(0);
        };

        card.addEventListener("pointermove", onMove);
        card.addEventListener("pointerleave", onLeave);
        return () => {
          card.removeEventListener("pointermove", onMove);
          card.removeEventListener("pointerleave", onLeave);
        };
      });
      return () => removers.forEach((remove) => remove());
    });

    return () => mm.revert();
  }, []);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
