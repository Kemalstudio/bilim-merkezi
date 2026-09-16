"use client";

import type { ComponentType } from "react";
import { gsap } from "gsap";

/**
 * Illustrations for the method cards, drawn in the site palette. Each comes with a
 * scroll-scrubbed animation of its details; the timeline it is given spans 0–1.
 * An animation may return a cleanup for anything GSAP's revert does not restore.
 */
type Animate = (timeline: gsap.core.Timeline, root: HTMLElement) => void | (() => void);

export type MethodIllustration = { Art: ComponentType; animate: Animate };

const svgProps = {
  viewBox: "0 0 480 300",
  preserveAspectRatio: "xMidYMid slice",
  "aria-hidden": true,
  className: "h-full w-full",
} as const;

/* 01 — Diagnostics: a marked test sheet, a "gaps" chart and a magnifier. */

const diagnosticRows = [
  { y: 112, width: 118, ok: true },
  { y: 144, width: 96, ok: true },
  { y: 176, width: 126, ok: false },
  { y: 208, width: 104, ok: true },
  { y: 240, width: 88, ok: false },
];

// The short rose bars are the gaps to work on.
const diagnosticBars = [
  { height: 84, gap: false },
  { height: 60, gap: false },
  { height: 28, gap: true },
  { height: 96, gap: false },
  { height: 40, gap: true },
];

