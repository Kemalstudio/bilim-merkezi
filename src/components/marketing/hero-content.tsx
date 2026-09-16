"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { animate, stagger } from "animejs";
import { Button } from "@/components/ui/button";
import { afterIntro } from "@/lib/scroll-reveal";

type HeroLabels = {
  badge: string;
  titleStart: string;
  titleHighlight: string;
  subtitle: string;
  ctaPrimary: string;
  ctaSecondary: string;
  stats: { students: string; courses: string; rating: string };
};

export function HeroContent({
  labels,
}: {
  labels: HeroLabels;
}) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const fadeItems = root.querySelectorAll<HTMLElement>(".hero-fade-item");
    let anim: ReturnType<typeof animate> | undefined;
    // Waits for the intro curtain, otherwise the entrance would play unseen behind it.
    const cancel = afterIntro(() => {
      anim = animate(fadeItems, {
        opacity: [0.72, 1],
        translateY: [18, 0],
        duration: 620,
        delay: stagger(75),
        ease: "outQuad",
      });
    });

    return () => {
      cancel();
      anim?.revert();
    };
  }, []);

  return (
    <div ref={rootRef} className="min-w-0 max-w-3xl text-left text-white">
      {/* The data-hero-* wrappers are moved by HeroStage; anime.js animates the items inside. */}
      <div data-hero-aside>
        <span className="hero-fade-item flex w-fit max-w-full items-start gap-2 rounded-2xl border border-white/12 bg-white/[0.07] px-3.5 py-2 text-[0.64rem] font-bold uppercase leading-4 tracking-[0.1em] text-white/75 backdrop-blur-sm sm:items-center sm:rounded-full sm:text-[0.7rem] sm:tracking-[0.12em]">
          <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-accent shadow-[0_0_0_5px_rgba(230,230,230,0.12)] sm:mt-0" />
          {labels.badge}
        </span>
      </div>
      <div data-hero-title className="mt-7">
        <h1 className="hero-fade-item max-w-full break-words font-display text-[2.42rem] font-bold leading-[0.98] tracking-[-0.06em] text-white sm:text-6xl lg:text-[4.65rem]">
          {labels.titleStart}{" "}
          <span className="text-accent">{labels.titleHighlight}</span>
        </h1>
      </div>
      <div data-hero-aside className="mt-7">
        <p className="hero-fade-item max-w-xl text-balance text-base leading-7 text-white/68 sm:text-lg">
          {labels.subtitle}
        </p>
      </div>
      <div data-hero-aside className="mt-9">
        <div className="hero-fade-item flex flex-col gap-3 sm:flex-row">
          <Button
            asChild
            size="lg"
            className="group !border-accent !bg-accent !text-[#0b2233] shadow-none hover:!border-accent-soft hover:!bg-accent-soft"
          >
            <Link href="/courses">
              {labels.ctaPrimary}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="border-white/20 bg-white/[0.04] text-white hover:border-white/40 hover:bg-white/[0.08]"
          >
            <Link href="#results">{labels.ctaSecondary}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
