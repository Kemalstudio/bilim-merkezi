"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  ArrowRight,
  ArrowUpRight,
  Atom,
  Bot,
  Code,
  Cpu,
  Dna,
  FlaskConical,
  Globe,
  Landmark,
  Languages,
  MessageCircle,
  Mouse,
  Palette,
  Sigma,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Dictionary } from "@/lib/i18n/dictionaries";

gsap.registerPlugin(ScrollTrigger);

type Labels = Dictionary["gridZoom"];
type Tone = "paper" | "sunken" | "accent" | "ink";
type Tile = { subject: keyof Labels["subjects"]; Icon: LucideIcon; tone: Tone; href: string };

const toneStyles: Record<Tone, { tile: string; chip: string }> = {
  paper: { tile: "border-border bg-surface text-ink", chip: "bg-surface-sunken text-brand-ink" },
  sunken: { tile: "border-border bg-surface-sunken text-ink", chip: "bg-surface text-brand-ink" },
  accent: { tile: "border-accent bg-accent text-[#0b2233]", chip: "bg-[#0b2233] text-white" },
  ink: { tile: "border-panel bg-panel text-white", chip: "bg-white/10 text-accent" },
};

// Subjects without a catalog category of their own open the full catalog.
const CATALOG = "/courses";
const LANGUAGES = "/courses?category=languages";
const PROGRAMMING = "/courses?category=programming";
const DESIGN = "/courses?category=design";

/**
 * Three columns of four tiles. On zoom the side columns slide outwards and the centre
 * column splits in half, opening a space in the middle for the title and CTA.
 */
const gridColumns: Tile[][] = [
  [
    { subject: "math", Icon: Sigma, tone: "paper", href: CATALOG },
    { subject: "chemistry", Icon: FlaskConical, tone: "sunken", href: CATALOG },
    { subject: "english", Icon: Languages, tone: "accent", href: LANGUAGES },
    { subject: "history", Icon: Landmark, tone: "ink", href: CATALOG },
  ],
  [
    { subject: "physics", Icon: Atom, tone: "accent", href: CATALOG },
    { subject: "programming", Icon: Code, tone: "paper", href: PROGRAMMING },
    { subject: "robotics", Icon: Bot, tone: "sunken", href: PROGRAMMING },
    { subject: "geography", Icon: Globe, tone: "ink", href: CATALOG },
  ],
  [
    { subject: "german", Icon: MessageCircle, tone: "ink", href: LANGUAGES },
    { subject: "computerScience", Icon: Cpu, tone: "paper", href: PROGRAMMING },
    { subject: "design", Icon: Palette, tone: "sunken", href: DESIGN },
    { subject: "biology", Icon: Dna, tone: "accent", href: CATALOG },
  ],
];

const ZOOM_SCALE = 2.05;
// Tiles are brought fully into view clear of the sticky header and the bottom edge.
const VIEW_TOP = 96;
const VIEW_BOTTOM_GAP = 24;
// Point in the pinned timeline after which the copy is shown and the columns can be browsed.
const CONTENT_OPEN_AT = 1.1;

