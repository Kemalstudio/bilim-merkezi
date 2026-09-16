"use client";

import type { ComponentType } from "react";
import { gsap } from "gsap";

/**
 * Illustrations for the journey scenes, one per stage, each with a scroll-scrubbed animation
 * of its details that the section places on its timeline at `at`.
 */
type Animate = (timeline: gsap.core.Timeline, root: HTMLElement, at: number) => void;

export type JourneyScene = { Art: ComponentType; animate: Animate };

const svgProps = { viewBox: "0 0 600 600", "aria-hidden": true, className: "h-full w-full" } as const;

/* 8th grade — the foundation: a stack of books with an apple on top. */

const books = [
  { x: 110, y: 440, w: 380, h: 72, fill: "#062434", band: "#f4a83a", tilt: 0 },
  { x: 145, y: 372, w: 320, h: 66, fill: "#e2604f", band: "#ffffff", tilt: -3 },
  { x: 128, y: 314, w: 344, h: 56, fill: "#ffffff", band: "#0b6a8f", tilt: 2 },
  { x: 170, y: 258, w: 274, h: 54, fill: "#0b6a8f", band: "#f0b968", tilt: -2 },
  { x: 156, y: 208, w: 296, h: 48, fill: "#f0b968", band: "#062434", tilt: 3 },
];

const symbols = [
  { x: 88, y: 170, text: "π" },
  { x: 500, y: 150, text: "Σ" },
  { x: 520, y: 330, text: "a²" },
  { x: 70, y: 360, text: "√" },
];

function FoundationArt() {
  return (
    <svg {...svgProps}>
      <circle cx="300" cy="330" r="240" fill="#ffdfa8" />
      <ellipse cx="300" cy="522" rx="210" ry="22" fill="#0b2233" opacity="0.14" />

      {symbols.map((symbol) => (
        <text
          key={symbol.text}
          data-s1-float
          x={symbol.x}
          y={symbol.y}
          className="font-display"
          fontSize="46"
          fontWeight="700"
          fill="#0b2233"
          opacity="0.75"
        >
          {symbol.text}
        </text>
      ))}

      {books.map((book, i) => (
        <g key={i} data-s1-book>
          <g transform={`rotate(${book.tilt} ${book.x + book.w / 2} ${book.y + book.h / 2})`}>
            <rect x={book.x} y={book.y} width={book.w} height={book.h} rx="10" fill={book.fill} stroke="#0b2233" strokeWidth="3" />
            <rect x={book.x + book.w - 26} y={book.y + 8} width="14" height={book.h - 16} rx="3" fill="#ffffff" opacity="0.85" />
            <rect x={book.x + 24} y={book.y + book.h / 2 - 5} width={book.w * 0.45} height="10" rx="5" fill={book.band} opacity="0.9" />
          </g>
        </g>
      ))}

      <g data-s1-apple>
        <path d="M300 150 q-4 -18 8 -28" fill="none" stroke="#0b2233" strokeWidth="4" strokeLinecap="round" />
        <path d="M306 128 q22 -12 34 4 q-20 10 -34 -4 z" fill="#0b6a8f" />
        <circle cx="300" cy="178" r="32" fill="#e2604f" stroke="#0b2233" strokeWidth="3" />
        <circle cx="288" cy="166" r="7" fill="#ffffff" opacity="0.6" />
      </g>
    </svg>
  );
}

const animateFoundation: Animate = (timeline, root, at) => {
  const $ = gsap.utils.selector(root);
  timeline
    .fromTo(
      $("[data-s1-book]"),
      { y: -420, rotation: (i: number) => (i % 2 ? 10 : -10), opacity: 0, transformOrigin: "50% 50%" },
      { y: 0, rotation: 0, opacity: 1, duration: 0.3, stagger: 0.1, ease: "back.out(1.3)" },
      at
    )
    .fromTo($("[data-s1-float]"), { y: 30, opacity: 0 }, { y: 0, opacity: 0.75, duration: 0.25, stagger: 0.06 }, at + 0.3)
    .fromTo($("[data-s1-apple]"), { y: -320, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3, ease: "bounce.out" }, at + 0.55);
};

/* 9th–10th grade — the system: subjects on an orbit, all linked to one plan. */