function DiagnosticsArt() {
  return (
    <svg {...svgProps}>
      <rect width="480" height="300" className="fill-surface-sunken" />
      <circle cx="410" cy="40" r="96" className="fill-accent" opacity="0.55" />
      <circle cx="30" cy="292" r="72" className="fill-border" opacity="0.7" />

      <g transform="rotate(-4 155 164)">
        <rect x="60" y="54" width="190" height="220" rx="14" className="fill-surface stroke-border" strokeWidth="2" />
        <rect x="80" y="76" width="92" height="10" rx="5" className="fill-ink" opacity="0.85" />
        {diagnosticRows.map((row) => (
          <g key={row.y}>
            <rect x="106" y={row.y - 4} width={row.width} height="8" rx="4" className="fill-border" />
            {row.ok ? (
              <path
                data-diag-mark
                d={`M82 ${row.y} l5 5 l10 -11`}
                fill="none"
                className="stroke-emerald"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : (
              <>
                <path data-diag-mark d={`M83 ${row.y - 5} l10 10`} fill="none" className="stroke-rose" strokeWidth="3" strokeLinecap="round" />
                <path data-diag-mark d={`M93 ${row.y - 5} l-10 10`} fill="none" className="stroke-rose" strokeWidth="3" strokeLinecap="round" />
              </>
            )}
          </g>
        ))}
      </g>

      <rect x="284" y="84" width="150" height="176" rx="16" className="fill-surface stroke-border" strokeWidth="2" />
      <rect x="302" y="104" width="64" height="8" rx="4" className="fill-ink" opacity="0.7" />
      <line x1="300" y1="238" x2="418" y2="238" className="stroke-border" strokeWidth="2" />
      {diagnosticBars.map((bar, j) => (
        <rect
          key={j}
          data-diag-bar
          x={304 + j * 23}
          y={236 - bar.height}
          width="14"
          height={bar.height}
          rx="4"
          className={bar.gap ? "fill-rose" : "fill-brand"}
        />
      ))}

      <g data-diag-lens>
        <line x1="222" y1="176" x2="250" y2="204" className="stroke-ink" strokeWidth="10" strokeLinecap="round" />
        <circle cx="200" cy="154" r="32" className="fill-surface stroke-ink" strokeWidth="6" fillOpacity="0.4" />
        <circle cx="189" cy="143" r="7" className="fill-surface" opacity="0.9" />
      </g>
    </svg>
  );
}

const animateDiagnostics: Animate = (timeline, root) => {
  const $ = gsap.utils.selector(root);
  timeline
    .fromTo($("[data-diag-lens]"), { x: -80, y: -50 }, { x: 40, y: 46, duration: 1, ease: "sine.inOut" }, 0)
    .fromTo($("[data-diag-mark]"), { drawSVG: "0%" }, { drawSVG: "100%", duration: 0.12, stagger: 0.1 }, 0.05)
    .fromTo(
      $("[data-diag-bar]"),
      { scaleY: 0, transformOrigin: "50% 100%" },
      { scaleY: 1, duration: 0.3, stagger: 0.08, ease: "power2.out" },
      0.35
    );
};

/* 02 — Personal route: a dotted map with a route, waypoints and a goal flag. */

const ROUTE = "M60 240 C120 240 130 170 190 170 S260 220 310 170 S360 80 420 70";
const routePins = [
  [190, 170],
  [310, 170],
] as const;

function RouteArt() {
  return (
    <svg {...svgProps}>
      <defs>
        <pattern id="method-route-dots" width="18" height="18" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1.4" fill="#0b2233" opacity="0.16" />
        </pattern>
      </defs>
      <rect width="480" height="300" fill="#ffe6bf" />
      <path d="M-20 96 C60 64 120 112 176 84 S264 22 304 52 S392 112 500 64 V-20 H-20 Z" fill="#ffdfa8" />
      <path d="M-20 262 C80 232 150 292 240 264 S360 222 500 252 V320 H-20 Z" fill="#ffdfa8" />
      <rect width="480" height="300" fill="url(#method-route-dots)" />

      <path
        d={ROUTE}
        fill="none"
        stroke="#0b2233"
        strokeOpacity="0.25"
        strokeWidth="3"
        strokeDasharray="2 10"
        strokeLinecap="round"
      />
      <path data-route-line d={ROUTE} fill="none" stroke="#0b2233" strokeWidth="4" strokeLinecap="round" />
      <circle cx="60" cy="240" r="17" fill="none" stroke="#0b2233" strokeOpacity="0.25" strokeWidth="2" />
      <circle cx="60" cy="240" r="9" fill="#0b2233" />

      {routePins.map(([x, y]) => (
        <g key={x}>
          <g data-route-tag>
            <rect x={x + 22} y={y - 64} width="80" height="30" rx="10" fill="#ffffff" />
            <circle cx={x + 38} cy={y - 49} r="6" fill="#0b6a8f" />
            <rect x={x + 50} y={y - 55} width="40" height="5" rx="2.5" fill="#0b2233" opacity="0.8" />
            <rect x={x + 50} y={y - 46} width="28" height="5" rx="2.5" fill="#0b2233" opacity="0.35" />
          </g>
          <g data-route-pin>
            <path d={`M${x} ${y} c-10 -12 -16 -18 -16 -26 a16 16 0 0 1 32 0 c0 8 -6 14 -16 26 z`} fill="#0b2233" />
            <circle cx={x} cy={y - 26} r="6" fill="#f4a83a" />
          </g>
        </g>
      ))}

      <line x1="420" y1="70" x2="420" y2="18" stroke="#0b2233" strokeWidth="4" strokeLinecap="round" />
      <path data-route-flag d="M422 20 L458 30 L422 42 Z" fill="#e2604f" />
      <circle cx="420" cy="70" r="7" fill="#0b2233" />
    </svg>
  );
}

const animateRoute: Animate = (timeline, root) => {
  const $ = gsap.utils.selector(root);
  timeline
    .fromTo($("[data-route-line]"), { drawSVG: "0%" }, { drawSVG: "100%", duration: 1 }, 0)
    .fromTo(
      $("[data-route-pin]"),
      { y: -28, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.12, stagger: 0.28, ease: "back.out(2)" },
      0.3
    )
    .fromTo($("[data-route-tag]"), { x: -14, opacity: 0 }, { x: 0, opacity: 1, duration: 0.12, stagger: 0.28 }, 0.38)
    .fromTo(
      $("[data-route-flag]"),
      { scaleX: 0, transformOrigin: "0% 50%" },
      { scaleX: 1, duration: 0.1, ease: "back.out(2)" },
      0.9
    );
};

/* 03 — Exam format: a stopwatch and an answer sheet filling in. */

const examTicks = Array.from({ length: 12 }, (_, k) => k * 30);
// Which bubble is filled in each answer row.
const examAnswers = [1, 3, 0, 2, 1];

function ExamArt() {
  return (
    <svg {...svgProps}>
      <defs>
        <pattern id="method-exam-grid" width="32" height="32" patternUnits="userSpaceOnUse">
          <path d="M32 0 H0 V32" fill="none" stroke="#ffffff" strokeOpacity="0.06" />
        </pattern>
      </defs>
      <rect width="480" height="300" fill="#072434" />
      <rect width="480" height="300" fill="url(#method-exam-grid)" />
      <circle cx="150" cy="160" r="124" fill="#f4a83a" opacity="0.06" />

      <rect x="138" y="52" width="24" height="18" rx="5" fill="#f4a83a" />
      <circle cx="150" cy="160" r="90" fill="#0d4157" stroke="#f4a83a" strokeWidth="6" />
      {examTicks.map((deg) => (
        <line
          key={deg}
          x1="150"
          y1="82"
          x2="150"
          y2={deg % 90 === 0 ? 96 : 90}
          stroke="#ffffff"
          strokeOpacity="0.45"
          strokeWidth="3"
          strokeLinecap="round"
          transform={`rotate(${deg} 150 160)`}
        />
      ))}
      <circle
        data-exam-arc
        cx="150"
        cy="160"
        r="56"
        fill="none"
        stroke="#f4a83a"
        strokeOpacity="0.9"
        strokeWidth="10"
        strokeLinecap="round"
        transform="rotate(-90 150 160)"
      />
      <line data-exam-hand x1="150" y1="160" x2="150" y2="94" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" />
      <circle cx="150" cy="160" r="8" fill="#f4a83a" />

      <rect x="282" y="54" width="160" height="206" rx="14" fill="#eef3f7" />
      <rect x="300" y="72" width="70" height="8" rx="4" fill="#0b2233" opacity="0.8" />
      {examAnswers.map((answer, row) => {
        const cy = 106 + row * 32;
        return (
          <g key={row}>
            <rect x="300" y={cy - 3} width="12" height="6" rx="3" fill="#0b2233" opacity="0.35" />
            {[0, 1, 2, 3].map((col) => (
              <circle
                key={col}
                cx={330 + col * 28}
                cy={cy}
                r="9"
                fill="none"
                stroke="#0b2233"
                strokeOpacity="0.3"
                strokeWidth="2"
              />
            ))}
            <circle data-exam-fill cx={330 + answer * 28} cy={cy} r="9" fill="#062434" />
          </g>
        );
      })}
    </svg>
  );
}

const animateExam: Animate = (timeline, root) => {
  const $ = gsap.utils.selector(root);
  timeline
    .fromTo($("[data-exam-hand]"), { rotation: 0, svgOrigin: "150 160" }, { rotation: 324, duration: 1 }, 0)
    .fromTo($("[data-exam-arc]"), { drawSVG: "0%" }, { drawSVG: "90%", duration: 1 }, 0)
    .fromTo(
      $("[data-exam-fill]"),
      { scale: 0, transformOrigin: "50% 50%" },
      { scale: 1, duration: 0.1, stagger: 0.15, ease: "back.out(3)" },
      0.15
    );
};

/* 04 — Progress for parents: a phone dashboard with a rising score. */

const progressLine = "M186 192 L204 184 L222 187 L240 170 L258 164 L276 146 L294 134";
const PROGRESS_FROM = 54;
const PROGRESS_TO = 87;

function ProgressArt() {
  return (
    <svg {...svgProps}>
      <rect width="480" height="300" fill="#f0b968" />
      <circle cx="70" cy="252" r="96" fill="#c9dbe8" />
      <circle cx="440" cy="28" r="64" fill="#c9dbe8" opacity="0.75" />

      <rect x="150" y="26" width="180" height="310" rx="30" fill="#0b2233" />
      <rect x="162" y="38" width="156" height="290" rx="22" fill="#ffffff" />
      <rect x="214" y="46" width="52" height="8" rx="4" fill="#0b2233" />
      <rect x="178" y="68" width="64" height="7" rx="3.5" fill="#0b2233" opacity="0.45" />
      <text
        data-progress-value
        x="178"
        y="106"
        className="font-display"
        fill="#0b2233"
        fontSize="30"
        fontWeight="700"
        letterSpacing="-1.5"
      >
        {PROGRESS_TO}%
      </text>
      <rect x="254" y="86" width="48" height="20" rx="10" fill="#f4a83a" />
      <path d="M271 100 l7 -7 l7 7" fill="none" stroke="#0b2233" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

      <rect x="178" y="120" width="124" height="84" rx="12" fill="#eef3f7" />
      <path data-progress-area d={`${progressLine} L294 196 L186 196 Z`} fill="#f4a83a" fillOpacity="0.85" />
      <path
        data-progress-line
        d={progressLine}
        fill="none"
        stroke="#0b6a8f"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle data-progress-dot cx="294" cy="134" r="4.5" fill="#0b6a8f" />

      {[218, 248, 278].map((y, k) => (
        <g key={y} data-progress-row>
          <rect x="178" y={y} width="124" height="22" rx="8" fill="#eef3f7" />
          <circle cx="191" cy={y + 11} r="5" fill={k === 1 ? "#e08a1e" : "#12a3b8"} />
          <rect x="203" y={y + 8} width={[60, 44, 70][k]} height="6" rx="3" fill="#0b2233" opacity="0.55" />
        </g>
      ))}

      <g data-progress-toast>
        <rect x="300" y="150" width="156" height="50" rx="16" fill="#ffffff" />
        <circle cx="324" cy="175" r="12" fill="#f4a83a" />
        <path d="M318 175 l4 4 l8 -8" fill="none" stroke="#0b2233" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="344" y="166" width="90" height="7" rx="3.5" fill="#0b2233" opacity="0.8" />
        <rect x="344" y="179" width="60" height="6" rx="3" fill="#0b2233" opacity="0.35" />
      </g>
    </svg>
  );
}

const animateProgress: Animate = (timeline, root) => {
  const $ = gsap.utils.selector(root);
  const label = root.querySelector<SVGTextElement>("[data-progress-value]");
  const score = { value: PROGRESS_FROM };
  const render = () => {
    if (label) label.textContent = `${Math.round(score.value)}%`;
  };
  render();

  timeline
    .fromTo($("[data-progress-line]"), { drawSVG: "0%" }, { drawSVG: "100%", duration: 0.8 }, 0)
    .fromTo($("[data-progress-area]"), { opacity: 0 }, { opacity: 1, duration: 0.5 }, 0.3)
    .fromTo(
      $("[data-progress-dot]"),
      { scale: 0, transformOrigin: "50% 50%" },
      { scale: 1, duration: 0.08, ease: "back.out(3)" },
      0.78
    )
    .to(score, { value: PROGRESS_TO, duration: 0.8, onUpdate: render }, 0)
    .fromTo($("[data-progress-row]"), { x: 16, opacity: 0 }, { x: 0, opacity: 1, duration: 0.15, stagger: 0.12 }, 0.3)
    .fromTo(
      $("[data-progress-toast]"),
      { x: 40, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.2, ease: "back.out(2)" },
      0.8
    );

  // The counter writes text directly, which GSAP's revert does not undo.
  return () => {
    if (label) label.textContent = `${PROGRESS_TO}%`;
  };
};

export const methodIllustrations: MethodIllustration[] = [
  { Art: DiagnosticsArt, animate: animateDiagnostics },
  { Art: RouteArt, animate: animateRoute },
  { Art: ExamArt, animate: animateExam },
  { Art: ProgressArt, animate: animateProgress },
];
