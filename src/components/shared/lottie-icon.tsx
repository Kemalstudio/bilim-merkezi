"use client";

import { useEffect, useRef, useState } from "react";
import { DotLottieReact, setWasmUrl, type DotLottie } from "@lottiefiles/dotlottie-react";
import { cn } from "@/lib/utils";

// The renderer is served from our own origin (copied by scripts/copy-lottie-wasm.mjs), so no
// request ever goes to a CDN. An explicit URL also switches off the library's CDN fallback.
setWasmUrl("/lottie/dotlottie-player.wasm");

/**
 * - `loop`: plays continuously while on screen.
 * - `once`: plays one time and stays on its end (or `playTo`) frame.
 * - `hover`: rests on a still frame and plays once each time the pointer enters (or keyboard
 *   focus reaches) the nearest `[data-lottie-hover]` or `.group` ancestor — the whole card.
 */
export type LottieTrigger = "loop" | "once" | "hover";

/**
 * An animated icon from /public/lottie. Decorative: the meaning is always carried by the text
 * next to it. With reduced motion it only ever shows its still frame, and the player freezes
 * itself while off screen.
 */
export function LottieIcon({
  src,
  className,
  trigger = "loop",
  playTo,
  staticAt,
}: {
  /** Path under /public, e.g. "/lottie/success.json". */
  src: string;
  className?: string;
  trigger?: LottieTrigger;
  /** Stop point as a fraction of the animation, for files that fade out at the end. */
  playTo?: number;
  /** Still frame (reduced motion, and at rest for `hover`) as a fraction; defaults to `playTo`, then the end. */
  staticAt?: number;
}) {
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const [player, setPlayer] = useState<DotLottie | null>(null);
  const [reduced, setReduced] = useState<boolean | null>(null);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!player || reduced === null) return;

    const frameAt = (fraction: number) => Math.round(Math.max(0, player.totalFrames - 1) * fraction);
    const stillFrame = () => frameAt(staticAt ?? playTo ?? 1);

    const settle = () => {
      if (playTo !== undefined && playTo < 1) player.setSegment(0, frameAt(playTo));
      if (reduced || trigger === "hover") {
        player.pause();
        player.setFrame(stillFrame());
      } else {
        player.play();
      }
    };
    const replay = () => {
      if (!player.isLoaded || player.isPlaying) return;
      player.setFrame(0);
      player.play();
    };
    const backToStill = () => {
      if (trigger === "hover") player.setFrame(stillFrame());
    };

    if (player.isLoaded) settle();
    player.addEventListener("load", settle);
    player.addEventListener("complete", backToStill);

    const target =
      trigger === "hover" && !reduced
        ? wrapperRef.current?.closest<HTMLElement>("[data-lottie-hover], .group") ?? wrapperRef.current
        : null;
    target?.addEventListener("pointerenter", replay);
    target?.addEventListener("focusin", replay);

    return () => {
      player.removeEventListener("load", settle);
      player.removeEventListener("complete", backToStill);
      target?.removeEventListener("pointerenter", replay);
      target?.removeEventListener("focusin", replay);
    };
  }, [player, reduced, trigger, playTo, staticAt]);

  return (
    <span ref={wrapperRef} aria-hidden className={cn("inline-block", className)}>
      <DotLottieReact
        src={src}
        loop={trigger === "loop"}
        autoplay={false}
        dotLottieRefCallback={setPlayer}
        renderConfig={{ autoResize: true, freezeOnOffscreen: true }}
        className="h-full w-full"
      />
    </span>
  );
}