// Points on a 150-unit orbit and a 240-unit outer ring, written out (no trig in render).
const orbitNodes = [
  { x: 450, y: 300, glyph: "π" },
  { x: 375, y: 430, glyph: "Aa" },
  { x: 225, y: 430, glyph: "√" },
  { x: 150, y: 300, glyph: "%" },
  { x: 225, y: 170, glyph: "{ }" },
  { x: 375, y: 170, glyph: "x²" },
];
const outerDots = [
  [540, 300],
  [470, 470],
  [300, 540],
  [130, 470],
  [60, 300],
  [130, 130],
  [300, 60],
  [470, 130],
];

function SystemArt() {
  return (
    <svg {...svgProps}>
      <circle cx="300" cy="300" r="280" fill="#f4a83a" opacity="0.05" />
      <g data-s2-system>
        <circle data-s2-ring cx="300" cy="300" r="240" fill="none" stroke="#ffffff" strokeOpacity="0.1" strokeWidth="2" strokeDasharray="4 10" />
        <circle data-s2-ring cx="300" cy="300" r="150" fill="none" stroke="#ffffff" strokeOpacity="0.16" strokeWidth="2" />
        {outerDots.map(([x, y]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="5" fill="#f4a83a" opacity="0.5" />
        ))}

        {orbitNodes.map((node) => (
          <line key={`spoke-${node.glyph}`} data-s2-line x1="300" y1="300" x2={node.x} y2={node.y} stroke="#f4a83a" strokeOpacity="0.55" strokeWidth="2" />
        ))}
        {orbitNodes.map((node, i) => {
          const next = orbitNodes[(i + 1) % orbitNodes.length];
          return (
            <line
              key={`link-${node.glyph}`}
              data-s2-line
              x1={node.x}
              y1={node.y}
              x2={next.x}
              y2={next.y}
              stroke="#ffffff"
              strokeOpacity="0.22"
              strokeWidth="2"
            />
          );
        })}

        {orbitNodes.map((node) => (
          <g key={node.glyph} data-s2-node>
            <circle cx={node.x} cy={node.y} r="34" fill="#0d4157" stroke="#f4a83a" strokeWidth="3" />
            <text
              x={node.x}
              y={node.y}
              textAnchor="middle"
              dominantBaseline="central"
              className="font-display"
              fontSize="24"
              fontWeight="700"
              fill="#ffffff"
            >
              {node.glyph}
            </text>
          </g>
        ))}

        <g data-s2-core>
          <circle cx="300" cy="300" r="64" fill="#f4a83a" />
          <circle cx="300" cy="300" r="40" fill="none" stroke="#062434" strokeWidth="6" />
          <circle cx="300" cy="300" r="16" fill="#062434" />
        </g>
      </g>
    </svg>
  );
}

const animateSystem: Animate = (timeline, root, at) => {
  const $ = gsap.utils.selector(root);
  timeline
    .fromTo($("[data-s2-system]"), { rotation: -20, svgOrigin: "300 300" }, { rotation: 10, duration: 1.1 }, at)
    .fromTo(
      $("[data-s2-ring]"),
      { scale: 0.6, opacity: 0, transformOrigin: "50% 50%" },
      { scale: 1, opacity: 1, duration: 0.4, stagger: 0.1, ease: "power2.out" },
      at
    )
    .fromTo(
      $("[data-s2-core]"),
      { scale: 0, transformOrigin: "50% 50%" },
      { scale: 1, duration: 0.25, ease: "back.out(2)" },
      at + 0.1
    )
    .fromTo($("[data-s2-line]"), { drawSVG: "0%" }, { drawSVG: "100%", duration: 0.3, stagger: 0.04 }, at + 0.15)
    .fromTo(
      $("[data-s2-node]"),
      { scale: 0, transformOrigin: "50% 50%" },
      { scale: 1, duration: 0.15, stagger: 0.06, ease: "back.out(2.5)" },
      at + 0.3
    );
};

/* 11th grade — the result: a diploma, a "92" seal and a burst of confetti. */

const confettiColors = ["#062434", "#f4a83a", "#ffffff", "#e2604f", "#0b6a8f"];
// Deterministic pieces (integer LCG, no trig), so server and client render identical markup.
let seed = 11;
const random = () => {
  seed = (seed * 16807) % 2147483647;
  return seed / 2147483647;
};
const confetti: Array<{ x: number; y: number; w: number; h: number; r: number; color: string }> = [];
while (confetti.length < 34) {
  const x = Math.round(40 + random() * 520);
  const y = Math.round(40 + random() * 520);
  // Keep the middle clear for the diploma.
  if ((x - 300) ** 2 + (y - 300) ** 2 < 190 ** 2) continue;
  confetti.push({
    x,
    y,
    w: Math.round(8 + random() * 7),
    h: Math.round(14 + random() * 10),
    r: Math.round(random() * 180),
    color: confettiColors[confetti.length % confettiColors.length],
  });
}

