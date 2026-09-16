"use client";

import { useEffect, useRef } from "react";
import { animate, createDrawable, stagger } from "animejs";

const nodes = [
  { x: 40, y: 340, r: 6 },
  { x: 110, y: 300, r: 5 },
  { x: 60, y: 240, r: 4 },
  { x: 160, y: 230, r: 7 },
  { x: 120, y: 160, r: 4 },
  { x: 230, y: 250, r: 5 },
  { x: 280, y: 170, r: 8 },
  { x: 320, y: 230, r: 4 },
  { x: 350, y: 90, r: 10 },
] as const;

const edges: [number, number][] = [
  [0, 1],
  [1, 2],
  [1, 3],
  [3, 4],
  [3, 5],
  [5, 6],
  [6, 7],
  [6, 8],
];

const floatIndices = new Set([2, 4, 7]);

export function Constellation({
  className,
  variant = "hero",
}: {
  className?: string;
  variant?: "hero" | "watermark";
}) {
  const isWatermark = variant === "watermark";
  const gradientId = "constellation-gradient";
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (isWatermark) return;
    const svg = svgRef.current;
    if (!svg) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lines = createDrawable(svg.querySelectorAll<SVGLineElement>(".constellation-line"));
    const nodeEls = svg.querySelectorAll<SVGCircleElement>(".constellation-node");

    const lineAnim = animate(lines, {
      draw: ["0 0", "0 1"],
      duration: 900,
      delay: stagger(110),
      ease: "outQuad",
    });
    const nodeAnim = animate(nodeEls, {
      scale: [0, 1],
      opacity: [0, 1],
      duration: 500,
      delay: stagger(110, { start: 150 }),
      ease: "outBack",
    });

    const floatEls = Array.from(floatIndices).map((i) => nodeEls[i]).filter(Boolean);
    const floatAnim = animate(floatEls, {
      translateY: [0, -10],
      duration: 2200,
      delay: stagger(300, { start: 1200 }),
      loop: true,
      alternate: true,
      ease: "inOutSine",
    });

    return () => {
      lineAnim.revert();
      nodeAnim.revert();
      floatAnim.revert();
    };
  }, [isWatermark]);

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 400 400"
      className={className}
      fill="none"
      aria-hidden="true"
      role="presentation"
    >
      {!isWatermark && (
        <defs>
          <linearGradient id={gradientId} x1="0" y1="400" x2="400" y2="0">
            <stop offset="0%" stopColor="var(--color-brand-start)" />
            <stop offset="55%" stopColor="var(--color-brand-mid)" />
            <stop offset="100%" stopColor="var(--color-accent)" />
          </linearGradient>
          <filter id="constellation-glow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="10" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      )}

      {edges.map(([a, b], i) => (
        <line
          key={i}
          className="constellation-line"
          x1={nodes[a].x}
          y1={nodes[a].y}
          x2={nodes[b].x}
          y2={nodes[b].y}
          stroke={isWatermark ? "currentColor" : `url(#${gradientId})`}
          strokeOpacity={isWatermark ? 0.35 : 0.55}
          strokeWidth={isWatermark ? 1.5 : 2}
          strokeLinecap="round"
        />
      ))}

      {nodes.map((node, i) => (
        <circle
          key={i}
          className="constellation-node"
          cx={node.x}
          cy={node.y}
          r={node.r}
          fill={isWatermark ? "currentColor" : `url(#${gradientId})`}
          fillOpacity={isWatermark ? 0.5 : i === nodes.length - 1 ? 1 : 0.9}
          filter={!isWatermark && i === nodes.length - 1 ? "url(#constellation-glow)" : undefined}
          style={{ transformOrigin: `${node.x}px ${node.y}px` }}
        />
      ))}
    </svg>
  );
}