export function GridZoomSection({ labels }: { labels: Labels }) {
  const blockRef = useRef<HTMLElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const descriptionRef = useRef<HTMLParagraphElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const block = blockRef.current;
    const wrapper = wrapperRef.current;
    const scene = sceneRef.current;
    const grid = gridRef.current;
    const layer = layerRef.current;
    const content = contentRef.current;
    const title = titleRef.current;
    const description = descriptionRef.current;
    const button = buttonRef.current;
    const hint = hintRef.current;
    if (!block || !wrapper || !scene || !grid || !layer || !content || !title || !description || !button || !hint) return;

    const columnEls = Array.from(grid.querySelectorAll<HTMLElement>("[data-grid-column]"));
    const columns = columnEls.map((column) => Array.from(column.querySelectorAll<HTMLElement>("[data-grid-item]")));
    // Row by row, so a grid stagger can start from the spatial centre.
    const tilesByRow = columns[0].flatMap((_, row) => columns.map((column) => column[row]));

    // Until the grid opens the title sits alone in the centre; it then slides up to make
    // room for the description and button underneath.
    const getTitleOffsetY = () => ((content.offsetHeight - title.offsetHeight) / 2 / title.offsetHeight) * 100;

    const mm = gsap.matchMedia();

    mm.add(
      {
        motion: "(prefers-reduced-motion: no-preference)",
        reduced: "(prefers-reduced-motion: reduce)",
        mobile: "(max-width: 639px)",
        mouse: "(hover: hover) and (pointer: fine)",
      },
      (ctx) => {
        const { reduced, mobile, mouse } = ctx.conditions as Record<"reduced" | "mobile" | "mouse", boolean>;
        // Narrow screens stack the text taller, so the centre column needs to part further.
        const centerShift = mobile ? 60 : 40;
        // Without motion the opened layout is shown straight away.
        let isContentVisible = reduced;

        /** Zoom the grid: lateral columns move horizontally, central column items vertically. */
        const gridZoomTimeline = () => {
          const timeline = gsap.timeline({ paused: true, defaults: { duration: 1, ease: "power3.inOut" } });

          timeline.to(grid, { scale: ZOOM_SCALE });
          // The whole column moves (not its tiles), so its hover area follows what is visible.
          timeline.to(columnEls[0], { xPercent: -40 }, "<");
          timeline.to(columnEls[2], { xPercent: 40 }, "<");
          timeline.to(
            columns[1],
            {
              // Items above the midpoint move up, below move down.
              yPercent: (index: number) => (index < Math.floor(columns[1].length / 2) ? -1 : 1) * centerShift,
              duration: 0.5,
              ease: "power1.inOut",
            },
            "-=0.5"
          );

          return timeline;
        };

        /**
         * Browsing (mouse only): once the grid is open, the column under the cursor takes the
         * wheel and scrolls smoothly through all of its tiles; at either end the page scrolls on.
         */
        const setupBrowse = () => {
          const duration = reduced ? 0 : 0.8;
          const offsets = columnEls.map(() => 0);
          const moveTo = columnEls.map((column) => gsap.quickTo(column, "y", { duration, ease: "power3.out" }));
          let focused: number | null = null;
          let isLayerHidden = false;
          let releaseTimer = 0;

          const gridScale = () => Number(gsap.getProperty(grid, "scale")) || 1;

          // Visual offsets (px) that bring the column's first and last tiles fully into view.
          const range = (c: number) => {
            const tiles = columns[c];
            const shift = Number(gsap.getProperty(columnEls[c], "y")) * gridScale();
            const top = tiles[0].getBoundingClientRect().top - shift;
            const bottom = tiles[tiles.length - 1].getBoundingClientRect().bottom - shift;
            return {
              min: Math.min(0, window.innerHeight - VIEW_BOTTOM_GAP - bottom),
              max: Math.max(0, VIEW_TOP - top),
            };
          };

          const setOffset = ctx.add("setOffset", (c: number, value: number) => {
            offsets[c] = value;
            moveTo[c](value / gridScale());
            // Browsing the centre column runs its tiles through the middle, so the title steps aside.
            if (c === 1 && value !== 0 !== isLayerHidden) {
              isLayerHidden = value !== 0;
              gsap.to(layer, { autoAlpha: isLayerHidden ? 0 : 1, duration: reduced ? 0 : 0.35, overwrite: "auto" });
            }
          }) as (c: number, value: number) => void;

          const focusColumn = ctx.add("focusColumn", (c: number | null) => {
            focused = c;
            columnEls.forEach((column, i) => {
              gsap.to(column, {
                opacity: c === null || c === i ? 1 : 0.35,
                duration: reduced ? 0 : 0.4,
                overwrite: "auto",
              });
            });
            // Leaving the centre column hands the middle back to the title.
            if (c !== 1 && offsets[1] !== 0) setOffset(1, 0);
          }) as (c: number | null) => void;

          const removers = columnEls.map((column, c) => {
            const isOnTile = (target: EventTarget | null) => target instanceof Element && !!target.closest("[data-grid-item]");

            const onWheel = (event: WheelEvent) => {
              if (!isContentVisible) return;
              // Over the title the centre column's box is empty: only take the wheel from a tile,
              // or once this column is already being browsed.
              if (!isOnTile(event.target) && focused !== c) return;
              const delta = event.deltaMode === 1 ? event.deltaY * 16 : event.deltaY;
              const { min, max } = range(c);
              const next = gsap.utils.clamp(min, max, offsets[c] - delta);
              if (next === offsets[c]) return; // At the end: let the page scroll on.
              event.preventDefault();
              if (focused !== c) focusColumn(c);
              setOffset(c, next);
            };

            const onPointerOver = (event: PointerEvent) => {
              window.clearTimeout(releaseTimer);
              if (isContentVisible && focused !== c && isOnTile(event.target)) focusColumn(c);
            };

            const onPointerLeave = () => {
              releaseTimer = window.setTimeout(() => focusColumn(null), 250);
            };

            // Keyboard: scroll the column so the focused tile is in view.
            const onFocusIn = (event: FocusEvent) => {
              if (!isContentVisible || !(event.target instanceof Element)) return;
              const rect = event.target.getBoundingClientRect();
              const bottomLimit = window.innerHeight - VIEW_BOTTOM_GAP;
              let next = offsets[c];
              if (rect.top < VIEW_TOP) next += VIEW_TOP - rect.top;
              else if (rect.bottom > bottomLimit) next -= rect.bottom - bottomLimit;
              const { min, max } = range(c);
              setOffset(c, gsap.utils.clamp(min, max, next));
            };

            const onFocusOut = (event: FocusEvent) => {
              if (c === 1 && !column.contains(event.relatedTarget as Node | null)) setOffset(1, 0);
            };

            column.addEventListener("wheel", onWheel, { passive: false });
            column.addEventListener("pointerover", onPointerOver);
            column.addEventListener("pointerleave", onPointerLeave);
            column.addEventListener("focusin", onFocusIn);
            column.addEventListener("focusout", onFocusOut);

            return () => {
              column.removeEventListener("wheel", onWheel);
              column.removeEventListener("pointerover", onPointerOver);
              column.removeEventListener("pointerleave", onPointerLeave);
              column.removeEventListener("focusin", onFocusIn);
              column.removeEventListener("focusout", onFocusOut);
            };
          });

          return {
            reset: () => {
              window.clearTimeout(releaseTimer);
              focusColumn(null);
              columnEls.forEach((_, c) => setOffset(c, 0));
            },
            destroy: () => {
              window.clearTimeout(releaseTimer);
              removers.forEach((remove) => remove());
            },
          };
        };

        /** Mouse only: a tile tilts towards the cursor in 3D while a glare follows it. */
        const setupTileTilt = () => {
          const tiles = Array.from(grid.querySelectorAll<HTMLElement>("[data-tile]"));
          const removers = tiles.map((tile) => {
            const toX = gsap.quickTo(tile, "rotationX", { duration: 0.5, ease: "power3.out" });
            const toY = gsap.quickTo(tile, "rotationY", { duration: 0.5, ease: "power3.out" });
            const onMove = (event: PointerEvent) => {
              const rect = tile.getBoundingClientRect();
              const px = (event.clientX - rect.left) / rect.width;
              const py = (event.clientY - rect.top) / rect.height;
              toY((px - 0.5) * 16);
              toX((0.5 - py) * 16);
              tile.style.setProperty("--mx", `${px * 100}%`);
              tile.style.setProperty("--my", `${py * 100}%`);
            };
            const onLeave = () => {
              toX(0);
              toY(0);
            };
            tile.addEventListener("pointermove", onMove);
            tile.addEventListener("pointerleave", onLeave);
            return () => {
              tile.removeEventListener("pointermove", onMove);
              tile.removeEventListener("pointerleave", onLeave);
            };
          });
          return () => removers.forEach((remove) => remove());
        };

        if (reduced) {
          gridZoomTimeline().progress(1);
          const browse = mouse ? setupBrowse() : null;
          return () => browse?.destroy();
        }

        const browse = mouse ? setupBrowse() : null;
        const removeTilt = mouse ? setupTileTilt() : null;

        /** The scene counter-moves while the block slides in, so it appears fixed. */
        const addParallaxOnScroll = () => {
          gsap.from(scene, {
            yPercent: -100,
            ease: "none",
            scrollTrigger: { trigger: block, start: "top bottom", end: "top top", scrub: true },
          });
        };

        /** Meanwhile the tiles fly in from around the grid, centre first. */
        const assembleTilesOnScroll = () => {
          const centre = () => ({
            x: grid.offsetLeft + grid.offsetWidth / 2,
            y: grid.offsetTop + grid.offsetHeight / 2,
          });
          // Offsets use layout (offsetLeft/Top), so transforms applied later do not skew them.
          const fromCentre = (tile: HTMLElement) => ({
            x: tile.offsetLeft + tile.offsetWidth / 2 - centre().x,
            y: tile.offsetTop + tile.offsetHeight / 2 - centre().y,
          });

          gsap.from(tilesByRow, {
            x: (_: number, tile: HTMLElement) => fromCentre(tile).x * 1.1,
            y: (_: number, tile: HTMLElement) => fromCentre(tile).y * 1.1 + 80,
            rotation: (i: number) => (((i * 47) % 13) - 6) * 2.4,
            scale: 0.5,
            opacity: 0,
            ease: "power2.out",
            stagger: { grid: [columns[0].length, columns.length], from: "center", amount: 0.5 },
            scrollTrigger: { trigger: block, start: "top bottom", end: "top 15%", scrub: 1, invalidateOnRefresh: true },
          });
        };

        /** The title fades in when the block reaches 57% of the viewport height. */
        const animateTitleOnScroll = () => {
          gsap.from(title, {
            opacity: 0,
            duration: 0.7,
            ease: "power1.out",
            scrollTrigger: { trigger: block, start: "top 57%", toggleActions: "play none none reset" },
          });
        };

        /**
         * Pinned: the grid opens with the scroll, the copy settles in, and the side columns
         * drift in opposite directions so every tile passes through view.
         */
        const createPinnedTimeline = () => {
          // Half the column's overflow at full zoom, as a percentage of its height.
          const drift = (c: number) => {
            const column = columnEls[c];
            const visible = (window.innerHeight - VIEW_TOP - VIEW_BOTTOM_GAP) / ZOOM_SCALE;
            return Math.max(0, ((column.offsetHeight - visible) / column.offsetHeight) * 50);
          };

          const timeline = gsap.timeline({
            defaults: { ease: "none" },
            scrollTrigger: {
              trigger: block,
              start: "top top",
              end: "+=170%",
              scrub: 0.8,
              pin: wrapper,
              invalidateOnRefresh: true,
            },
            onUpdate: () => {
              const isOpen = timeline.time() >= CONTENT_OPEN_AT;
              if (isOpen === isContentVisible) return;
              isContentVisible = isOpen;
              if (!isOpen) browse?.reset();
            },
          });

          timeline
            .add(gridZoomTimeline().paused(false), 0)
            // Left column shows its top, then its bottom; the right column the other way round.
            .fromTo(columnEls[0], { yPercent: 0 }, { yPercent: () => drift(0), duration: 0.8, ease: "power1.inOut" }, 0.2)
            .to(columnEls[0], { yPercent: () => -drift(0), duration: 1.2, ease: "power1.inOut" }, 1)
            .fromTo(columnEls[2], { yPercent: 0 }, { yPercent: () => -drift(2), duration: 0.8, ease: "power1.inOut" }, 0.2)
            .to(columnEls[2], { yPercent: () => drift(2), duration: 1.2, ease: "power1.inOut" }, 1)
            .fromTo(
              title,
              { yPercent: () => getTitleOffsetY() },
              { yPercent: 0, duration: 0.6, ease: "power2.inOut" },
              0.55
            )
            .fromTo(
              [description, button, hint],
              { autoAlpha: 0, y: 16 },
              { autoAlpha: 1, y: 0, duration: 0.4, stagger: 0.08, ease: "power1.out" },
              0.8
            )
            // Hold on the open grid before the pin releases.
            .to({}, { duration: 0.3 });
        };

        addParallaxOnScroll();
        assembleTilesOnScroll();
        animateTitleOnScroll();
        createPinnedTimeline();

        return () => {
          browse?.destroy();
          removeTilt?.();
        };
      },
      block
    );

    return () => mm.revert();
  }, []);

  return (
    <section ref={blockRef} aria-labelledby="grid-zoom-title" className="relative overflow-clip [--tile:min(15svh,26vw,10.5rem)]">
      <div ref={wrapperRef} className="relative h-svh min-h-[36rem] overflow-clip">
        <div ref={sceneRef} className="absolute inset-0 flex items-center justify-center">
          <div ref={gridRef} className="flex gap-3 sm:gap-4">
            {gridColumns.map((column, c) => (
              <ul key={c} data-grid-column className="flex w-[var(--tile)] flex-col gap-3 sm:gap-4">
                {column.map(({ subject, Icon, tone, href }, r) => (
                  <li key={subject} data-grid-item className="[perspective:700px]">
                    <Link
                      href={href}
                      data-tile
                      className={cn(
                        "group relative flex aspect-[4/5] flex-col justify-between overflow-hidden rounded-[1.1rem] border p-2.5 outline-none transition-shadow duration-300 hover:shadow-glow-md focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:rounded-[1.35rem] sm:p-3.5",
                        toneStyles[tone].tile
                      )}
                    >
                      <Icon
                        aria-hidden
                        className="pointer-events-none absolute -bottom-[12%] -right-[12%] h-[62%] w-[62%] opacity-[0.08]"
                        strokeWidth={1.4}
                      />
                      <div className="relative flex items-start justify-between">
                        <span
                          className={cn(
                            "flex h-7 w-7 items-center justify-center rounded-lg sm:h-9 sm:w-9 sm:rounded-xl",
                            toneStyles[tone].chip
                          )}
                        >
                          <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={1.8} />
                        </span>
                        <span className="relative flex h-5 items-center sm:h-6">
                          <span className="font-display text-[0.6rem] font-bold opacity-45 transition-opacity duration-300 group-hover:opacity-0 sm:text-[0.7rem]">
                            {String(c * column.length + r + 1).padStart(2, "0")}
                          </span>
                          <ArrowUpRight
                            aria-hidden
                            className="absolute right-0 h-3.5 w-3.5 -translate-x-1 translate-y-1 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:translate-y-0 group-hover:opacity-100 sm:h-4 sm:w-4"
                          />
                        </span>
                      </div>
                      <span className="relative font-display text-[0.68rem] font-bold leading-tight tracking-[-0.02em] sm:text-sm">
                        {labels.subjects[subject]}
                      </span>
                      <span
                        aria-hidden
                        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_var(--mx,50%)_var(--my,50%),rgba(255,255,255,0.35),transparent_55%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            ))}
          </div>

          <div ref={layerRef} className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center px-6">
            <div
              ref={contentRef}
              className="relative flex max-w-[min(34rem,calc(var(--tile)*3.6))] flex-col items-center text-center"
            >
              <div
                aria-hidden
                className="absolute -inset-x-20 -inset-y-16 -z-10 bg-[radial-gradient(closest-side,var(--color-background)_40%,transparent)]"
              />
              <h2
                id="grid-zoom-title"
                ref={titleRef}
                className="font-display text-[clamp(1.75rem,3.8vw,3.4rem)] font-bold leading-none tracking-[-0.055em] text-ink"
              >
                {labels.title}
              </h2>
              <p ref={descriptionRef} className="mt-4 text-sm leading-6 text-muted sm:mt-5 sm:text-base sm:leading-7">
                {labels.description}
              </p>
              <div ref={buttonRef} className="pointer-events-auto mt-6 sm:mt-7">
                <Button asChild size="lg">
                  <Link href="/courses">
                    {labels.cta} <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
              <p
                ref={hintRef}
                className="mt-4 hidden items-center gap-1.5 text-xs font-semibold text-muted [@media(hover:hover)_and_(pointer:fine)]:flex"
              >
                <Mouse aria-hidden className="h-3.5 w-3.5" />
                {labels.browseHint}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