function ResultArt() {
  return (
    <svg {...svgProps}>
      <circle cx="300" cy="300" r="250" fill="#c9dbe8" />

      {confetti.map((piece, i) => (
        <g key={i} data-s3-confetti data-x={piece.x} data-y={piece.y}>
          <rect
            x={piece.x - piece.w / 2}
            y={piece.y - piece.h / 2}
            width={piece.w}
            height={piece.h}
            rx="2"
            fill={piece.color}
            transform={`rotate(${piece.r} ${piece.x} ${piece.y})`}
          />
        </g>
      ))}

      <g data-s3-paper>
        <g transform="rotate(-6 300 290)">
          <rect x="120" y="170" width="360" height="250" rx="16" fill="#ffffff" stroke="#0b2233" strokeWidth="3" />
          <rect x="140" y="190" width="320" height="210" rx="10" fill="none" stroke="#f0b968" strokeWidth="3" strokeDasharray="2 8" />
          <rect x="200" y="222" width="200" height="14" rx="7" fill="#0b2233" />
          <rect x="230" y="250" width="140" height="8" rx="4" fill="#0b2233" opacity="0.35" />
          <rect x="170" y="290" width="200" height="8" rx="4" fill="#0b2233" opacity="0.25" />
          <rect x="170" y="310" width="170" height="8" rx="4" fill="#0b2233" opacity="0.25" />
          <rect x="170" y="330" width="185" height="8" rx="4" fill="#0b2233" opacity="0.25" />
          <path d="M170 378 c20 -14 34 10 54 -4 s30 8 44 -6" fill="none" stroke="#0b6a8f" strokeWidth="3" strokeLinecap="round" />
        </g>
      </g>

      <g data-s3-seal>
        <path d="M378 420 L360 486 L386 474 L398 500 L412 432 Z" fill="#2bb3a6" />
        <path d="M430 420 L448 486 L422 474 L410 500 L396 432 Z" fill="#c04a3a" />
        <circle cx="404" cy="392" r="62" fill="#e2604f" stroke="#0b2233" strokeWidth="3" />
        <circle cx="404" cy="392" r="48" fill="none" stroke="#ffffff" strokeWidth="2" strokeDasharray="3 5" />
        <text
          x="404"
          y="392"
          textAnchor="middle"
          dominantBaseline="central"
          className="font-display"
          fontSize="40"
          fontWeight="800"
          fill="#ffffff"
        >
          92
        </text>
      </g>
    </svg>
  );
}

const animateResult: Animate = (timeline, root, at) => {
  const $ = gsap.utils.selector(root);
  timeline
    .fromTo(
      $("[data-s3-paper]"),
      { y: 160, rotation: 8, opacity: 0, transformOrigin: "50% 50%" },
      { y: 0, rotation: 0, opacity: 1, duration: 0.4, ease: "power3.out" },
      at
    )
    .fromTo(
      $("[data-s3-seal]"),
      { scale: 0, rotation: -40, transformOrigin: "50% 50%" },
      { scale: 1, rotation: 0, duration: 0.25, ease: "back.out(2.2)" },
      at + 0.35
    )
    .fromTo(
      $("[data-s3-confetti]"),
      {
        // Every piece bursts out from the middle to its place.
        x: (_: number, piece: SVGGElement) => 300 - Number(piece.dataset.x),
        y: (_: number, piece: SVGGElement) => 300 - Number(piece.dataset.y),
        scale: 0,
        opacity: 0,
        transformOrigin: "50% 50%",
      },
      { x: 0, y: 0, scale: 1, opacity: 1, duration: 0.45, stagger: { each: 0.008, from: "random" }, ease: "power3.out" },
      at + 0.45
    );
};

export const journeyScenes: JourneyScene[] = [
  { Art: FoundationArt, animate: animateFoundation },
  { Art: SystemArt, animate: animateSystem },
  { Art: ResultArt, animate: animateResult },
];
