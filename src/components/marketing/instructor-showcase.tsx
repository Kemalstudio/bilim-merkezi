"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CourseCover } from "@/components/courses/course-cover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { initials } from "@/lib/utils";

gsap.registerPlugin(ScrollTrigger);

export type InstructorItem = {
  name: string;
  title: string | null;
  avatar: string | null;
  category: { name: string; slug: string };
};

/**
 * Instructors as a list of oversized names. With a mouse, a large preview card of the
 * instructor's field trails the cursor and tilts into the movement; elsewhere (and without
 * motion) each row keeps its own cover strip, so the images are always there.
 */
export function InstructorShowcase({ items }: { items: InstructorItem[] }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const preview = previewRef.current;
    if (!root || !preview) return;

    const rows = Array.from(root.querySelectorAll<HTMLElement>("[data-row]"));
    const cards = Array.from(preview.querySelectorAll<HTMLElement>("[data-preview]"));
    const strips = Array.from(root.querySelectorAll<HTMLElement>("[data-cover-strip]"));

    const mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.from(rows, {
        y: 40,
        autoAlpha: 0,
        duration: 0.7,
        stagger: 0.08,
        ease: "power2.out",
        scrollTrigger: { trigger: root, start: "top 80%", once: true },
      });
    });

    mm.add("(prefers-reduced-motion: no-preference) and (hover: hover) and (pointer: fine)", () => {
      // The cursor carries the preview, so the inline strips are not needed.
      gsap.set(strips, { display: "none" });
      gsap.set(preview, { autoAlpha: 0, scale: 0.85, transformOrigin: "50% 50%" });

      const moveX = gsap.quickTo(preview, "x", { duration: 0.55, ease: "power3.out" });
      const moveY = gsap.quickTo(preview, "y", { duration: 0.55, ease: "power3.out" });
      const tiltTo = gsap.quickTo(preview, "rotation", { duration: 0.7, ease: "power3.out" });
      let lastX: number | null = null;

      const onMove = (event: PointerEvent) => {
        const bounds = root.getBoundingClientRect();
        const x = event.clientX - bounds.left;
        const y = event.clientY - bounds.top;
        moveX(x - preview.offsetWidth / 2);
        moveY(y - preview.offsetHeight / 2);
        // Lean into the direction of travel.
        if (lastX !== null) tiltTo(gsap.utils.clamp(-12, 12, (x - lastX) * 0.6));
        lastX = x;
      };

      const show = (index: number) => {
        gsap.to(preview, { autoAlpha: 1, scale: 1, duration: 0.35, ease: "power2.out", overwrite: "auto" });
        cards.forEach((card, i) => {
          gsap.to(card, { autoAlpha: i === index ? 1 : 0, duration: 0.3, overwrite: "auto" });
        });
      };

      const hide = () => {
        lastX = null;
        gsap.to(preview, { autoAlpha: 0, scale: 0.85, rotation: 0, duration: 0.3, ease: "power2.in", overwrite: "auto" });
      };

      root.addEventListener("pointermove", onMove);
      root.addEventListener("pointerleave", hide);
      const rowCleanups = rows.map((row, i) => {
        const onEnter = () => show(i);
        row.addEventListener("pointerenter", onEnter);
        return () => row.removeEventListener("pointerenter", onEnter);
      });

      return () => {
        root.removeEventListener("pointermove", onMove);
        root.removeEventListener("pointerleave", hide);
        rowCleanups.forEach((remove) => remove());
      };
    });

    return () => mm.revert();
  }, []);

  return (
    <div ref={rootRef} className="relative mt-14">
      <div
        ref={previewRef}
        aria-hidden
        className="pointer-events-none invisible absolute left-0 top-0 z-20 aspect-[4/5] w-[19rem] opacity-0"
      >
        {items.map((item) => (
          <div key={item.name} data-preview className="absolute inset-0 overflow-hidden rounded-[1.4rem] opacity-0 shadow-glow-lg">
            <CourseCover categorySlug={item.category.slug} className="h-full w-full" />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#03121b]/90 to-transparent p-5 pt-14 text-white">
              <p className="font-display text-lg font-bold leading-tight tracking-[-0.03em]">{item.name}</p>
              {item.title && <p className="mt-1 text-xs leading-5 text-white/70">{item.title}</p>}
            </div>
          </div>
        ))}
      </div>

      <ul>
        {items.map((item, i) => (
          <li key={item.name} data-row className="border-t border-border last:border-b">
            <div className="group relative flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 py-7 sm:py-9">
              <span
                aria-hidden
                className="absolute inset-x-0 top-0 h-px origin-left scale-x-0 bg-brand-ink transition-transform duration-500 group-hover:scale-x-100"
              />
              <span className="flex items-baseline gap-4">
                <span className="font-display text-xs font-bold text-muted">0{i + 1}</span>
                <span className="font-display text-[clamp(1.9rem,5vw,4.2rem)] font-bold leading-none tracking-[-0.05em] text-ink transition-colors duration-300 group-hover:text-brand-ink">
                  {item.name}
                </span>
              </span>
              <span className="flex items-center gap-3 sm:text-right">
                <Avatar className="h-10 w-10 shrink-0 rounded-xl sm:hidden">
                  <AvatarImage src={item.avatar ?? undefined} alt="" />
                  <AvatarFallback className="rounded-xl bg-surface-sunken text-xs font-bold text-brand-ink">
                    {initials(item.name)}
                  </AvatarFallback>
                </Avatar>
                <span>
                  <span className="block text-sm font-bold text-ink">{item.category.name}</span>
                  {item.title && <span className="mt-0.5 block text-xs leading-5 text-muted">{item.title}</span>}
                </span>
              </span>
            </div>
            <div data-cover-strip className="pb-6">
              <CourseCover categorySlug={item.category.slug} className="h-24 w-full rounded-2xl" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
